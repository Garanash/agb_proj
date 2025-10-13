#!/bin/bash

# Скрипт для синхронизации всех компонентов между директориями
# Использование: ./scripts/production/sync-components.sh

set -e

echo "🔄 Синхронизация компонентов"
echo "============================"

# Переходим в директорию frontend
cd frontend

echo "📁 Синхронизация UI компонентов..."
# Синхронизируем UI компоненты
cp src/components/ui/card.tsx components/ui/card.tsx 2>/dev/null || true
cp src/components/ui/button.tsx components/ui/button.tsx 2>/dev/null || true
cp src/components/ui/badge.tsx components/ui/badge.tsx 2>/dev/null || true
cp src/components/ui/tabs.tsx components/ui/tabs.tsx 2>/dev/null || true
cp src/components/ui/Logo.tsx components/ui/Logo.tsx 2>/dev/null || true
cp src/components/ui/BulkInputArea.tsx components/ui/BulkInputArea.tsx 2>/dev/null || true
cp src/components/ui/Modal.tsx components/ui/Modal.tsx 2>/dev/null || true
cp src/components/ui/AdvancedSearchFilters.tsx components/ui/AdvancedSearchFilters.tsx 2>/dev/null || true
cp src/components/ui/ArchiveStats.tsx components/ui/ArchiveStats.tsx 2>/dev/null || true
cp src/components/ui/Calendar.tsx components/ui/Calendar.tsx 2>/dev/null || true
cp src/components/ui/TextLogo.tsx components/ui/TextLogo.tsx 2>/dev/null || true

echo "📁 Синхронизация основных компонентов..."
# Синхронизируем основные компоненты
cp src/components/AutomationBuilder.tsx components/AutomationBuilder.tsx 2>/dev/null || true
cp src/components/WorkflowCanvasSimple.tsx components/WorkflowCanvasSimple.tsx 2>/dev/null || true
cp src/components/NomenclatureManagement.tsx components/NomenclatureManagement.tsx 2>/dev/null || true
cp src/components/AIMatchingChat.tsx components/AIMatchingChat.tsx 2>/dev/null || true
cp src/components/ExcelDataTable.tsx components/ExcelDataTable.tsx 2>/dev/null || true

echo "🔍 Проверка синхронизации..."
echo "UI компоненты:"
ls -la components/ui/ | grep -E "(card|button|badge|tabs|Logo|BulkInputArea|Modal|AdvancedSearchFilters|ArchiveStats|Calendar|TextLogo)" || echo "   Некоторые UI компоненты отсутствуют"

echo "Основные компоненты:"
ls -la components/ | grep -E "(AutomationBuilder|WorkflowCanvasSimple|NomenclatureManagement|AIMatchingChat|ExcelDataTable)" || echo "   Некоторые основные компоненты отсутствуют"

echo "✅ Синхронизация завершена!"
