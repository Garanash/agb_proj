/**
 * Barrel export для всех компонентов
 */

// Layout components
export { default as PageLayout } from './PageLayout'
export { default as AppLayout } from './AppLayout'
export { default as RoleBasedNavigation } from './RoleBasedNavigation'
export { default as Sidebar } from './Sidebar'

// Auth components
export { default as LoginForm } from './LoginForm'
export { default as RegistrationModal } from './RegistrationModal'
export { default as SimpleLoginForm } from './SimpleLoginForm'
export { default as AuthGuard } from './AuthGuard'
export { AuthProvider as AuthContext, useAuth } from './AuthContext'
export { AuthProvider as SimpleAuthContext } from './SimpleAuthContext'

// UI components
export { default as AdvancedSearchFilters } from '@/src/components/ui/AdvancedSearchFilters'
export { default as ArchiveStats } from '@/src/components/ui/ArchiveStats'
export { default as BulkInputArea } from '@/components/ui/BulkInputArea'
export { default as Calendar } from './Calendar'
export { default as Logo } from '@/components/ui/Logo'
export { default as Modal } from '@/components/ui/Modal'
export { default as TextLogo } from '@/src/components/ui/TextLogo'

// Modal components
export { default as AddEventModal } from './AddEventModal'
export { default as CompanyEmployeeModal } from './CompanyEmployeeModal'
export { default as ContractorResponsesModal } from './ContractorResponsesModal'
export { default as CreateDepartmentModal } from './CreateDepartmentModal'
export { default as EditDepartmentModal } from './EditDepartmentModal'
export { default as EditEventModal } from './EditEventModal'
export { default as EditRequestModal } from './EditRequestModal'

// Chat components
export { default as ChatBotEditor } from './ChatBotEditor'
export { default as ChatFoldersModal } from './ChatFoldersModal'
export { default as ChatParticipantsModal } from './ChatParticipantsModal'
export { default as CreateChatRoomModal } from './CreateChatRoomModal'

// Admin components
export { default as UserRoleManager } from './UserRoleManager'
export { default as CreateUserModal } from './CreateUserModal'
export { default as EditUserModal } from './EditUserModal'
export { default as UserProfile } from './UserProfile'

// Other components
export { default as AutomationBuilder } from './AutomationBuilder'
export { default as NomenclatureSelector } from './NomenclatureSelector'
export { default as PassportPreview } from './PassportPreview'
export { default as NewsWidget } from './NewsWidget'
export { default as ProfileEditModal } from './ProfileEditModal'
export { default as PrivacyPolicyModal } from './PrivacyPolicyModal'
export { default as ForcePasswordChangeModal } from './ForcePasswordChangeModal'
export { default as DevelopmentModal } from './DevelopmentModal'
export { default as EditNewsModal } from './EditNewsModal'
export { default as CreateNewsModal } from './CreateNewsModal'
export { default as ContractorRegistrationForm } from './ContractorRegistrationForm'
export { default as CustomerRegistrationForm } from './CustomerRegistrationForm'
