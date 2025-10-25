'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

const STATUS_KO: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

export default function SignupRequestDetailClient({ request }: { request: any }) {
  const router = useRouter()
  type PartnerCompany = {
    id: string
    company_name: string
    status?: string
    company_type?: string
  }
  type Site = { id: string; name: string }
  const [form, setForm] = useState({
    full_name: request?.full_name || '',
    email: request?.email || '',
    company: request?.company || request?.company_name || '',
    job_title: request?.job_title || '',
    phone: request?.phone || '',
    // Ensure job_type is available for conditional UI (e.g., site selection)
    job_type: (request?.job_type as string) || 'construction',
  })
  const [busy, setBusy] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [organizations, setOrganizations] = useState<PartnerCompany[]>([])
  const [orgLoading, setOrgLoading] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [sites, setSites] = useState<Site[]>([])
  const [siteLoading, setSiteLoading] = useState(false)
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])

  // Load partner companies
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setOrgLoading(true)
        const res = await fetch('/api/partner-companies', { cache: 'no-store' })
        const j = await res.json().catch(() => ({}))
        if (res.ok && j?.success && Array.isArray(j.data)) {
          if (!active) return
          setOrganizations(j.data as PartnerCompany[])
          // Try to preselect by name match if request.company is present
          const byName = (j.data as PartnerCompany[]).find(
            p =>
              (request?.company || '').trim() && p.company_name === (request?.company || '').trim()
          )
          if (byName?.id) setSelectedOrgId(byName.id)
        }
      } finally {
        setOrgLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [request?.company])

  // Load sites for selected org
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!selectedOrgId) {
        setSites([])
        setSelectedSiteIds([])
        return
      }
      try {
        setSiteLoading(true)
        const p = new URLSearchParams({ partner_company_id: selectedOrgId })
        const res = await fetch(`/api/sites/by-partner?${p.toString()}`, { cache: 'no-store' })
        const j = await res.json().catch(() => [])
        if (active && Array.isArray(j)) {
          setSites(j as Site[])
          // Clear selections that are no longer present
          setSelectedSiteIds(prev => prev.filter(id => (j as Site[]).some(s => s.id === id)))
        }
      } finally {
        setSiteLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [selectedOrgId])

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/signup-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '저장 실패')
      router.refresh()
      alert('저장되었습니다.')
    } catch (e: any) {
      alert(e?.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const approve = async () => {
    // 항상 소속사/현장 필수
    if (!selectedOrgId) {
      alert("'미지정' 상태로는 승인할 수 없습니다. 시공업체(소속사)를 선택해 주세요.")
      return
    }
    if (!selectedSiteIds.length) {
      alert('작업자는 최소 1개 이상의 현장 배정이 필요합니다.')
      return
    }

    const isOverride = String(request?.status || '').toLowerCase() === 'rejected'
    if (isOverride) {
      const ok = confirm('현재 상태는 "거절"입니다. 승인으로 전환하시겠습니까?')
      if (!ok) return
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/signup-requests/${request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrgId || undefined,
          siteIds: selectedSiteIds.length ? selectedSiteIds : undefined,
          allowOverride: isOverride,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '승인 실패')
      alert('승인되었습니다.')
      router.push(
        j?.created_user_id
          ? `/dashboard/admin/users/${j.created_user_id}`
          : '/dashboard/admin/users'
      )
    } catch (e: any) {
      alert(e?.message || '승인 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    if (!confirm('요청을 거절하시겠습니까?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/signup-requests/${request.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '거절 실패')
      alert('거절 처리되었습니다.')
      router.push('/dashboard/admin/signup-requests')
    } catch (e: any) {
      alert(e?.message || '거절 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm('해당 가입 요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/signup-requests/${request.id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '삭제 실패')
      alert('삭제되었습니다.')
      router.push('/dashboard/admin/signup-requests')
    } catch (e: any) {
      alert(e?.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          상태:{' '}
          <span className="font-medium text-foreground">
            {STATUS_KO[String(request?.status || '').toLowerCase()] || '-'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={save} disabled={busy}>
            저장
          </Button>
          <Button onClick={approve} disabled={busy}>
            승인
          </Button>
          <Button
            variant="destructive"
            onClick={reject}
            disabled={busy || request?.status !== 'pending'}
          >
            거절
          </Button>
          {['pending', 'rejected'].includes(String(request?.status || '').toLowerCase()) && (
            <Button variant="destructive" onClick={remove} disabled={busy}>
              삭제
            </Button>
          )}
        </div>
      </div>

      <Row label="이름">
        <Input
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
        />
      </Row>
      <Row label="이메일">
        <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </Row>
      <Row label="소속사">
        <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
      </Row>
      <Row label="직함">
        <Input
          value={form.job_title}
          onChange={e => setForm({ ...form, job_title: e.target.value })}
        />
      </Row>
      <Row label="휴대폰">
        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      </Row>
      {/* 업종 선택 제거 (시스템 정책 상 시공업체 기준) */}

      {/* Organization selection for approval */}
      <Row label="시공업체(소속사)">
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedOrgId}
          onChange={e => setSelectedOrgId(e.target.value)}
          disabled={orgLoading || String(request?.status || '').toLowerCase() === 'approved'}
        >
          <option value="">미지정</option>
          {organizations
            .filter(org => (org.company_type || '').toLowerCase() !== 'supplier')
            .map(org => (
              <option key={org.id} value={org.id}>
                {org.company_name}
              </option>
            ))}
        </select>
      </Row>
      <div className="text-xs text-muted-foreground ml-[33%] -mt-2">
        ‘미지정’ 상태로는 승인할 수 없습니다. 반드시 소속사를 선택해 주세요.
      </div>

      {/* Site selection when construction */}
      {(form.job_type as string) === 'construction' && (
        <Row label="배정 현장">
          <select
            multiple
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedSiteIds}
            onChange={e =>
              setSelectedSiteIds(Array.from(e.target.selectedOptions).map(o => o.value))
            }
            disabled={
              !selectedOrgId ||
              siteLoading ||
              String(request?.status || '').toLowerCase() === 'approved'
            }
          >
            {!selectedOrgId ? (
              <option value="" disabled>
                먼저 소속사를 선택하세요
              </option>
            ) : sites.length === 0 ? (
              <option value="" disabled>
                연결된 현장이 없습니다
              </option>
            ) : (
              sites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </select>
        </Row>
      )}

      <Row label="거절 사유">
        <Input
          placeholder="거절 시 사유(선택)"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Row>
    </div>
  )
}
