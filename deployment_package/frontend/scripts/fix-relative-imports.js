#!/usr/bin/env node

/**
 * Скрипт для исправления относительных импортов в компонентах
 */

const fs = require('fs');
const path = require('path');

// Маппинг для исправления импортов
const importMappings = {
  // AuthContext
  "from './AuthContext'": "from '@/hooks'",
  "from '../AuthContext'": "from '@/hooks'",
  "from '../../AuthContext'": "from '@/hooks'",
  
  // Forms
  "from './CustomerRegistrationForm'": "from '@/components/forms'",
  "from './ContractorRegistrationForm'": "from '@/components/forms'",
  "from '../forms/CustomerRegistrationForm'": "from '@/components/forms'",
  "from '../forms/ContractorRegistrationForm'": "from '@/components/forms'",
  
  // Modals
  "from './PrivacyPolicyModal'": "from '@/components/features/admin'",
  "from './LoginSuccessModal'": "from '@/components/features/auth'",
  "from '../admin/PrivacyPolicyModal'": "from '@/components/features/admin'",
  "from '../auth/LoginSuccessModal'": "from '@/components/features/auth'",
  
  // UI Components
  "from './Modal'": "from '@/components/ui'",
  "from './Logo'": "from '@/components/ui'",
  "from './TextLogo'": "from '@/components/ui'",
  "from './Calendar'": "from '@/components/ui'",
  "from '../ui/Modal'": "from '@/components/ui'",
  "from '../ui/Logo'": "from '@/components/ui'",
  "from '../ui/TextLogo'": "from '@/components/ui'",
  "from '../ui/Calendar'": "from '@/components/ui'",
  
  // Layout Components
  "from './AppLayout'": "from '@/components/layout'",
  "from './PageLayout'": "from '@/components/layout'",
  "from './Sidebar'": "from '@/components/layout'",
  "from '../layout/AppLayout'": "from '@/components/layout'",
  "from '../layout/PageLayout'": "from '@/components/layout'",
  "from '../layout/Sidebar'": "from '@/components/layout'",
  
  // Utils
  "from './api'": "from '@/utils'",
  "from '../utils/api'": "from '@/utils'",
  "from '../../utils/api'": "from '@/utils'",
  
  // Types
  "from './types'": "from '@/types'",
  "from '../types'": "from '@/types'",
  "from '../../types'": "from '@/types'",
};

// Функция для исправления импортов в файле
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Исправляем импорты
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const oldImportRegex = new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (oldImportRegex.test(content)) {
        content = content.replace(oldImportRegex, newImport);
        hasChanges = true;
      }
    }
    
    // Исправляем импорты useAuth
    if (content.includes("import { useAuth } from './AuthContext'")) {
      content = content.replace(
        "import { useAuth } from './AuthContext'",
        "import { useAuth } from '@/hooks'"
      );
      hasChanges = true;
    }
    
    if (content.includes("import { useAuth } from '../AuthContext'")) {
      content = content.replace(
        "import { useAuth } from '../AuthContext'",
        "import { useAuth } from '@/hooks'"
      );
      hasChanges = true;
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
  const srcDir = path.join(__dirname, '..', 'src');
  
  console.log('🔄 Исправление относительных импортов...\n');
  
  let fixedFiles = 0;
  
  // Исправляем файлы в src директории
  if (fs.existsSync(srcDir)) {
    const srcFiles = findFiles(srcDir);
    for (const file of srcFiles) {
      if (fixImportsInFile(file)) {
        fixedFiles++;
      }
    }
  }
  
  console.log(`\n✨ Исправлено файлов: ${fixedFiles}`);
  console.log('🎉 Исправление импортов завершено!');
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = { fixImportsInFile, findFiles };
