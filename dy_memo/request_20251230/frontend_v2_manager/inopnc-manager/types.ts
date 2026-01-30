export interface WorkerData {
  id: string
  name: string
  role: string
  site: string
  status: 'pending' | 'working' // pending: 일지검토요청, working: 현장작업중
  avatarChar: string
  avatarStyle?: {
    backgroundColor: string
    color: string
  }
  details: {
    label: string
    value: string
    valueColor?: string
  }[]
  actions: WorkerAction[]
}

export type WorkerAction = 'log' | 'approve' | 'call' | 'defect' | 'drawing'

export interface ToastState {
  show: boolean
  message: string
}
