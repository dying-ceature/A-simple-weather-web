/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_QWEATHER_KEY: string
  readonly VITE_QWEATHER_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
