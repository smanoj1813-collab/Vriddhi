import type { CourseManifest } from './types'
import { loadPdfLibs } from '@/shared/utils/pdfRuntime'

export async function downloadCourseCertificate(input: {
  manifest: CourseManifest
  learnerName: string
  uid: string
}): Promise<void> {
  const { jsPDF } = await loadPdfLibs()
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  const today = new Date()
  const issuedOn = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  const credentialId = `${input.manifest.code}-${today.toISOString().slice(0, 10).replace(/-/g, '')}-${input.uid.slice(-6).toUpperCase()}`

  pdf.setFillColor(248, 251, 250)
  pdf.rect(0, 0, width, height, 'F')
  pdf.setDrawColor(13, 148, 136)
  pdf.setLineWidth(1.5)
  pdf.roundedRect(12, 12, width - 24, height - 24, 4, 4, 'S')
  pdf.setTextColor(15, 118, 110)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('VRIDDHI · LEARNING', width / 2, 38, { align: 'center' })
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(30)
  pdf.text('Certificate of Completion', width / 2, 61, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(15)
  pdf.text('This certifies that', width / 2, 82, { align: 'center' })
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(25)
  pdf.text(input.learnerName || 'Learner', width / 2, 98, { align: 'center', maxWidth: width - 60 })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(14)
  pdf.text('has completed', width / 2, 115, { align: 'center' })
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(19)
  pdf.text(input.manifest.title, width / 2, 128, { align: 'center', maxWidth: width - 54 })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.text(`${input.manifest.code} · ${input.manifest.totalHours} learning hours · Version ${input.manifest.version}`, width / 2, 141, { align: 'center' })
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(10)
  pdf.text(`Issued ${issuedOn}`, 28, height - 29)
  pdf.text(`Credential ID: ${credentialId}`, width - 28, height - 29, { align: 'right' })
  pdf.setFontSize(8)
  pdf.text('Issued after the platform learning, quiz and module-assessment eligibility checks were met.', width / 2, height - 22, { align: 'center' })
  pdf.save(`${input.manifest.code.toLowerCase()}-certificate.pdf`)
}
