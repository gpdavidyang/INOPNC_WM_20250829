// Quick Menu Icons Mapping
export const QUICK_MENU_ICONS = {
  출력현황: '/icons/output-status.svg',
  작업일지: '/icons/work-log.svg', 
  현장정보: '/icons/site-info.svg',
  문서함: '/icons/documents.svg',
  본사요청: '/icons/headquarters-request.svg',
  재고관리: '/icons/inventory.svg'
} as const;

export type QuickMenuIconName = keyof typeof QUICK_MENU_ICONS;