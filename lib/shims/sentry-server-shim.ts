// Minimal server-side shim for @sentry/nextjs to avoid pulling
// heavy OpenTelemetry/vendor chunks during SSR in development.
// All exports are no-ops that mimic the API shape used in this repo.

type Span = {
  setMeasurement?: (name: string, value: number, unit?: string) => void
  setStatus?: (status: string) => void
}

export function init(_: any = {}) {}

export function browserTracingIntegration(_: any = {}) {
  return {}
}

export function replayIntegration(_: any = {}) {
  return {}
}

export function startSpan<T>(_options: any, callback: (span: Span) => Promise<T> | T): Promise<T> {
  try {
    const span: Span = {
      setMeasurement: () => {},
      setStatus: () => {},
    }
    return Promise.resolve(callback(span))
  } catch (e) {
    return Promise.reject(e)
  }
}

export function captureMessage(_msg: string, _level?: any) {}
export function captureException(_err: any) {}
export function addBreadcrumb(_crumb: any) {}
export function setTag(_k: string, _v: string) {}
export function setContext(_k: string, _v: any) {}
export function setUser(_u: any) {}
export function getClient() {
  return null
}
export function withScope(fn: (scope: any) => void) {
  fn({ setContext: () => {} })
}

// For web-vitals helper expectations
export function getCurrentScope() {
  return { setContext: () => {} }
}
