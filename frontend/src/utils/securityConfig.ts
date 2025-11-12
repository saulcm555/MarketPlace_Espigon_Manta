/**
 * Security Configuration Manager
 * Gestiona la configuración de seguridad del sistema
 */

export interface SecuritySettings {
  enableTwoFactor: boolean;
  sessionTimeout: string;
  maxLoginAttempts: string;
  passwordMinLength: string;
  requireStrongPassword: boolean;
  enableCaptcha: boolean;
}

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  enableTwoFactor: false,
  sessionTimeout: '30',
  maxLoginAttempts: '5',
  passwordMinLength: '8',
  requireStrongPassword: true,
  enableCaptcha: false,
};

/**
 * Obtiene la configuración de seguridad
 */
export function getSecuritySettings(): SecuritySettings {
  const saved = localStorage.getItem('security_settings');
  return saved ? JSON.parse(saved) : DEFAULT_SECURITY_SETTINGS;
}

/**
 * Valida si la contraseña cumple con los requisitos de seguridad
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  const settings = getSecuritySettings();
  const minLength = parseInt(settings.passwordMinLength);

  if (password.length < minLength) {
    return {
      valid: false,
      message: `La contraseña debe tener al menos ${minLength} caracteres`,
    };
  }

  if (settings.requireStrongPassword) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return {
        valid: false,
        message: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
      };
    }
  }

  return { valid: true };
}

/**
 * Genera la clave para el email en localStorage
 */
function getEmailKey(email: string): string {
  return `login_attempts_${email.toLowerCase()}`;
}

function getBlockedKey(email: string): string {
  return `blocked_until_${email.toLowerCase()}`;
}

/**
 * Verifica si un email específico está bloqueado por intentos fallidos
 */
export function isUserBlocked(email: string): { blocked: boolean; remainingTime?: number } {
  const blockedKey = getBlockedKey(email);
  const blockedUntil = localStorage.getItem(blockedKey);
  
  if (!blockedUntil) {
    return { blocked: false };
  }

  const blockedTimestamp = parseInt(blockedUntil);
  const now = Date.now();

  if (now < blockedTimestamp) {
    const remainingTime = Math.ceil((blockedTimestamp - now) / 1000 / 60); // minutos
    return { blocked: true, remainingTime };
  }

  // El bloqueo expiró, limpiar
  clearLoginAttempts(email);
  return { blocked: false };
}

/**
 * Registra un intento de login fallido para un email específico
 */
export function recordFailedAttempt(email: string): { blocked: boolean; attemptsLeft: number; blockedMinutes?: number } {
  const settings = getSecuritySettings();
  const maxAttempts = parseInt(settings.maxLoginAttempts);
  
  const emailKey = getEmailKey(email);
  const attemptsStr = localStorage.getItem(emailKey);
  const attempts = attemptsStr ? parseInt(attemptsStr) : 0;
  const newAttempts = attempts + 1;

  localStorage.setItem(emailKey, newAttempts.toString());

  if (newAttempts >= maxAttempts) {
    // Bloquear por 15 minutos
    const blockDuration = 15 * 60 * 1000; // 15 minutos en ms
    const blockedUntil = Date.now() + blockDuration;
    const blockedKey = getBlockedKey(email);
    localStorage.setItem(blockedKey, blockedUntil.toString());
    
    return { blocked: true, attemptsLeft: 0, blockedMinutes: 15 };
  }

  return { blocked: false, attemptsLeft: maxAttempts - newAttempts };
}

/**
 * Limpia los intentos de login de un email específico después de un login exitoso
 */
export function clearLoginAttempts(email: string): void {
  const emailKey = getEmailKey(email);
  const blockedKey = getBlockedKey(email);
  localStorage.removeItem(emailKey);
  localStorage.removeItem(blockedKey);
}

/**
 * Obtiene el número de intentos actuales para un email
 */
export function getCurrentAttempts(email: string): number {
  const emailKey = getEmailKey(email);
  const attemptsStr = localStorage.getItem(emailKey);
  return attemptsStr ? parseInt(attemptsStr) : 0;
}
