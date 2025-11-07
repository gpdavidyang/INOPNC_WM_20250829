'use client'

import { Button } from '@/components/ui/button'

export function ToggleAllSectionsButton() {
  const handleClick = () => {
    try {
      window.dispatchEvent(new CustomEvent('toggle-all-sections'))
    } catch {}
  }
  return (
    <Button variant="outline" size="standard" onClick={handleClick}>
      모두 펼치기
    </Button>
  )
}
