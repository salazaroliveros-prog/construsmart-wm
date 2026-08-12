/**
 * Deep Linking System
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Deep linking for sharing direct URLs to specific content
 */

export interface DeepLinkParams {
  type: 'project' | 'budget' | 'transaction' | 'employee' | 'supplier' | 'client';
  id: string;
  tab?: string;
  view?: string;
  params?: Record<string, string>;
}

/**
 * Generate a deep link URL
 */
export function generateDeepLink(params: DeepLinkParams): string {
  const baseUrl = window.location.origin;
  const path = params.type === 'project' ? '/dashboard' : '/dashboard';
  
  const searchParams = new URLSearchParams();
  searchParams.set('type', params.type);
  searchParams.set('id', params.id);
  
  if (params.tab) searchParams.set('tab', params.tab);
  if (params.view) searchParams.set('view', params.view);
  
  if (params.params) {
    Object.entries(params.params).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
  }
  
  return `${baseUrl}${path}?${searchParams.toString()}`;
}

/**
 * Parse deep link from URL
 */
export function parseDeepLink(url: string): DeepLinkParams | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    const type = params.get('type') as DeepLinkParams['type'];
    const id = params.get('id');
    
    if (!type || !id) return null;
    
    const deepLinkParams: DeepLinkParams = {
      type,
      id,
    };
    
    const tab = params.get('tab');
    if (tab) deepLinkParams.tab = tab;
    
    const view = params.get('view');
    if (view) deepLinkParams.view = view;
    
    // Collect additional params
    const additionalParams: Record<string, string> = {};
    params.forEach((value, key) => {
      if (!['type', 'id', 'tab', 'view'].includes(key)) {
        additionalParams[key] = value;
      }
    });
    
    if (Object.keys(additionalParams).length > 0) {
      deepLinkParams.params = additionalParams;
    }
    
    return deepLinkParams;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Check if current URL is a deep link
 */
export function isDeepLink(): boolean {
  const url = window.location.href;
  return parseDeepLink(url) !== null;
}

/**
 * Get deep link params from current URL
 */
export function getCurrentDeepLinkParams(): DeepLinkParams | null {
  return parseDeepLink(window.location.href);
}

/**
 * Navigate to a deep link
 */
export function navigateToDeepLink(params: DeepLinkParams): void {
  const url = generateDeepLink(params);
  window.location.href = url;
}

/**
 * Copy deep link to clipboard
 */
export async function copyDeepLink(params: DeepLinkParams): Promise<boolean> {
  try {
    const url = generateDeepLink(params);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Error copying deep link:', error);
    return false;
  }
}