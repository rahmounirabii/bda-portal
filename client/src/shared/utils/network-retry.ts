/**
 * Network Retry Helper
 * Provides resilient network operations with exponential backoff
 * Cas 14: Gestion réseau coupé pendant signup/login
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 seconde
  maxDelay: 10000, // 10 secondes max
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry sur erreurs réseau, pas sur erreurs business logic
    const isNetworkError =
      error?.message?.includes('fetch') ||
      error?.message?.includes('Network') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('timeout') ||
      error?.code === 'NETWORK_ERROR' ||
      error?.status === 0;

    return isNetworkError;
  },
  onRetry: () => {},
};

/**
 * Exécute une fonction avec retry automatique en cas d'erreur réseau
 * Utilise exponential backoff pour éviter de surcharger le serveur
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      console.log(`🔄 [NetworkRetry] Attempt ${attempt + 1}/${opts.maxRetries + 1}`);

      const result = await fn();

      if (attempt > 0) {
        console.log(`✅ [NetworkRetry] Success after ${attempt} retries`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Dernier essai échoué
      if (attempt === opts.maxRetries) {
        console.error(`❌ [NetworkRetry] Failed after ${opts.maxRetries + 1} attempts:`, error);
        throw error;
      }

      // Vérifier si on doit retry
      if (!opts.shouldRetry(error)) {
        console.log(`⚠️ [NetworkRetry] Error not retryable:`, error);
        throw error;
      }

      // Notifier tentative de retry
      console.warn(`⚠️ [NetworkRetry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
      opts.onRetry(attempt + 1, error);

      // Attendre avec exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));

      // Augmenter le délai pour prochain retry (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  // Ne devrait jamais arriver ici, mais TypeScript l'exige
  throw lastError;
}

/**
 * Wrapper pour fetch avec retry automatique
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Ne pas retry sur erreurs HTTP (4xx, 5xx), seulement sur erreurs réseau
        if (!response.ok && response.status >= 400) {
          const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }

        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);

        // Transformer erreur abort en erreur réseau
        if (error.name === 'AbortError') {
          const timeoutError: any = new Error('Request timeout');
          timeoutError.code = 'NETWORK_ERROR';
          throw timeoutError;
        }

        throw error;
      }
    },
    retryOptions
  );
}

/**
 * Vérifier si une erreur est une erreur réseau
 */
export function isNetworkError(error: any): boolean {
  return DEFAULT_OPTIONS.shouldRetry(error);
}

/**
 * Formater un message d'erreur pour l'utilisateur
 */
export function formatNetworkError(error: any, context: string = ''): string {
  if (isNetworkError(error)) {
    return `Impossible de se connecter au serveur${context ? ` (${context})` : ''}. Vérifiez votre connexion internet et réessayez.`;
  }

  if (error?.status === 429) {
    return 'Trop de tentatives. Veuillez réessayer dans quelques instants.';
  }

  if (error?.status >= 500) {
    return 'Le serveur rencontre des difficultés. Veuillez réessayer dans quelques instants.';
  }

  return error?.message || 'Une erreur est survenue. Veuillez réessayer.';
}
