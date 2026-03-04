/**
 * Development-only logging utility.
 * All calls are completely removed from production builds
 * via esbuild.drop in vite.config.ts.
 *
 * Usage:
 *   import { devLog, devWarn } from '../lib/devLog';
 *   devLog('Auth Context State:', { userId, role });
 *   devWarn('Something unexpected');
 */

export const devLog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const devWarn = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

export const devError = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};
