'use client'

import { AddressSearchInput } from '@/components/ui/address-search-input'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import React from 'react'

interface FieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
  hint?: string
}

const Field = ({ label, required, children, className, hint }: FieldProps) => (
  <div className={cn('space-y-2', className)}>
    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
    {hint && <p className="text-[10px] text-gray-400 px-1 italic">{hint}</p>}
  </div>
)

export const BasicInfoSection = ({
  form,
  setFieldValue,
  organizations,
  orgLoading,
  startDateTbd,
  setStartDateTbd,
  endDateTbd,
  setEndDateTbd,
}: any) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">기본 정보</h3>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Field label="현장명" required className="md:col-span-8">
        <Input
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none focus:ring-2 focus:ring-blue-500/20"
          value={form.name}
          onChange={e => setFieldValue('name', e.target.value)}
          placeholder="현장 이름을 입력하세요"
        />
      </Field>
      <Field label="상태" className="md:col-span-4">
        <CustomSelect value={form.status} onValueChange={v => setFieldValue('status', v)}>
          <CustomSelectTrigger className="h-11 rounded-xl border-none bg-gray-50/50 dark:bg-gray-900/50">
            <CustomSelectValue placeholder="상태 선택" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="planning">준비 중</CustomSelectItem>
            <CustomSelectItem value="active">진행 중</CustomSelectItem>
            <CustomSelectItem value="inactive">중단</CustomSelectItem>
            <CustomSelectItem value="completed">완료</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>
      </Field>

      <Field label="현장 주소" required className="md:col-span-12">
        <AddressSearchInput
          value={form.address}
          onValueChange={v => setFieldValue('address', v)}
          detailValue={form.address_detail}
          onDetailChange={v => setFieldValue('address_detail', v)}
        />
      </Field>

      <Field label="소속 (시공사)" className="md:col-span-12">
        <CustomSelect
          value={form.organization_id || 'none'}
          onValueChange={v => setFieldValue('organization_id', v === 'none' ? '' : v)}
        >
          <CustomSelectTrigger className="h-11 rounded-xl border-none bg-gray-50/50 dark:bg-gray-900/50">
            <CustomSelectValue placeholder={orgLoading ? '로딩 중...' : '소속 선택'} />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="none">연동 안 함</CustomSelectItem>
            {organizations.map((org: any) => (
              <CustomSelectItem key={org.id} value={org.id}>
                {org.name}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
      </Field>

      <Field
        label="착공일"
        required
        className="md:col-span-6"
        hint="날짜가 미정인 경우 TBD를 체크하세요."
      >
        <Input
          type="date"
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none mb-2"
          value={form.start_date}
          onChange={e => setFieldValue('start_date', e.target.value)}
          disabled={startDateTbd}
        />
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={startDateTbd}
            onChange={e => setStartDateTbd(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-bold text-gray-500">시작일 미정 (TBD)</span>
        </div>
      </Field>

      <Field label="준공일" className="md:col-span-6">
        <Input
          type="date"
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none mb-2"
          value={form.end_date}
          onChange={e => setFieldValue('end_date', e.target.value)}
          disabled={endDateTbd}
        />
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={endDateTbd}
            onChange={e => setEndDateTbd(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-bold text-gray-500">종료일 미정 (TBD)</span>
        </div>
      </Field>
    </div>
  </div>
)

export const ManagerInfoSection = ({ form, setFieldValue }: any) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">담당자 정보</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Field label="현장 소장 (공사 담당)">
        <Input
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none"
          value={form.manager_name}
          onChange={e => setFieldValue('manager_name', e.target.value)}
        />
      </Field>
      <Field label="연락처">
        <Input
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none"
          value={form.manager_phone}
          onChange={e => setFieldValue('manager_phone', e.target.value)}
        />
      </Field>
      <Field label="이메일">
        <Input
          type="email"
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none"
          value={form.manager_email}
          onChange={e => setFieldValue('manager_email', e.target.value)}
        />
      </Field>
      <Field label="안전 관리자">
        <Input
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none"
          value={form.safety_manager_name}
          onChange={e => setFieldValue('safety_manager_name', e.target.value)}
        />
      </Field>
    </div>
  </div>
)

export const AccommodationSection = ({ form, setFieldValue }: any) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">숙소 및 기타 정보</h3>
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="숙소명">
          <Input
            className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none"
            value={form.accommodation_name}
            onChange={e => setFieldValue('accommodation_name', e.target.value)}
          />
        </Field>
        <Field label="숙소 연락처">
          <Input
            className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none"
            value={form.accommodation_phone}
            onChange={e => setFieldValue('accommodation_phone', e.target.value)}
          />
        </Field>
      </div>
      <Field label="숙소 주소">
        <Input
          className="h-11 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border-none"
          value={form.accommodation_address}
          onChange={e => setFieldValue('accommodation_address', e.target.value)}
          placeholder="검색 또는 직접 입력"
        />
      </Field>
      <Field label="현장 설명 / 메모">
        <Textarea
          className="min-h-[120px] rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border-none p-4"
          value={form.description}
          onChange={e => setFieldValue('description', e.target.value)}
          placeholder="현장 특이사항이나 추가 설명을 입력하세요"
        />
      </Field>
    </div>
  </div>
)
