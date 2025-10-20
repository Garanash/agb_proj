// Глобальная декларация переменной window.ENV для фронтенда
export {};

declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_API_URL?: string;
    };
  }
}


