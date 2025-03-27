declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    google: any;
  }
}

export {};
