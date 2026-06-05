/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_ADVISOR_URL?: string;
  readonly VITE_AI_ADVISOR_MODE?: "auto" | "json" | "gradio";
  readonly VITE_AI_ADVISOR_API_NAME?: string;
  readonly VITE_ML_MODEL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
