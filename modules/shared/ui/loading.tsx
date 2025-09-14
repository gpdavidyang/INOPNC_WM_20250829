'use client'

import React from 'react'

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-1',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  }

  return <div className={`loading-spinner ${sizeClasses[size]} ${className || ''}`} {...props} />
}

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: boolean
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '20px',
  rounded = false,
  className,
  style,
  ...props
}) => {
  const skeletonStyle = {
    width,
    height,
    borderRadius: rounded ? '9999px' : 'var(--r)',
    ...style,
  }

  return <div className={`loading-skeleton ${className || ''}`} style={skeletonStyle} {...props} />
}

export interface LoadingPageProps {
  title?: string
  description?: string
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  title = '로딩 중...',
  description = '잠시만 기다려 주세요.',
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)]">
      <LoadingSpinner size="lg" className="mb-4" />
      <h2 className="t-h2 mb-2">{title}</h2>
      <p className="t-cap text-center max-w-sm">{description}</p>
    </div>
  )
}

export { LoadingSpinner, LoadingSkeleton, LoadingPage }
