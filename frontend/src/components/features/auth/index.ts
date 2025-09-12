/**
 * Barrel export для auth компонентов
 */

// Named exports
export { default as AuthGuard } from './AuthGuard'
export { default as LoginForm } from './LoginForm'
export { default as SimpleLoginForm } from './SimpleLoginForm'
export { default as RegistrationModal } from './RegistrationModal'
export { default as LoginSuccessModal } from './LoginSuccessModal'

// Default export for backward compatibility
export { default } from './LoginForm'