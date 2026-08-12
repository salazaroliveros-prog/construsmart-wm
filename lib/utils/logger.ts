/**
 * Secure Logging System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Centralized logging with environment-aware sensitivity controls
 * Prevents accidental exposure of sensitive data in production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  module?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Check if detailed logging is enabled for a specific module
 */
function isModuleLoggingEnabled(module: string): boolean {
  // Check environment variable for module-specific logging
  const enabledModules = process.env.DEBUG_MODULES || '';
  return enabledModules.split(',').includes(module);
}

/**
 * Check if sensitive data logging is allowed
 */
function isSensitiveLoggingAllowed(): boolean {
  // Only allow in development with explicit consent
  return process.env.NODE_ENV === 'development' && 
         process.env.DEBUG_SENSITIVE === 'true';
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'authorization',
    'credit_card', 'ssn', 'social_security', 'api_key',
    'access_token', 'refresh_token', 'session_token',
    'private_key', 'auth_token', 'bearer'
  ];

  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive key
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      if (isSensitiveLoggingAllowed()) {
        sanitized[key] = '[SENSITIVE_DATA_VISIBLE]';
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Format log message with context
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
  data?: any
): string {
  const timestamp = new Date().toISOString();
  const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  const levelName = levelNames[level];
  
  const parts = [
    `[${timestamp}]`,
    `[${levelName}]`,
  ];

  if (context?.module) {
    parts.push(`[${context.module}]`);
  }

  if (context?.requestId) {
    parts.push(`[${context.requestId}]`);
  }

  parts.push(message);

  let logString = parts.join(' ');

  if (data) {
    const sanitizedData = sanitizeData(data);
    logString += ' ' + JSON.stringify(sanitizedData);
  }

  return logString;
}

/**
 * Main logging function
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  data?: any
): void {
  // Check if this log level should be shown
  const minLevel = parseInt(process.env.LOG_LEVEL || '1', 10); // Default to INFO
  if (level < minLevel) {
    return;
  }

  // Check module-specific logging
  if (context?.module && !isModuleLoggingEnabled(context.module)) {
    return;
  }

  const logString = formatLogMessage(level, message, context, data);

  // Use appropriate console method
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(logString);
      break;
    case LogLevel.INFO:
      console.info(logString);
      break;
    case LogLevel.WARN:
      console.warn(logString);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(logString);
      break;
  }
}

/**
 * Logger object with convenience methods
 */
export const logger = {
  debug: (message: string, context?: LogContext, data?: any) => {
    log(LogLevel.DEBUG, message, context, data);
  },
  
  info: (message: string, context?: LogContext, data?: any) => {
    log(LogLevel.INFO, message, context, data);
  },
  
  warn: (message: string, context?: LogContext, data?: any) => {
    log(LogLevel.WARN, message, context, data);
  },
  
  error: (message: string, context?: LogContext, data?: any) => {
    log(LogLevel.ERROR, message, context, data);
  },
  
  fatal: (message: string, context?: LogContext, data?: any) => {
    log(LogLevel.FATAL, message, context, data);
  },
};

/**
 * Create a module-specific logger
 */
export function createModuleLogger(moduleName: string) {
  return {
    debug: (message: string, data?: any) => 
      logger.debug(message, { module: moduleName }, data),
    
    info: (message: string, data?: any) => 
      logger.info(message, { module: moduleName }, data),
    
    warn: (message: string, data?: any) => 
      logger.warn(message, { module: moduleName }, data),
    
    error: (message: string, data?: any) => 
      logger.error(message, { module: moduleName }, data),
    
    fatal: (message: string, data?: any) => 
      logger.fatal(message, { module: moduleName }, data),
  };
}

// Predefined module loggers
export const authLogger = createModuleLogger('Auth');
export const syncLogger = createModuleLogger('Sync');
export const dbLogger = createModuleLogger('Database');
export const apiLogger = createModuleLogger('API');
export const uiLogger = createModuleLogger('UI');