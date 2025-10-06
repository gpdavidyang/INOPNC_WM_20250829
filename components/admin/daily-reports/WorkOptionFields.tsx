'use client'

import React, { useMemo, useState } from 'react'
import { useWorkOptions } from '@/hooks/use-work-options'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

interface WorkOptionFieldsProps {
  defaultComponentName?: string | null
  defaultWorkProcess?: string | null
  defaultWorkSection?: string | null
}

export default function WorkOptionFields({
  defaultComponentName,
  defaultWorkProcess,
  defaultWorkSection,
}: WorkOptionFieldsProps) {
  const { componentTypes, processTypes } = useWorkOptions()

  const componentLabels = useMemo(() => {
    let base = componentTypes.map(o => o.option_label)
    if (defaultComponentName && !base.includes(defaultComponentName)) {
      base = [defaultComponentName, ...base]
    }
    if (!base.includes('기타')) base = [...base, '기타']
    return base
  }, [componentTypes, defaultComponentName])

  const processLabels = useMemo(() => {
    let base = processTypes.map(o => o.option_label)
    if (defaultWorkProcess && !base.includes(defaultWorkProcess)) {
      base = [defaultWorkProcess, ...base]
    }
    if (!base.includes('기타')) base = [...base, '기타']
    return base
  }, [processTypes, defaultWorkProcess])

  const [comp, setComp] = useState<string>(defaultComponentName || '')
  const [proc, setProc] = useState<string>(defaultWorkProcess || '')
  const [compOther, setCompOther] = useState('')
  const [procOther, setProcOther] = useState('')

  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">부재명</label>
        <CustomSelect
          value={comp}
          onValueChange={v => {
            setComp(v)
            if (v !== '기타') setCompOther('')
          }}
        >
          <CustomSelectTrigger>
            <CustomSelectValue placeholder="부재명 선택" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            {componentLabels.map(label => (
              <CustomSelectItem key={label} value={label}>
                {label}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
        {comp === '기타' && (
          <input
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="부재명을 직접 입력하세요"
            value={compOther}
            onChange={e => setCompOther(e.target.value)}
          />
        )}
        <input
          type="hidden"
          name="component_name"
          value={comp === '기타' ? (compOther ? `기타: ${compOther}` : '기타') : comp}
        />
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">작업공정</label>
        <CustomSelect
          value={proc}
          onValueChange={v => {
            setProc(v)
            if (v !== '기타') setProcOther('')
          }}
        >
          <CustomSelectTrigger>
            <CustomSelectValue placeholder="작업공정 선택" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            {processLabels.map(label => (
              <CustomSelectItem key={label} value={label}>
                {label}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
        {proc === '기타' && (
          <input
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="작업공정을 직접 입력하세요"
            value={procOther}
            onChange={e => setProcOther(e.target.value)}
          />
        )}
        <input
          type="hidden"
          name="work_process"
          value={proc === '기타' ? (procOther ? `기타: ${procOther}` : '기타') : proc}
        />
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">세부 구간</label>
        <input
          type="text"
          name="work_section"
          defaultValue={defaultWorkSection || ''}
          placeholder="예: 3층 동측"
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
