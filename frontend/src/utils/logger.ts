/**
 * Утилита для логирования с отключением в production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn(...args); // Warnings всегда показываем
  },
  error: (...args: any[]) => {
    console.error(...args); // Errors всегда показываем
  },
};

