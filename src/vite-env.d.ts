/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_BASE_URL?: string;
  readonly VITE_GAS_MODE?: "mock" | "gas";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
