/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  import type { ComponentOptions } from "vue";

  const component: DefineComponent<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    ComponentOptions
  >;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_URL: undefined | string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
