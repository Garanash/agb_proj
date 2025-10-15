#!/usr/bin/env node

/**
 * Скрипт для создания новых компонентов с правильной структурой
 */

const fs = require('fs');
const path = require('path');

// Шаблоны компонентов
const templates = {
  ui: `'use client'

import React from 'react'
import type { ReactNode } from 'react'

interface {{ComponentName}}Props {
  children?: ReactNode
  className?: string
}

const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={\`{{componentName}} \${className}\`}>
      {children}
    </div>
  )
}

export default {{ComponentName}}
`,

  feature: `'use client'

import React from 'react'
import type { ReactNode } from 'react'

interface {{ComponentName}}Props {
  children?: ReactNode
  className?: string
}

const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={\`{{componentName}} \${className}\`}>
      {children}
    </div>
  )
}

export default {{ComponentName}}
`,

  form: `'use client'

import React, { useState } from 'react'
import type { FormEvent } from 'react'

interface {{ComponentName}}Props {
  onSubmit?: (data: any) => void
  className?: string
}

const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ 
  onSubmit,
  className = '' 
}) => {
  const [formData, setFormData] = useState({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className={\`{{componentName}} \${className}\`}
    >
      {/* Форма */}
    </form>
  )
}

export default {{ComponentName}}
`,

  modal: `'use client'

import React from 'react'
import { Modal } from '@/components/ui'
import type { ReactNode } from 'react'

interface {{ComponentName}}Props {
  isOpen: boolean
  onClose: () => void
  children?: ReactNode
  title?: string
}

const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ 
  isOpen,
  onClose,
  children,
  title
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      {children}
    </Modal>
  )
}

export default {{ComponentName}}
`,
};

// Функция для создания компонента
function createComponent(componentName, category = 'ui') {
  const componentNameKebab = componentName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  const template = templates[category];
  if (!template) {
    console.error(`❌ Неизвестная категория: ${category}`);
    console.log('Доступные категории:', Object.keys(templates).join(', '));
    return;
  }

  const componentContent = template
    .replace(/{{ComponentName}}/g, componentName)
    .replace(/{{componentName}}/g, componentNameKebab);

  const categoryDir = path.join(__dirname, '..', 'src', 'components', category);
  const componentFile = path.join(categoryDir, `${componentName}.tsx`);

  // Создаем директорию если не существует
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  // Создаем файл компонента
  fs.writeFileSync(componentFile, componentContent, 'utf8');
  console.log(`✅ Создан компонент: ${componentFile}`);

  // Обновляем index.ts
  updateIndexFile(category, componentName);
}

// Функция для обновления index.ts
function updateIndexFile(category, componentName) {
  const indexFile = path.join(__dirname, '..', 'src', 'components', category, 'index.ts');
  
  let content = '';
  if (fs.existsSync(indexFile)) {
    content = fs.readFileSync(indexFile, 'utf8');
  }

  const exportLine = `export { default as ${componentName} } from './${componentName}'\n`;
  
  if (!content.includes(exportLine.trim())) {
    content += exportLine;
    fs.writeFileSync(indexFile, content, 'utf8');
    console.log(`✅ Обновлен: ${indexFile}`);
  }
}

// Функция для создания хука
function createHook(hookName) {
  const hookContent = `/**
 * Хук: ${hookName}
 */

import { useState, useEffect } from 'react'

export function ${hookName}() {
  // Логика хука
  return {
    // Возвращаемые значения
  }
}
`;

  const hooksDir = path.join(__dirname, '..', 'src', 'hooks');
  const hookFile = path.join(hooksDir, `${hookName}.ts`);

  fs.writeFileSync(hookFile, hookContent, 'utf8');
  console.log(`✅ Создан хук: ${hookFile}`);

  // Обновляем index.ts
  updateHooksIndex(hookName);
}

// Функция для обновления hooks/index.ts
function updateHooksIndex(hookName) {
  const indexFile = path.join(__dirname, '..', 'src', 'hooks', 'index.ts');
  
  let content = '';
  if (fs.existsSync(indexFile)) {
    content = fs.readFileSync(indexFile, 'utf8');
  }

  const exportLine = `export { ${hookName} } from './${hookName}'\n`;
  
  if (!content.includes(exportLine.trim())) {
    content += exportLine;
    fs.writeFileSync(indexFile, content, 'utf8');
    console.log(`✅ Обновлен: ${indexFile}`);
  }
}

// Основная функция
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Использование:
  node scripts/create-component.js <имя> [категория]
  
Категории:
  ui       - UI компоненты (по умолчанию)
  feature  - Feature компоненты
  form     - Формы
  modal    - Модальные окна
  hook     - Хуки

Примеры:
  node scripts/create-component.js Button ui
  node scripts/create-component.js UserProfile feature
  node scripts/create-component.js LoginForm form
  node scripts/create-component.js ConfirmModal modal
  node scripts/create-component.js useUserData hook
`);
    return;
  }

  const [name, category] = args;
  
  if (category === 'hook') {
    createHook(name);
  } else {
    createComponent(name, category || 'ui');
  }
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = { createComponent, createHook };
