const STORAGE_KEY = 'hideNotifications'

const getStore = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const suppressNotificationsForToday = () => {
  const store = getStore()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, new Date().toDateString())
  } catch {
    /* ignore */
  }
}

export const clearNotificationSuppression = () => {
  const store = getStore()
  if (!store) return
  try {
    store.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export const isNotificationHiddenToday = () => {
  const store = getStore()
  if (!store) return false
  try {
    const value = store.getItem(STORAGE_KEY)
    if (!value) return false
    return value === new Date().toDateString()
  } catch {
    return false
  }
}
