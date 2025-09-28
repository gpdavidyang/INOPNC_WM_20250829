'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function OrganizationCreateForm() {
  const [name, setName] = useState('')
  const [type, setType] = useState('partner')
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
          type,
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
      setType('partner')
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">조직명</label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">유형</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="partner">partner</option>
            <option value="customer">customer</option>
            <option value="internal">internal</option>
          </select>
        </div>
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
        <Button type="submit" variant="outline" disabled={busy}>
          {busy ? '처리 중…' : '등록'}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </form>
  )
}
