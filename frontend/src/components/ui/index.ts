/**
 * Barrel export для UI компонентов
 */

// Named exports
export { default as Modal } from './Modal'
export { default as Logo } from './Logo'
export { default as TextLogo } from './TextLogo'
export { default as Calendar } from './Calendar'
export { default as ArchiveStats } from './ArchiveStats'
export { default as AdvancedSearchFilters } from './AdvancedSearchFilters'
export { default as BulkInputArea } from './BulkInputArea'

// Re-export from main UI components
export { Button } from '../../components/ui/button'
export { Badge } from '../../components/ui/badge'
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
export { Input } from '../../components/ui/input'
export { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
export { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar'
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table'
export { Alert, AlertDescription } from '../../components/ui/alert'

// Default export for backward compatibility
export { default } from './Modal'