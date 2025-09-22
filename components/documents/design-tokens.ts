// Design tokens for unified document management
export const documentDesignTokens = {
  // Colors
  colors: {
    primary: {
      50: 'rgb(239 246 255)', // bg-blue-50
      100: 'rgb(219 234 254)', // bg-blue-100
      500: 'rgb(59 130 246)', // bg-blue-500
      600: 'rgb(37 99 235)', // bg-blue-600
      700: 'rgb(29 78 216)', // bg-blue-700
    },
    semantic: {
      success: {
        50: 'rgb(240 253 244)', // bg-green-50
        500: 'rgb(34 197 94)', // text-green-500
        600: 'rgb(22 163 74)', // bg-green-600
      },
      warning: {
        50: 'rgb(254 252 232)', // bg-yellow-50
        500: 'rgb(234 179 8)', // text-yellow-500
        600: 'rgb(202 138 4)', // bg-yellow-600
      },
      error: {
        50: 'rgb(254 242 242)', // bg-red-50
        500: 'rgb(239 68 68)', // text-red-500
        600: 'rgb(220 38 38)', // bg-red-600
      }
    },
    neutral: {
      50: 'rgb(249 250 251)', // bg-gray-50
      100: 'rgb(243 244 246)', // bg-gray-100
      200: 'rgb(229 231 235)', // border-gray-200
      300: 'rgb(209 213 219)', // border-gray-300
      400: 'rgb(156 163 175)', // text-gray-400
      500: 'rgb(107 114 128)', // text-gray-500
      600: 'rgb(75 85 99)', // text-gray-600
      700: 'rgb(55 65 81)', // text-gray-700
      800: 'rgb(31 41 55)', // bg-gray-800
      900: 'rgb(17 24 39)', // bg-gray-900
    }
  },

  // Typography
  typography: {
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    }
  },

  // Spacing
  spacing: {
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem', // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    12: '3rem', // 48px
  },

  // Border radius
  borderRadius: {
    sm: '0.125rem', // 2px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  // Component specific
  components: {
    card: {
      padding: '1rem', // 16px
      borderRadius: '0.75rem', // 12px
      borderWidth: '1px',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
    button: {
      paddingX: '1rem', // 16px
      paddingY: '0.5rem', // 8px
      borderRadius: '0.375rem', // 6px
      fontSize: '0.875rem', // 14px
      fontWeight: '500',
    },
    input: {
      paddingX: '0.75rem', // 12px
      paddingY: '0.5rem', // 8px
      borderRadius: '0.375rem', // 6px
      borderWidth: '1px',
      fontSize: '0.875rem', // 14px
    },
    badge: {
      paddingX: '0.5rem', // 8px
      paddingY: '0.125rem', // 2px
      borderRadius: '0.375rem', // 6px
      fontSize: '0.75rem', // 12px
      fontWeight: '500',
    }
  },

  // File type colors
  fileTypes: {
    pdf: {
      bg: 'rgb(254 242 242)', // bg-red-50
      text: 'rgb(185 28 28)', // text-red-700
      border: 'rgb(252 165 165)', // border-red-300
    },
    image: {
      bg: 'rgb(255 247 237)', // bg-orange-50
      text: 'rgb(194 65 12)', // text-orange-700
      border: 'rgb(253 186 116)', // border-orange-300
    },
    document: {
      bg: 'rgb(239 246 255)', // bg-blue-50
      text: 'rgb(29 78 216)', // text-blue-700
      border: 'rgb(147 197 253)', // border-blue-300
    },
    spreadsheet: {
      bg: 'rgb(240 253 244)', // bg-green-50
      text: 'rgb(21 128 61)', // text-green-700
      border: 'rgb(134 239 172)', // border-green-300
    },
    markup: {
      bg: 'rgb(250 245 255)', // bg-purple-50
      text: 'rgb(109 40 217)', // text-purple-700
      border: 'rgb(196 181 253)', // border-purple-300
    },
    default: {
      bg: 'rgb(249 250 251)', // bg-gray-50
      text: 'rgb(55 65 81)', // text-gray-700
      border: 'rgb(209 213 219)', // border-gray-300
    }
  },

  // Status colors
  status: {
    completed: {
      bg: 'rgb(240 253 244)', // bg-green-50
      text: 'rgb(21 128 61)', // text-green-700
      icon: 'rgb(34 197 94)', // text-green-500
    },
    pending: {
      bg: 'rgb(254 252 232)', // bg-yellow-50
      text: 'rgb(161 98 7)', // text-yellow-700
      icon: 'rgb(234 179 8)', // text-yellow-500
    },
    error: {
      bg: 'rgb(254 242 242)', // bg-red-50
      text: 'rgb(185 28 28)', // text-red-700
      icon: 'rgb(239 68 68)', // text-red-500
    },
    processing: {
      bg: 'rgb(239 246 255)', // bg-blue-50
      text: 'rgb(29 78 216)', // text-blue-700
      icon: 'rgb(59 130 246)', // text-blue-500
    }
  }
} as const

// Helper function to get file type styling
export const getFileTypeStyle = (mimeType: string) => {
  if (mimeType === 'markup-document') return documentDesignTokens.fileTypes.markup
  if (mimeType.includes('pdf')) return documentDesignTokens.fileTypes.pdf
  if (mimeType.startsWith('image/')) return documentDesignTokens.fileTypes.image
  if (mimeType.includes('word') || mimeType.includes('document')) return documentDesignTokens.fileTypes.document
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return documentDesignTokens.fileTypes.spreadsheet
  return documentDesignTokens.fileTypes.default
}

// Helper function to get status styling
export const getStatusStyle = (status: string) => {
  switch (status) {
    case 'approved':
    case 'completed':
      return documentDesignTokens.status.completed
    case 'submitted':
    case 'pending':
      return documentDesignTokens.status.pending
    case 'rejected':
    case 'error':
      return documentDesignTokens.status.error
    case 'processing':
      return documentDesignTokens.status.processing
    default:
      return documentDesignTokens.status.pending
  }
}