declare module 'shaven' {
  type ShavenPrimitive = string | number | boolean | null | undefined
  type ShavenAttributes = Record<string, ShavenPrimitive>
  type ShavenChild = ShavenPrimitive | ShavenAttributes | ShavenTree
  type ShavenTree = ShavenChild[]

  interface ShavenResult {
    rootElement?: HTMLElement
    references: Record<string, Element | undefined>
    html?: string
    text?: string
  }

  interface Shaven {
    (tree: ShavenTree): ShavenResult
    setDefaults(options: { document: Document }): void
  }

  const shaven: Shaven
  export default shaven
  export type { Shaven, ShavenResult, ShavenTree }
}

declare module 'shaven/source/library/browser.js' {
  import type { Shaven } from 'shaven'
  const shaven: Shaven
  export default shaven
}
