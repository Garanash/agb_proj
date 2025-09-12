#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function findFiles(dir, pattern) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, pattern));
    } else if (stat.isFile() && pattern.test(item)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Функция для замены API endpoints
function fixApiEndpoints(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Заменяем /api/ на /api/v1/ для всех endpoints кроме уже исправленных
  const patterns = [
    // Заменяем /api/auth/logout на /api/v1/auth/logout
    { from: /\/api\/auth\/logout/g, to: '/api/v1/auth/logout' },
    // Заменяем /api/ на /api/v1/ для всех остальных endpoints
    { from: /\/api\/(?!v1\/)/g, to: '/api/v1/' }
  ];
  
  for (const pattern of patterns) {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Основная функция
function main() {
  console.log('🔧 Fixing all API endpoints...');
  
  const frontendDir = path.join(__dirname, '..');
  const files = findFiles(frontendDir, /\.(tsx?|jsx?)$/);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixApiEndpoints(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} files`);
  console.log('✅ All API endpoints updated to use /api/v1/');
}

main();
