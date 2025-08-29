// 기본 마킹 객체
export interface BaseMarkupObject {
  id: string
  type: 'box' | 'text' | 'drawing'
  x: number
  y: number
  createdAt: string
  modifiedAt: string
}

// 박스 마킹
export interface BoxMarkup extends BaseMarkupObject {
  type: 'box'
  width: number
  height: number
  color: 'gray' | 'red' | 'blue'  // 자재구간, 작업진행, 작업완료
  label: '자재구간' | '작업진행' | '작업완료'
}

// 텍스트 마킹
export interface TextMarkup extends BaseMarkupObject {
  type: 'text'
  content: string
  fontSize: number
  fontColor: string
}

// 펜 그리기 마킹
export interface DrawingMarkup extends BaseMarkupObject {
  type: 'drawing'
  path: Array<{x: number, y: number}>
  strokeColor: string
  strokeWidth: number
}

// 통합 마킹 타입
export type MarkupObject = BoxMarkup | TextMarkup | DrawingMarkup

// 마킹 도면 데이터
export interface MarkupDocument {
  id: string
  originalFileId: string
  fileName: string
  filePath: string
  markupObjects: MarkupObject[]
  metadata: MarkupMetadata
  permissions: {
    canView: string[]    // 조회 권한 사용자 ID 목록
    canEdit: string[]    // 편집 권한 사용자 ID 목록
  }
}

// 메타데이터
export interface MarkupMetadata {
  originalFileName: string      // 원본 파일명
  markupFileName: string       // 마킹 파일명
  createdBy: string           // 생성자
  createdAt: string          // 생성일시
  modifiedAt: string         // 수정일시
  siteId: string            // 현장 ID
  description?: string       // 설명
  tags: string[]            // 태그
  markupCount: number       // 마킹 개수
}

// 현재 선택된 도구
export type ToolType = 'select' | 'box-gray' | 'box-red' | 'box-blue' | 'text' | 'pen' | 'pan' | 'zoom-in' | 'zoom-out'

// 도구 상태
export interface ToolState {
  activeTool: ToolType
  isDrawing: boolean
  selectedObjects: string[]  // 선택된 객체 ID 목록
  clipboard: MarkupObject[]  // 복사된 객체들
}

// 뷰어 상태
export interface ViewerState {
  zoom: number           // 확대 비율 (0.25 ~ 5.0)
  panX: number          // 가로 패닝 위치
  panY: number          // 세로 패닝 위치
  imageWidth: number    // 원본 이미지 너비
  imageHeight: number   // 원본 이미지 높이
}

// 마킹 에디터 전역 상태
export interface MarkupEditorState {
  // 파일 상태
  currentFile: MarkupDocument | null
  originalBlueprint: File | null
  
  // 도구 상태
  toolState: ToolState
  viewerState: ViewerState
  
  // 편집 상태
  markupObjects: MarkupObject[]
  selectedObjects: string[]
  undoStack: MarkupObject[][]
  redoStack: MarkupObject[][]
  
  // UI 상태
  isLoading: boolean
  isSaving: boolean
  showSaveDialog: boolean
  showOpenDialog: boolean
}

// 파일 권한 구조
export interface FilePermission {
  fileId: string
  ownerId: string
  permissions: {
    public: boolean          // 공개 여부
    viewers: string[]        // 조회 권한자 목록
    editors: string[]        // 편집 권한자 목록
    collaborators: string[]  // 협업 권한자 목록
  }
}