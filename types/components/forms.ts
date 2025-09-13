/**
 * 폼 컴포넌트 Props 타입 정의
 */

import { ChangeEventHandler, FocusEventHandler, ReactNode } from 'react'
import { BaseComponentProps } from './index'

// Form Field Base Props
export interface FormFieldProps extends BaseComponentProps {
  name: string
  label?: string
  helperText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
}

// Input Props
export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'
  value?: string | number
  defaultValue?: string | number
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  size?: 'sm' | 'md' | 'lg'
  onChange?: ChangeEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  onFocus?: FocusEventHandler<HTMLInputElement>
  prefix?: ReactNode
  suffix?: ReactNode
}

// Textarea Props
export interface TextareaProps extends FormFieldProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  rows?: number
  cols?: number
  maxLength?: number
  minLength?: number
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  onFocus?: FocusEventHandler<HTMLTextAreaElement>
}

// Select Props
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectProps extends FormFieldProps {
  value?: string | number | string[] | number[]
  defaultValue?: string | number | string[] | number[]
  options: SelectOption[]
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  onChange?: (value: string | number | string[] | number[]) => void
  onSearch?: (query: string) => void
}

// Checkbox Props
export interface CheckboxProps extends Omit<FormFieldProps, 'label'> {
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
  value?: string | number
  onChange?: (checked: boolean) => void
  label?: ReactNode
}

// Radio Props
export interface RadioProps extends Omit<FormFieldProps, 'label'> {
  checked?: boolean
  defaultChecked?: boolean
  value: string | number
  onChange?: (value: string | number) => void
  label?: ReactNode
}

// Radio Group Props
export interface RadioGroupProps extends FormFieldProps {
  value?: string | number
  defaultValue?: string | number
  options: Array<{
    value: string | number
    label: string
    disabled?: boolean
  }>
  orientation?: 'horizontal' | 'vertical'
  onChange?: (value: string | number) => void
}

// Switch Props
export interface SwitchProps extends Omit<FormFieldProps, 'label'> {
  checked?: boolean
  defaultChecked?: boolean
  size?: 'sm' | 'md' | 'lg'
  onChange?: (checked: boolean) => void
  label?: ReactNode
  labelPosition?: 'left' | 'right'
}

// File Upload Props
export interface FileUploadProps extends FormFieldProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  value?: File | File[]
  onChange?: (files: File | File[]) => void
  onError?: (error: string) => void
  preview?: boolean
  dragAndDrop?: boolean
}

// Date Picker Props
export interface DatePickerProps extends FormFieldProps {
  value?: Date | string
  defaultValue?: Date | string
  min?: Date | string
  max?: Date | string
  format?: string
  showTime?: boolean
  disabledDates?: (date: Date) => boolean
  onChange?: (date: Date | string) => void
}

// Form Props
export interface FormProps extends BaseComponentProps {
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>
  onReset?: () => void
  initialValues?: Record<string, unknown>
  validation?: Record<string, unknown>
  loading?: boolean
  disabled?: boolean
}

// Form Group Props
export interface FormGroupProps extends BaseComponentProps {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  orientation?: 'horizontal' | 'vertical'
}