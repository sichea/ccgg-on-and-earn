// src/types/telegram.d.ts
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(callback: () => void): void;
  offClick(callback?: () => void): void;
  setText(text: string): void;
  setParams(params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_visible?: boolean;
  }): void;
}

interface TelegramWebApp {
  ready(): void;
  close(): void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  MainButton: TelegramButton;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'ok' | 'close' | 'cancel' | 'default' | 'destructive';
      text?: string;
    }>;
  }): Promise<string>;
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

export {};