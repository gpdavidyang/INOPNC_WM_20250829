'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AddressSearchInput } from '@/components/ui/address-search-input'

const buildFullAddress = (base: string, detail: string) => {
  const trimmedBase = base.trim()
  const trimmedDetail = detail.trim()
  if (trimmedBase && trimmedDetail) return `${trimmedBase} ${trimmedDetail}`
  if (trimmedBase) return trimmedBase
  if (trimmedDetail) return trimmedDetail
  return ''
}

export default function OrganizationCreateForm() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
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
          address: buildFullAddress(address, addressDetail),
          contact_email: email,
          contact_phone: phone,
        }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || '조직 생성 실패')
      }
      setMsg('조직이 생성되었습니다.')
      setName('')
      setAddress('')
      setAddressDetail('')
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
        <AddressSearchInput
          id="organization-address"
          value={address}
          onValueChange={setAddress}
          detailValue={addressDetail}
          onDetailChange={setAddressDetail}
          placeholder="도로명 주소 검색 후 선택하세요"
          detailPlaceholder="상세 주소 (동/층/호 등)"
          helperText="도로명 주소 선택 후 상세 주소(동/호, 층 등)를 입력해주세요."
          disabled={busy}
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        {msg && <span className="text-sm text-muted-foreground mr-auto">{msg}</span>}
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? '처리 중…' : '등록'}
        </Button>
      </div>
    </form>
  )
}
