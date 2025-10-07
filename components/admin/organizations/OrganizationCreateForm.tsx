'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import StickyActionBar from '@/components/ui/sticky-action-bar'

export default function OrganizationCreateForm() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          contact_email: email,
          contact_phone: phone,
        }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || '조직 생성 실패')
      }
      setMsg('조직이 생성되었습니다.')
      setName('')
      setAddress('')
      setEmail('')
      setPhone('')
    } catch (err: any) {
      setMsg(err?.message || '조직 생성 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-20">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">조직명</label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">이메일</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">전화</label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">주소</label>
        <Input value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? '처리 중…' : '등록'}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>

      <StickyActionBar>
        <div className="mx-auto max-w-6xl flex items-center justify-end gap-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? '처리 중…' : '등록'}
          </Button>
        </div>
      </StickyActionBar>
    </form>
  )
}
