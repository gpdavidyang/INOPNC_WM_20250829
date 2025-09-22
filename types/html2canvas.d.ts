declare module 'html2canvas' {
  export interface Options {
    allowTaint?: boolean
    backgroundColor?: string | null
    canvas?: HTMLCanvasElement | null
    foreignObjectRendering?: boolean
    imageTimeout?: number
    ignoreElements?: (element: Element) => boolean
    logging?: boolean
    onclone?: (document: Document) => void
    proxy?: string | null
    removeContainer?: boolean
    scale?: number
    useCORS?: boolean
    width?: number
    height?: number
    x?: number
    y?: number
    scrollX?: number
    scrollY?: number
    windowWidth?: number
    windowHeight?: number
  }

  function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>
  
  export default html2canvas
}