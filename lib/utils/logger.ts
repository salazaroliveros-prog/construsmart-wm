// Logging estructurado para la aplicación
// Proporciona niveles de log y formato consistente

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: string;
}

class Logger {
  private enabled: boolean;
  private minLevel: LogLevel;

  constructor() {
    // Habilitar logging en desarrollo o si está explícitamente activado
    this.enabled = process.env.NODE_ENV === 'development' || 
                   typeof window !== 'undefined' && localStorage.getItem('wm_debug_mode') === 'true';
    
    // Nivel mínimo de logs a mostrar
    this.minLevel = this.enabled ? 'debug' : 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.minLevel];
  }

  private formatMessage(entry: LogEntry): void {
    const { timestamp, level, message, data, context } = entry;
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    
    const logMessage = `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        // Aquí se podría enviar a un servicio de logging externo (Sentry, LogRocket, etc.)
        this.sendToExternalService(entry);
        break;
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // Servicio de logging externo pendiente de configuración
    // Requiere integración con Sentry, LogRocket, Datadog, etc.
    // Para implementar:
    // 1. Instalar el paquete correspondiente (ej: npm install @sentry/nextjs)
    // 2. Configurar el servicio en lib/supabase/env.ts o en next.config.ts
    // 3. Descomentar y adaptar el código según el servicio elegido
    // 
    // Ejemplo para Sentry:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(entry.data);
    // }
    //
    // Ejemplo para LogRocket:
    // if (typeof window !== 'undefined' && window.LogRocket) {
    //   window.LogRocket.captureException(entry.data);
    // }
  }

  private createEntry(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
    };
  }

  debug(message: string, data?: unknown, context?: string) {
    if (this.shouldLog('debug')) {
      this.formatMessage(this.createEntry('debug', message, data, context));
    }
  }

  info(message: string, data?: unknown, context?: string) {
    if (this.shouldLog('info')) {
      this.formatMessage(this.createEntry('info', message, data, context));
    }
  }

  warn(message: string, data?: unknown, context?: string) {
    if (this.shouldLog('warn')) {
      this.formatMessage(this.createEntry('warn', message, data, context));
    }
  }

  error(message: string, data?: unknown, context?: string) {
    if (this.shouldLog('error')) {
      this.formatMessage(this.createEntry('error', message, data, context));
    }
  }

  // Método para medir performance
  time(label: string): void {
    console.time(`[${label}]`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`[${label}]`);
  }

  // Método para agrupar logs
  group(label: string): void {
    if (this.shouldLog('debug')) {
      console.group(`[${label}]`);
    }
  }

  groupEnd(): void {
    if (this.shouldLog('debug')) {
      console.groupEnd();
    }
  }

  // Habilitar/deshabilitar modo debug dinámicamente
  setDebugMode(enabled: boolean): void {
    this.enabled = enabled;
    this.minLevel = enabled ? 'debug' : 'warn';
    
    if (enabled) {
      this.info('Modo debug activado', undefined, 'Logger');
    } else {
      this.info('Modo debug desactivado', undefined, 'Logger');
    }
  }

  // Limpiar consola (útil para desarrollo)
  clear(): void {
    console.clear();
  }
}

// Singleton instance
export const logger = new Logger();

// Hook para usar logger en componentes React
export function useLogger(context?: string) {
  return {
    debug: (message: string, data?: unknown) => logger.debug(message, data, context),
    info: (message: string, data?: unknown) => logger.info(message, data, context),
    warn: (message: string, data?: unknown) => logger.warn(message, data, context),
    error: (message: string, data?: unknown) => logger.error(message, data, context),
  };
}

// Helper para logging de errores de API
export function logApiError(error: unknown, context?: string): void {
  const errorData = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    error,
  };
  logger.error('Error en llamada API', errorData, context);
}

// Helper para logging de operaciones de base de datos
export function logDbOperation(operation: string, table: string, data?: unknown): void {
  logger.debug(`DB Operation: ${operation}`, { table, data }, 'Database');
}