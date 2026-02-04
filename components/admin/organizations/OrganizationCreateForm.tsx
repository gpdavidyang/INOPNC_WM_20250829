'use client'

import { AddressSearchInput } from '@/components/ui/address-search-input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Building2, Info, Mail, MapPin, Phone, RefreshCw, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const buildFullAddress = (base: string, detail: string) => {
  const trimmedBase = base.trim()
  const trimmedDetail = detail.trim()
  if (trimmedBase && trimmedDetail) return `${trimmedBase} ${trimmedDetail}`
  if (trimmedBase) return trimmedBase
  if (trimmedDetail) return trimmedDetail
  return ''
}

const ORG_TYPES = [
  { value: 'subcontractor', label: '협력사 (Subcontractor)' },
  { value: 'general_contractor', label: '원청 (General Contractor)' },
  { value: 'supplier', label: '자재업체 (Supplier)' },
]

export default function OrganizationCreateForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [type, setType] = useState('subcontractor')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: '입력 오류', description: '업체명을 입력해주세요.', variant: 'destructive' })
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          address: buildFullAddress(address, addressDetail),
          contact_email: email.trim(),
          contact_phone: phone.trim(),
          description: description.trim(),
        }),
        credentials: 'include',
      })

      const json = await res.json()
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || '업체 생성에 실패했습니다.')
      }

      toast({
        title: '등록 완료',
        description: `"${name}" 업체가 성공적으로 등록되었습니다.`,
        variant: 'success',
      })

      // Redirect to list
      router.push('/dashboard/admin/organizations')
      router.refresh()
    } catch (err: any) {
      toast({
        title: '등록 실패',
        description: err?.message || '업체 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. 기본 정보 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-800 tracking-tight text-sm">기본 정보</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">
              업체명 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="업체명을 입력하세요"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
              required
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1">업체 유형</label>
            <Select value={type} onValueChange={setType} disabled={busy}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium">
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. 연락처 정보 섹션 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <Phone className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-800 tracking-tight text-sm">연락처 및 상세 정보</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 opacity-50" /> 연락처 이메일
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 opacity-50" /> 유선 연락처
            </label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
              disabled={busy}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 opacity-50" /> 사업장 주소
          </label>
          <AddressSearchInput
            id="organization-address"
            value={address}
            onValueChange={setAddress}
            detailValue={addressDetail}
            onDetailChange={setAddressDetail}
            placeholder="도로명 주소 검색"
            detailPlaceholder="상세 주소 (동/층/호 등)"
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 opacity-50" /> 업체 비고
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="업체에 대한 특이사항이나 설명을 입력하세요"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all resize-none"
            disabled={busy}
          />
        </div>
      </div>

      {/* 하단 액션 바 */}
      <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-11 px-6 rounded-xl font-semibold text-slate-500 border-slate-200 hover:bg-slate-50 transition-all text-sm"
          disabled={busy}
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={busy}
          className="h-11 px-8 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold shadow-lg shadow-blue-900/10 transition-all text-sm gap-2"
        >
          {busy ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              등록 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              업체 등록 완료
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
