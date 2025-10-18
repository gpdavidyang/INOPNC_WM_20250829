'use client'

import { useEffect } from 'react'

export default function ScrollUnlock() {
  useEffect(() => {
    try {
      document.body.classList.remove('modal-open')
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
      }
    } catch (e) {
      /* noop: defensive cleanup only */
    }
  }, [])
  return null
}
