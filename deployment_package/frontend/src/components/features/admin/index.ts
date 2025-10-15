/**
 * Barrel export для admin компонентов
 */

// Named exports
export { default as DevelopmentModal } from './DevelopmentModal'
export { default as PrivacyPolicyModal } from './PrivacyPolicyModal'

// Admin Panel v3 components
export { default as AdminPanelV3 } from './AdminPanelV3'
export { default as UserManagementV3 } from './UserManagementV3'
export { default as RoleManagementV3 } from './RoleManagementV3'
export { default as EmailSettingsV3 } from './EmailSettingsV3'
export { default as ApiKeySettingsV3 } from './ApiKeySettingsV3'
export { default as SystemNotificationsV3 } from './SystemNotificationsV3'
export { default as SystemSettingsV3 } from './SystemSettingsV3'

// Default export for backward compatibility
export { default } from './DevelopmentModal'