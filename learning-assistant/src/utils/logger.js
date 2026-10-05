/**
 * Lightweight console-only logger.
 * No file system dependencies — logs to browser console with styled output.
 */

const PREFIX = '[LearnAssist]';

const styles = {
  info:    'color: #3b82f6; font-weight: 600;',
  success: 'color: #10b981; font-weight: 600;',
  warn:    'color: #f59e0b; font-weight: 600;',
  error:   'color: #ef4444; font-weight: 600;',
  debug:   'color: #8b5cf6; font-weight: 600;',
};

export const logger = {
  info(message, data) {
    console.log(`%c${PREFIX} ℹ ${message}`, styles.info, data ?? '');
  },
  success(message, data) {
    console.log(`%c${PREFIX} ✓ ${message}`, styles.success, data ?? '');
  },
  warn(message, data) {
    console.warn(`%c${PREFIX} ⚠ ${message}`, styles.warn, data ?? '');
  },
  error(message, data) {
    console.error(`%c${PREFIX} ✗ ${message}`, styles.error, data ?? '');
  },
  debug(message, data) {
    if (import.meta.env.DEV) {
      console.debug(`%c${PREFIX} 🐛 ${message}`, styles.debug, data ?? '');
    }
  },
};
