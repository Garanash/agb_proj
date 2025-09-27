/**
 * Barrel export для admin компонентов
 */

// Named exports
export { default as DevelopmentModal } from './DevelopmentModal'
export { default as PrivacyPolicyModal } from './PrivacyPolicyModal'

// Admin Panel v3 components
export { AdminPanelV3 } from './AdminPanelV3'
export { UserManagementV3 } from './UserManagementV3'
export { RoleManagementV3 } from './RoleManagementV3'
export { EmailSettingsV3 } from './EmailSettingsV3'
export { ApiKeySettingsV3 } from './ApiKeySettingsV3'
export { SystemNotificationsV3 } from './SystemNotificationsV3'
export { SystemSettingsV3 } from './SystemSettingsV3'

// Default export for backward compatibility
export { default } from './DevelopmentModal'