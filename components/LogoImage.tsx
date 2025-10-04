'use client'

import React from 'react'

type Props = {
  srcPrimary?: string
  alt?: string
  width?: number
  height?: number
  className?: string
}

export default function LogoImage({
  srcPrimary = '/images/inopnc-logo-n.png',
  alt = 'INOPNC 로고',
  width = 114,
  height = 38,
  className,
}: Props) {
  const [stage, setStage] = React.useState<'primary' | 'backup' | 'inline'>('primary')
  const INLINE_SVG_PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg width="114" height="38" viewBox="0 0 114 38" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="114" height="38" fill="#1A254F"/>' +
        '<text x="57" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#FFFFFF">INOPNC</text>' +
        '</svg>'
    )

  const src =
    stage === 'primary'
      ? srcPrimary
      : stage === 'backup'
        ? '/images/inopnc-logo-n.png'
        : '/images/logo_g.png'

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding="async"
      loading="eager"
      onError={() => {
        if (stage === 'primary') setStage('backup')
        else if (stage === 'backup') setStage('inline')
      }}
    />
  )
}
