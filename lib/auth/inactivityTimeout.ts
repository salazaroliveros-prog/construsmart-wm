/**
 * Inactivity Timeout System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Automatic session timeout after period of inactivity
 * Enhances security by preventing unauthorized access on unattended devices
 */

export interface InactivityConfig {
  timeoutMs: number;           // Timeout duration in milliseconds
  warningMs: number;            // Warning time before timeout
  onTimeout: () => void;       // Callback when timeout occurs
  onWarning?: () => void;      // Optional callback for warning
  resetOnEvents?: boolean;     // Reset timeout on user events
}

export class InactivityTimeout {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private lastActivity: number;
  private config: InactivityConfig;
  private isActive: boolean = false;

  constructor(config: InactivityConfig) {
    this.config = config;
    this.lastActivity = Date.now();
  }

  /**
   * Start the inactivity timeout
   */
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastActivity = Date.now();
    this.scheduleTimeout();
    
    if (this.config.resetOnEvents) {
      this.attachEventListeners();
    }
  }

  /**
   * Stop the inactivity timeout
   */
  stop(): void {
    this.isActive = false;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
    
    if (this.config.resetOnEvents) {
      this.detachEventListeners();
    }
  }

  /**
   * Reset the timeout timer
   */
  reset(): void {
    if (!this.isActive) return;
    
    this.lastActivity = Date.now();
    this.rescheduleTimeout();
  }

  /**
   * Get time remaining until timeout
   */
  getTimeRemaining(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.config.timeoutMs - elapsed);
  }

  /**
   * Check if timeout is imminent
   */
  isTimeoutImminent(): boolean {
    return this.getTimeRemaining() <= this.config.warningMs;
  }

  /**
   * Schedule the timeout and warning timers
   */
  private scheduleTimeout(): void {
    // Clear existing timers
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);

    // Schedule warning
    if (this.config.warningMs > 0 && this.config.onWarning) {
      const warningDelay = this.config.timeoutMs - this.config.warningMs;
      this.warningId = setTimeout(() => {
        if (this.isActive) {
          this.config.onWarning?.();
        }
      }, warningDelay);
    }

    // Schedule timeout
    this.timeoutId = setTimeout(() => {
      if (this.isActive) {
        this.stop();
        this.config.onTimeout();
      }
    }, this.config.timeoutMs);
  }

  /**
   * Reschedule the timeout (called on reset)
   */
  private rescheduleTimeout(): void {
    this.scheduleTimeout();
  }

  /**
   * Attach event listeners for user activity
   */
  private attachEventListeners(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.reset();
  };
}

/**
 * Default configuration for inactivity timeout
 */
export const DEFAULT_INACTIVITY_CONFIG: InactivityConfig = {
  timeoutMs: 30 * 60 * 1000, // 30 minutes
  warningMs: 5 * 60 * 1000,    // 5 minutes warning
  onTimeout: () => {
    console.warn('Session timeout due to inactivity');
    // Default: redirect to login
    window.location.href = '/login?reason=timeout';
  },
  resetOnEvents: true,
};

/**
 * Create an inactivity timeout instance
 */
export function createInactivityTimeout(
  config: Partial<InactivityConfig> = {}
): InactivityTimeout {
  const mergedConfig: InactivityConfig = {
    ...DEFAULT_INACTIVITY_CONFIG,
    ...config,
  };

  return new InactivityTimeout(mergedConfig);
}

/**
 * Hook-like function for React components
 */
export function useInactivityTimeout(
  config: Partial<InactivityConfig> = {}
): InactivityTimeout {
  const timeout = createInactivityTimeout(config);
  return timeout;
}