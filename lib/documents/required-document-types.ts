export const generateEnglishNameFromCode = (code: string): string => {
  if (!code) return ''

  const normalized = code
    .replace(/[_-]+/g, ' ') // treat delimiters as spaces
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // remove unsupported chars
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return ''

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => {
      if (word.length <= 3) return word.toUpperCase()
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    })
    .join(' ')
}
