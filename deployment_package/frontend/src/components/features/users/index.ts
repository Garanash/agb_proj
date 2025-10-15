/**
 * Barrel export для user компонентов
 */

// Named exports
export { default as CreateUserModal } from './CreateUserModal'
export { default as EditUserModal } from './EditUserModal'
export { default as ProfileEditModal } from './ProfileEditModal'
export { default as UserProfile } from './UserProfile'
export { default as UserRoleManager } from './UserRoleManager'

// Default export for backward compatibility
export { default } from './UserProfile'