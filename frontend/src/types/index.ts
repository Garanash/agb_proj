/**
 * Основные типы приложения
 */

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  role: 'admin' | 'manager' | 'employee' | 'ved_passport' | 'customer' | 'contractor' | 'service_engineer'
  is_active: boolean
  created_at: string
  avatar_url?: string | null
  department_id?: number | null
  phone?: string | null
  position?: string | null
  is_password_changed?: boolean
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  hasInitialized?: boolean
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  showCloseButton?: boolean
}

export interface LoginFormProps {
  onClose?: () => void
}

export interface LoginSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  password: string
  userType: string
}

export interface NewsItem {
  id: number
  title: string
  content: string
  author: string
  created_at: string
  updated_at: string
  is_published: boolean
}

export interface Department {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface RepairRequest {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  customer_id: number
  contractor_id?: number
  created_at: string
  updated_at: string
}

export interface VedPassport {
  id: number
  number: string
  title: string
  description: string
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

// API Response типы
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// Form типы
export interface LoginFormData {
  username: string
  password: string
}

export interface RegistrationFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  first_name: string
  last_name: string
  middle_name?: string
  phone?: string
  role: 'customer' | 'contractor'
}

// UI типы
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'datetime-local'

// Theme типы
export type Theme = 'light' | 'dark'
export type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'yellow'
