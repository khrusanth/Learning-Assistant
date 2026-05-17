/**
 * Local logging system that saves logs to files
 */
import { appendFile, readFile, fileExists } from './fileSystem';

const LOG_FILE = 'app-logs.txt';
const ERROR_LOG_FILE = 'error-logs.txt';

export const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS',
};

const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let log = `[${timestamp}] [${level}] ${message}`;
  if (data) {
    log += `\nData: ${JSON.stringify(data, null, 2)}`;
  }
  log += '\n' + '-'.repeat(80) + '\n';
  return log;
};

export const logger = {
  info: (message, data = null) => {
    const log = formatLog(LogLevel.INFO, message, data);
    console.log(message, data);
    appendFile(LOG_FILE, log).catch(err => console.error('Logging failed:', err));
  },

  warn: (message, data = null) => {
    const log = formatLog(LogLevel.WARN, message, data);
    console.warn(message, data);
    appendFile(LOG_FILE, log).catch(err => console.error('Logging failed:', err));
  },

  error: (message, data = null) => {
    const log = formatLog(LogLevel.ERROR, message, data);
    console.error(message, data);
    appendFile(ERROR_LOG_FILE, log).catch(err => console.error('Logging failed:', err));
  },

  debug: (message, data = null) => {
    const log = formatLog(LogLevel.DEBUG, message, data);
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data);
    }
    appendFile(LOG_FILE, log).catch(err => console.error('Logging failed:', err));
  },

  success: (message, data = null) => {
    const log = formatLog(LogLevel.SUCCESS, message, data);
    console.log('%c' + message, 'color: green', data);
    appendFile(LOG_FILE, log).catch(err => console.error('Logging failed:', err));
  },
};

// Get all logs
export const getLogs = async () => {
  try {
    return await readFile(LOG_FILE);
  } catch {
    return '';
  }
};

// Get error logs
export const getErrorLogs = async () => {
  try {
    return await readFile(ERROR_LOG_FILE);
  } catch {
    return '';
  }
};

// Clear logs
export const clearLogs = async () => {
  try {
    await appendFile(LOG_FILE, `\n\n=== LOGS CLEARED AT ${new Date().toISOString()} ===\n\n`);
    logger.info('Logs cleared');
  } catch (err) {
    console.error('Error clearing logs:', err);
  }
};
