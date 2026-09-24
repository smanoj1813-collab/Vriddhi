// src/shared/utils/paymentGateway.ts
//
// Client wrapper for online fee payments. Talks to the createFeePaymentOrder /
// verifyFeePayment Cloud Functions and drives the Razorpay checkout widget.
//
// "Flow now, keys later": when the gateway isn't configured server-side the
// create call returns { configured:false } and this resolves { status:
// 'unavailable' }, so the caller can fall back to offline recording / proof.

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'

type OrderResult =
  | { configured: false }
  | { configured: true; orderId: string; amount: number; currency: string; keyId: string }

export type OnlinePaymentResult =
  | { status: 'unavailable' }
  | { status: 'cancelled' }
  | { status: 'paid'; receiptPaymentId: string }
  | { status: 'failed'; message: string }

function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  const w = window as unknown as { Razorpay?: unknown }
  if (w.Razorpay) return Promise.resolve(true)
  return new Promise(resolve => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

/**
 * Start an online payment for a fee. Resolves with the outcome; a `paid` result
 * means the Cloud Function already verified the signature and credited the fee.
 */
export async function startOnlinePayment(args: {
  paymentId: string
  payerName: string
  payerEmail?: string
  payerPhone?: string
  description?: string
}): Promise<OnlinePaymentResult> {
  const create = httpsCallable<{ paymentId: string }, OrderResult>(functions, 'createFeePaymentOrder')
  let order: OrderResult
  try {
    const res = await create({ paymentId: args.paymentId })
    order = res.data
  } catch (e) {
    return { status: 'failed', message: e instanceof Error ? e.message : 'Could not start the payment.' }
  }
  if (!order.configured) return { status: 'unavailable' }

  const loaded = await loadRazorpay()
  if (!loaded) return { status: 'failed', message: 'Could not load the payment checkout.' }

  const verify = httpsCallable<
    { orderId: string; paymentId: string; gatewayPaymentId: string; signature: string },
    { status: string }
  >(functions, 'verifyFeePayment')

  return new Promise<OnlinePaymentResult>(resolve => {
    type RazorpayOptions = {
      key: string
      amount: number
      currency: string
      order_id: string
      name: string
      description: string
      prefill: { name: string; email?: string; contact?: string }
      handler: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void
      modal: { ondismiss: () => void }
      theme: { color: string }
      on: (event: string, cb: () => void) => void
      open: () => void
    }
    const RazorpayCtor = (window as unknown as { Razorpay: new (o: RazorpayOptions) => RazorpayOptions }).Razorpay
    const rzp = new RazorpayCtor({
      key: order.keyId,
      amount: Math.round(order.amount * 100),
      currency: order.currency || 'INR',
      order_id: order.orderId,
      name: 'College Fees',
      description: args.description || 'Fee payment',
      prefill: { name: args.payerName, email: args.payerEmail, contact: args.payerPhone },
      handler: async resp => {
        try {
          await verify({
            orderId: resp.razorpay_order_id || order.orderId,
            paymentId: args.paymentId,
            gatewayPaymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
          })
          resolve({ status: 'paid', receiptPaymentId: resp.razorpay_payment_id })
        } catch (e) {
          resolve({ status: 'failed', message: e instanceof Error ? e.message : 'Payment verification failed.' })
        }
      },
      modal: { ondismiss: () => resolve({ status: 'cancelled' }) },
      theme: { color: '#0d9488' },
      on: () => undefined,
      open: () => undefined,
    })
    rzp.on('payment.failed', () => resolve({ status: 'failed', message: 'The payment was declined.' }))
    rzp.open()
  })
}
