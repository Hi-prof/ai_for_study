/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COZE_TOKEN: string
  readonly VITE_COZE_BASE_URL: string
  readonly VITE_COZE_BOT_ID: string
  readonly VITE_DEEPSEEK_API_KEY: string
  readonly VITE_DEEPSEEK_API_BASE: string
  readonly VITE_DEEPSEEK_MODEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
