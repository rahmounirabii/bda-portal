import { APP_CONFIG } from '@/shared/config/app.config';

/**
 * Utilitaires de validation
 */

/**
 * Validation d'email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validation de mot de passe
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < APP_CONFIG.limits.passwordMinLength) {
    errors.push(`Le mot de passe doit contenir au moins ${APP_CONFIG.limits.passwordMinLength} caractères`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validation de nom d'utilisateur
 */
export function isValidUsername(username: string): boolean {
  return (
    username.length >= APP_CONFIG.limits.usernameMinLength &&
    /^[a-zA-Z0-9_-]+$/.test(username)
  );
}

/**
 * Validation de taille de fichier
 */
export function isValidFileSize(file: File, maxSize: number = APP_CONFIG.limits.maxFileSize): boolean {
  return file.size <= maxSize;
}

/**
 * Validation de type de fichier
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validation d'image
 */
export function isValidImage(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!isValidFileType(file, allowedTypes)) {
    errors.push('Format d\'image non supporté. Utilisez JPEG, PNG, GIF ou WebP');
  }

  if (!isValidFileSize(file, APP_CONFIG.limits.maxImageSize)) {
    errors.push(`L'image doit faire moins de ${APP_CONFIG.limits.maxImageSize / (1024 * 1024)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Nettoyer et valider une chaîne de caractères
 */
export function sanitizeString(input: string, maxLength?: number): string {
  let sanitized = input.trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Valider un code pays (ISO 3166-1 alpha-2)
 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}