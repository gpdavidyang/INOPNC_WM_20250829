'use client'

import { sitesApi } from '@/lib/api/sites'
import type { Site } from '@/types'
import { useCallback, useEffect, useState } from 'react'

export type SiteFormState = {
  name: string
  address: string
  address_detail: string
  description: string
  status: 'planning' | 'active' | 'inactive' | 'completed'
  start_date: string
  end_date: string
  manager_name: string
  manager_phone: string
  manager_email: string
  safety_manager_name: string
  safety_manager_phone: string
  accommodation_name: string
  accommodation_address: string
  accommodation_address_detail: string
  accommodation_phone: string
  organization_id: string
}

const toDateInput = (value?: string | null) => {
  if (!value) return ''
  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export const useSiteForm = (initial?: Partial<Site> | null) => {
  const [form, setForm] = useState<SiteFormState>(() => ({
    name: initial?.name || '',
    address: initial?.address || '',
    address_detail: '', // Address detailed input usually starts empty
    description: String(initial?.description || ''),
    status: (initial?.status as SiteFormState['status']) || 'planning',
    start_date: initial?.start_date ? toDateInput(initial.start_date) : '',
    end_date: initial?.end_date ? toDateInput(initial.end_date) : '',
    manager_name: String(initial?.manager_name || ''),
    manager_phone: String(
      (initial as any)?.manager_phone || (initial as any)?.construction_manager_phone || ''
    ),
    manager_email: String(
      (initial as any)?.manager_email || (initial as any)?.construction_manager_email || ''
    ),
    safety_manager_name: String(initial?.safety_manager_name || ''),
    safety_manager_phone: String(initial?.safety_manager_phone || ''),
    accommodation_name: String(initial?.accommodation_name || ''),
    accommodation_address: String(initial?.accommodation_address || ''),
    accommodation_address_detail: '',
    accommodation_phone: String((initial as any)?.accommodation_phone || ''),
    organization_id: initial?.organization_id ? String(initial.organization_id) : '',
  }))

  const [startDateTbd, setStartDateTbd] = useState(() => !initial?.start_date)
  const [endDateTbd, setEndDateTbd] = useState(() => !initial?.end_date)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [orgLoading, setOrgLoading] = useState(false)

  const fetchOrganizations = useCallback(async () => {
    setOrgLoading(true)
    try {
      const orgs = await sitesApi.getOrganizations()
      setOrganizations(orgs.map((o: any) => ({ id: String(o.id), name: o.name || '미지정' })))
    } catch (err) {
      console.error('Failed to fetch organizations', err)
    } finally {
      setOrgLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const setFieldValue = (field: keyof SiteFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const buildFullAddress = (base?: string, detail?: string) => {
    const b = (base ?? '').trim()
    const d = (detail ?? '').trim()
    if (b && d) return `${b} ${d}`
    return b || d || ''
  }

  const submit = async (id?: string) => {
    setError(null)
    if (!form.name.trim()) {
      setError('현장명은 필수입니다.')
      return null
    }
    const fullAddr = buildFullAddress(form.address, form.address_detail)
    if (!fullAddr) {
      setError('주소는 필수입니다.')
      return null
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        address: fullAddr,
        start_date: startDateTbd ? null : form.start_date || null,
        end_date: endDateTbd ? null : form.end_date || null,
        accommodation_address:
          buildFullAddress(form.accommodation_address, form.accommodation_address_detail) || null,
      }

      const result = await sitesApi.saveSite(id, payload)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    startDateTbd,
    endDateTbd,
    saving,
    error,
    organizations,
    orgLoading,
    setFieldValue,
    setStartDateTbd,
    setEndDateTbd,
    setError,
    submit,
  }
}
