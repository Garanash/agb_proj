#!/usr/bin/env node

/**
 * Финальный скрипт для исправления импортов
 */

const fs = require('fs');
const path = require('path');

// Маппинг для исправления импортов
const importMappings = {
  // Layout components
  "import PageLayout from '@/components/layout'": "import { PageLayout } from '@/components/layout'",
  "import AppLayout from '@/components/layout'": "import { AppLayout } from '@/components/layout'",
  "import Sidebar from '@/components/layout'": "import { Sidebar } from '@/components/layout'",
  
  // UI components
  "import Modal from '@/components/ui'": "import { Modal } from '@/components/ui'",
  "import Logo from '@/components/ui'": "import { Logo } from '@/components/ui'",
  "import TextLogo from '@/components/ui'": "import { TextLogo } from '@/components/ui'",
  "import Calendar from '@/components/ui'": "import { Calendar } from '@/components/ui'",
  
  // Auth components
  "import LoginForm from '@/components/features/auth'": "import { LoginForm } from '@/components/features/auth'",
  "import RegistrationModal from '@/components/features/auth'": "import { RegistrationModal } from '@/components/features/auth'",
  "import LoginSuccessModal from '@/components/features/auth'": "import { LoginSuccessModal } from '@/components/features/auth'",
  
  // User components
  "import CreateUserModal from '@/components/features/users'": "import { CreateUserModal } from '@/components/features/users'",
  "import EditUserModal from '@/components/features/users'": "import { EditUserModal } from '@/components/features/users'",
  "import UserProfile from '@/components/features/users'": "import { UserProfile } from '@/components/features/users'",
  
  // Chat components
  "import ChatBotEditor from '@/components/features/chat'": "import { ChatBotEditor } from '@/components/features/chat'",
  "import CreateChatRoomModal from '@/components/features/chat'": "import { CreateChatRoomModal } from '@/components/features/chat'",
  "import ChatParticipantsModal from '@/components/features/chat'": "import { ChatParticipantsModal } from '@/components/features/chat'",
  "import ChatFoldersModal from '@/components/features/chat'": "import { ChatFoldersModal } from '@/components/features/chat'",
  
  // Admin components
  "import DevelopmentModal from '@/components/features/admin'": "import { DevelopmentModal } from '@/components/features/admin'",
  "import PrivacyPolicyModal from '@/components/features/admin'": "import { PrivacyPolicyModal } from '@/components/features/admin'",
  
  // Modal components
  "import CreateDepartmentModal from '@/components/modals'": "import { CreateDepartmentModal } from '@/components/modals'",
  "import EditDepartmentModal from '@/components/modals'": "import { EditDepartmentModal } from '@/components/modals'",
  "import CompanyEmployeeModal from '@/components/modals'": "import { CompanyEmployeeModal } from '@/components/modals'",
  "import EditRequestModal from '@/components/modals'": "import { EditRequestModal } from '@/components/modals'",
  "import ContractorResponsesModal from '@/components/modals'": "import { ContractorResponsesModal } from '@/components/modals'",
  "import AddEventModal from '@/components/modals'": "import { AddEventModal } from '@/components/modals'",
  "import EditEventModal from '@/components/modals'": "import { EditEventModal } from '@/components/modals'",
  
  // Form components
  "import CustomerRegistrationForm from '@/components/forms'": "import { CustomerRegistrationForm } from '@/components/forms'",
  "import ContractorRegistrationForm from '@/components/forms'": "import { ContractorRegistrationForm } from '@/components/forms'",
};

// Функция для исправления импортов в файле
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Исправляем импорты
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Исправлен: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Ошибка при исправлении ${filePath}:`, error.message);
    return false;
  }
}

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions = ['.ts', '.tsx']) {
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
  
  console.log('🔄 Финальное исправление импортов...\n');
  
  let fixedFiles = 0;
  
  // Исправляем файлы в app директории
  if (fs.existsSync(appDir)) {
    const appFiles = findFiles(appDir);
    for (const file of appFiles) {
      if (fixImportsInFile(file)) {
        fixedFiles++;
      }
    }
  }
  
  console.log(`\n✨ Исправлено файлов: ${fixedFiles}`);
  console.log('🎉 Финальное исправление импортов завершено!');
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = { fixImportsInFile, findFiles };
