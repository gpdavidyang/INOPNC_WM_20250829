export interface ManpowerItem {
  id: number
  worker: string
  workHours: number
  isCustom: boolean
  locked: boolean
}

export interface WorkSet {
  id: number
  member: string
  process: string
  type: string
  location: { block: string; dong: string; floor: string }
  isCustomMember: boolean
  isCustomProcess: boolean
  customMemberValue: string
  customProcessValue: string
  customTypeValue: string
}

export interface MaterialItem {
  id: number
  name: string
  qty: number
}

export interface PhotoData {
  img: string
  member: string
  process: string
  desc: string
}

export interface Site {
  value: string
  text: string
  dept: string
}
