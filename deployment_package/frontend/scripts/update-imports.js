#!/usr/bin/env node

/**
 * Скрипт для автоматического обновления импортов после реорганизации
 */

const fs = require('fs');
const path = require('path');

// Маппинг старых путей на новые
const importMappings = {
  // Компоненты
  '@/components/AuthContext': '@/contexts',
  '@/components/SimpleAuthContext': '@/contexts',
  '@/components/AuthGuard': '@/components/features/auth',
  '@/components/LoginForm': '@/components/features/auth',
  '@/components/SimpleLoginForm': '@/components/features/auth',
  '@/components/RegistrationModal': '@/components/features/auth',
  '@/components/LoginSuccessModal': '@/components/features/auth',
  
  '@/components/UserProfile': '@/components/features/users',
  '@/components/UserRoleManager': '@/components/features/users',
  '@/components/CreateUserModal': '@/components/features/users',
  '@/components/EditUserModal': '@/components/features/users',
  '@/components/ProfileEditModal': '@/components/features/users',
  
  '@/components/NewsWidget': '@/components/features/news',
  '@/components/CreateNewsModal': '@/components/features/news',
  '@/components/EditNewsModal': '@/components/features/news',
  
  '@/components/ChatBotEditor': '@/components/features/chat',
  '@/components/ChatFoldersModal': '@/components/features/chat',
  '@/components/ChatParticipantsModal': '@/components/features/chat',
  '@/components/CreateChatRoomModal': '@/components/features/chat',
  
  '@/components/PassportPreview': '@/components/features/ved-passports',
  '@/components/NomenclatureSelector': '@/components/features/ved-passports',
  
  '@/components/DevelopmentModal': '@/components/features/admin',
  '@/components/PrivacyPolicyModal': '@/components/features/admin',
  
  '@/components/ContractorRegistrationForm': '@/components/forms',
  '@/components/CustomerRegistrationForm': '@/components/forms',
  
  '@/components/AddEventModal': '@/components/modals',
  '@/components/EditEventModal': '@/components/modals',
  '@/components/EditRequestModal': '@/components/modals',
  '@/components/CompanyEmployeeModal': '@/components/modals',
  '@/components/ContractorResponsesModal': '@/components/modals',
  '@/components/CreateDepartmentModal': '@/components/modals',
  '@/components/EditDepartmentModal': '@/components/modals',
  
  '@/components/Modal': '@/components/ui',
  '@/components/Logo': '@/components/ui',
  '@/components/TextLogo': '@/components/ui',
  '@/components/Calendar': '@/components/ui',
  '@/components/ArchiveStats': '@/components/ui',
  '@/components/AdvancedSearchFilters': '@/components/ui',
  '@/components/BulkInputArea': '@/components/ui',
  
  '@/components/AppLayout': '@/components/layout',
  '@/components/PageLayout': '@/components/layout',
  '@/components/Sidebar': '@/components/layout',
  '@/components/RoleBasedNavigation': '@/components/layout',
  
  // Утилиты
  '@/utils/api': '@/utils',
  '@/utils/errorHandler': '@/utils',
  
  // Хуки
  '@/components/AuthContext': '@/hooks', // для useAuth
};

// Функция для обновления импортов в файле
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Обновляем импорты
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const oldImportRegex = new RegExp(`from\\s+['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (oldImportRegex.test(content)) {
        content = content.replace(oldImportRegex, `from '${newPath}'`);
        hasChanges = true;
      }
    }
    
    // Обновляем useAuth импорт
    if (content.includes("import { useAuth } from '@/components/AuthContext'")) {
      content = content.replace(
        "import { useAuth } from '@/components/AuthContext'",
        "import { useAuth } from '@/hooks'"
      );
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Обновлен: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Ошибка при обновлении ${filePath}:`, error.message);
    return false;
  }
}

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Основная функция
function main() {
  const appDir = path.join(__dirname, '..', 'app');
  const componentsDir = path.join(__dirname, '..', 'src');
  
  console.log('🔄 Начинаем обновление импортов...\n');
  
  let updatedFiles = 0;
  
  // Обновляем файлы в app директории
  if (fs.existsSync(appDir)) {
    const appFiles = findFiles(appDir);
    for (const file of appFiles) {
      if (updateImportsInFile(file)) {
        updatedFiles++;
      }
    }
  }
  
  // Обновляем файлы в src директории
  if (fs.existsSync(componentsDir)) {
    const srcFiles = findFiles(componentsDir);
    for (const file of srcFiles) {
      if (updateImportsInFile(file)) {
        updatedFiles++;
      }
    }
  }
  
  console.log(`\n✨ Обновлено файлов: ${updatedFiles}`);
  console.log('🎉 Обновление импортов завершено!');
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = { updateImportsInFile, findFiles };
