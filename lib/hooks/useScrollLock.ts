import { useEffect, useRef } from 'react';

// Global scroll lock counter to handle multiple modals/overlays
let scrollLockCount = 0;
const originalBodyStyle = { overflow: '', position: '', top: '', left: '', width: '', right: '' };

/**
 * Custom hook to lock/unlock body scroll
 * Handles multiple modals gracefully and restores scroll position
 */
export function useScrollLock(isLocked: boolean) {
  const previousScrollPosition = useRef<number>(0);

  useEffect(() => {
    if (isLocked) {
      // Increment lock counter
      scrollLockCount++;
      
      // Only lock scroll on first modal
      if (scrollLockCount === 1) {
        // Store current scroll position
        previousScrollPosition.current = window.pageYOffset;
        
        // Lock body scroll using position: fixed
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${previousScrollPosition.current}px`;
        document.body.style.left = '0';
        document.body.style.width = '100%';
        document.body.style.right = '0';
      }
    }
    
    return () => {
      // Decrement lock counter
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      
      // Only unlock scroll when no modals are open
      if (scrollLockCount === 0) {
        // Restore body scroll
        document.body.style.overflow = originalBodyStyle.overflow;
        document.body.style.position = originalBodyStyle.position;
        document.body.style.top = originalBodyStyle.top;
        document.body.style.left = originalBodyStyle.left;
        document.body.style.width = originalBodyStyle.width;
        document.body.style.right = originalBodyStyle.right;
        
        // Restore scroll position
        window.scrollTo(0, previousScrollPosition.current);
      }
    };
  }, [isLocked]);

  // Safety reset on page unload to prevent stuck scroll lock
  useEffect(() => {
    const reset = () => {
      scrollLockCount = 0;
      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.position = originalBodyStyle.position;
      document.body.style.top = originalBodyStyle.top;
      document.body.style.left = originalBodyStyle.left;
      document.body.style.width = originalBodyStyle.width;
      document.body.style.right = originalBodyStyle.right;
      window.scrollTo(0, previousScrollPosition.current);
    };

    window.addEventListener('beforeunload', reset);
    return () => window.removeEventListener('beforeunload', reset);
  }, []);
}