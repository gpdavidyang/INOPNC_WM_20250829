/**
 * Image compression and optimization utilities
 */

interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

/**
 * Compress an image file using canvas
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, `.${format}`),
              { type: `image/${format}` }
            )
            
            resolve(compressedFile)
          },
          `image/${format}`,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options: CompressImageOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<File[]> {
  const results: File[] = []
  
  for (let i = 0; i < files.length; i++) {
    try {
      const compressed = await compressImage(files[i], options)
      results.push(compressed)
      onProgress?.(i + 1, files.length)
    } catch (error) {
      console.error(`Failed to compress ${files[i].name}:`, error)
      results.push(files[i]) // Use original if compression fails
    }
  }
  
  return results
}

/**
 * Convert image to base64 for preview
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Calculate total file size
 */
export function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}