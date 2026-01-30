import React from 'react'
import { NotificationItem } from '../../../types'
interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onMarkAllRead: () => void
}
export declare const NotificationPanel: React.FC<NotificationPanelProps>
export {}
//# sourceMappingURL=NotificationPanel.d.ts.map
