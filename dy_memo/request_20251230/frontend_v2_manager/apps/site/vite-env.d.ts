/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MAIN_URL: string
  readonly VITE_APP_SITE_URL: string
  readonly VITE_APP_MONEY_URL: string
  readonly VITE_APP_DOC_URL: string
  readonly VITE_APP_WORKLOG_URL: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
