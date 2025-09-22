'use client'

import React from 'react'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const Container: React.FC<ContainerProps> = ({ size = 'md', className, children, ...props }) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    full: 'max-w-none',
  }

  return (
    <div className={`container ${sizeClasses[size]} ${className || ''}`} {...props}>
      {children}
    </div>
  )
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

const Stack: React.FC<StackProps> = ({
  gap = 'md',
  align = 'stretch',
  className,
  children,
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-[var(--gap)]',
    lg: 'gap-6',
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  return (
    <div
      className={`stack ${gapClasses[gap]} ${alignClasses[align]} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
}

const Row: React.FC<RowProps> = ({
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = true,
  className,
  children,
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-[var(--gap)]',
    lg: 'gap-6',
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }

  return (
    <div
      className={`row ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${wrap ? 'flex-wrap' : 'flex-nowrap'} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg'
}

const Grid: React.FC<GridProps> = ({ cols = 2, gap = 'md', className, children, ...props }) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-[var(--gap)]',
    lg: 'gap-6',
  }

  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className || ''}`} {...props}>
      {children}
    </div>
  )
}

export { Container, Stack, Row, Grid }
