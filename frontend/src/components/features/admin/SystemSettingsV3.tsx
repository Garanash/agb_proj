/**
 * Компонент для управления системными настройками v3
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
import { Settings, Construction } from 'lucide-react';

const SystemSettingsV3: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Системные настройки
        </CardTitle>
        <CardDescription>
          Управление общими настройками системы и приложения
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Construction className="h-4 w-4" />
          <AlertDescription>
            Компонент в разработке. Здесь будут настройки безопасности, UI, уведомлений и других системных параметров.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
export default SystemSettingsV3;
