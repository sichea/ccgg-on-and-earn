declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback?: () => void) => void;
          setText: (text: string) => void;
          setParams: (params: { text: string; color: string; }) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback?: () => void) => void;
        };
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

export const initTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const WebApp = window.Telegram.WebApp;
    
    // Initialize Telegram WebApp
    WebApp.ready();

    // Configure MainButton
    WebApp.MainButton.setParams({
      text: '답변 제출하기',
      color: '#2481cc'
    });

    // Show BackButton by default
    WebApp.BackButton.show();

    // Return WebApp instance
    return WebApp;
  }
  
  return null;
};

export const closeTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.close();
  }
};

export function validateInitData(initData: string) {
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    return null;
  }

  try {
    // WebApp의 initDataUnsafe를 사용
    const { user } = window.Telegram.WebApp.initDataUnsafe;
    
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
  } catch (error) {
    console.error('Failed to validate initData:', error);
    return null;
  }
}