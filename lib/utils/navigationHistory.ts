/**
 * Navigation History System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Navigation history tracking for better UX and back/forward functionality
 */

export interface NavigationHistoryEntry {
  id: string;
  timestamp: string;
  path: string;
  title?: string;
  params?: Record<string, any>;
}

/**
 * Add entry to navigation history
 */
export function addToHistory(entry: Omit<NavigationHistoryEntry, 'id' | 'timestamp'>): void {
  try {
    const historyEntry: NavigationHistoryEntry = {
      id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    const history = getHistory();
    history.push(historyEntry);
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    localStorage.setItem('navigation_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error adding to navigation history:', error);
  }
}

/**
 * Get navigation history
 */
export function getHistory(): NavigationHistoryEntry[] {
  try {
    const stored = localStorage.getItem('navigation_history');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting navigation history:', error);
    return [];
  }
}

/**
 * Get last entry from history
 */
export function getLastEntry(): NavigationHistoryEntry | null {
  const history = getHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

/**
 * Get previous entry from history
 */
export function getPreviousEntry(): NavigationHistoryEntry | null {
  const history = getHistory();
  return history.length > 1 ? history[history.length - 2] : null;
}

/**
 * Navigate back in history
 */
export function navigateBack(): void {
  const previous = getPreviousEntry();
  if (previous) {
    window.location.href = previous.path;
  } else {
    window.history.back();
  }
}

/**
 * Clear navigation history
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem('navigation_history');
  } catch (error) {
    console.error('Error clearing navigation history:', error);
  }
}

/**
 * Get history for a specific path pattern
 */
export function getHistoryForPath(pattern: string): NavigationHistoryEntry[] {
  const history = getHistory();
  const regex = new RegExp(pattern);
  return history.filter(entry => regex.test(entry.path));
}

/**
 * Get navigation statistics
 */
export function getNavigationStats() {
  const history = getHistory();
  const paths = history.map(entry => entry.path);
  const uniquePaths = [...new Set(paths)];
  
  return {
    totalEntries: history.length,
    uniquePaths: uniquePaths.length,
    mostVisited: getMostVisitedPaths(history, 5),
  };
}

/**
 * Get most visited paths
 */
function getMostVisitedPaths(history: NavigationHistoryEntry[], limit: number): Array<{ path: string; count: number }> {
  const pathCounts: Record<string, number> = {};
  
  history.forEach(entry => {
    pathCounts[entry.path] = (pathCounts[entry.path] || 0) + 1;
  });
  
  return Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}