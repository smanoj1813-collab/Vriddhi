import { useCallback, useEffect, useRef } from 'react'
import { auth } from '@/Firebase/config'

/** Guard deferred settings work against sign-out, account switching and unmount. */
export function useAccountScope(uid: string | null | undefined): () => boolean {
  const current = useRef(uid)
  current.current = uid
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  return useCallback(() => mounted.current && !!uid && current.current === uid && auth.currentUser?.uid === uid, [uid])
}
