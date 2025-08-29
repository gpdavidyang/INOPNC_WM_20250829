'use client'

import { useEffect } from 'react'

export function ProductionQualityOptimizer() {
  useEffect(() => {
    // CRITICAL: Force high-quality rendering in production
    const isProduction = window.location.hostname !== 'localhost'
    
    // Add viewport meta tags for high DPI screens with production-specific settings
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover, target-densityDpi=device-dpi'
      )
    }
    
    // Add color profile meta tag to ensure correct color space
    const colorProfileMeta = document.createElement('meta')
    colorProfileMeta.name = 'color-scheme'
    colorProfileMeta.content = 'light dark'
    document.head.appendChild(colorProfileMeta)
    
    // Force sRGB color space
    const colorGamutMeta = document.createElement('meta')
    colorGamutMeta.name = 'supported-color-schemes'
    colorGamutMeta.content = 'light dark'
    document.head.appendChild(colorGamutMeta)

    // Add AGGRESSIVE production quality optimization styles
    const style = document.createElement('style')
    style.innerHTML = `
      /* CRITICAL PRODUCTION QUALITY FIX - Maximum Quality Settings */
      /* Force high-quality rendering for ALL displays */
      * {
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        text-rendering: optimizeLegibility !important;
        font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "ss01" 1 !important;
        font-kerning: normal !important;
        font-synthesis: none !important;
        -webkit-text-stroke: 0 !important;
        text-stroke: 0 !important;
      }
        
      body {
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        perspective: 1000px;
        -webkit-perspective: 1000px;
        /* Force GPU acceleration */
        will-change: transform;
        /* Ensure correct color rendering */
        color-rendering: optimizeQuality !important;
        shape-rendering: geometricPrecision !important;
        /* Prevent font boosting */
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
      }
        
      img, svg {
        /* Maximum quality image rendering */
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        image-rendering: pixelated !important;
        image-rendering: high-quality !important;
        -ms-interpolation-mode: bicubic !important;
        /* Prevent compression artifacts */
        filter: none !important;
        -webkit-filter: none !important;
      }
      
      /* High DPI specific overrides */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        * {
          -webkit-font-smoothing: antialiased !important;
          /* Add subtle text stroke for better rendering */
          -webkit-text-stroke: 0.02px rgba(0,0,0,0.1) !important;
        }
        
        img {
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: high-quality !important;
        }
      }
      
      /* Fix color space issues */
      @media (color-gamut: srgb) {
        :root {
          color-profile: sRGB;
          rendering-intent: relative-colorimetric;
        }
      }
      
      @media (color-gamut: p3) {
        :root {
          color-profile: display-p3;
          rendering-intent: relative-colorimetric;
        }
      }
      
      /* Force hardware acceleration */
      .elevation-sm, .elevation-md, .elevation-lg, .elevation-xl,
      .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl {
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        will-change: transform;
      }
      
      /* Optimize SVG rendering */
      svg {
        shape-rendering: geometricPrecision;
        text-rendering: geometricPrecision;
      }
      
      /* Fix form element rendering */
      button, input, select, textarea {
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        /* Prevent style degradation */
        outline-offset: 0 !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
      }
      
      /* Global quality settings */
      html {
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
        /* Force high-quality scaling */
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: high-quality !important;
        /* Prevent layout shifts */
        font-display: block !important;
      }
      
      /* Tailwind color fix for production */
      .bg-white { background-color: #ffffff !important; }
      .text-black { color: #000000 !important; }
      .border-gray-200 { border-color: #e5e7eb !important; }
      
      /* Fix shadow rendering */
      [class*="shadow"] {
        -webkit-box-shadow: var(--tw-shadow) !important;
        box-shadow: var(--tw-shadow) !important;
      }
      
      /* Ensure CSS variables work correctly */
      :root {
        color-scheme: light dark;
      }
    `
    document.head.appendChild(style)

    // Add prefetch for critical resources
    const prefetchLinks = [
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
    ]

    prefetchLinks.forEach(link => {
      const linkElement = document.createElement('link')
      linkElement.rel = link.rel
      linkElement.href = link.href
      if (link.crossOrigin) {
        linkElement.crossOrigin = link.crossOrigin
      }
      document.head.appendChild(linkElement)
    })

    return () => {
      // Cleanup on unmount
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [])

  return null
}