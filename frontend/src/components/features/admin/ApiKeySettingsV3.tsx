/**
 * Компонент для управления API ключами v3
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
import { Key, Construction } from 'lucide-react';

const ApiKeySettingsV3: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Управление API ключами
        </CardTitle>
        <CardDescription>
          Настройка API ключей для интеграции с внешними сервисами
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Construction className="h-4 w-4" />
          <AlertDescription>
            Компонент в разработке. Здесь будет управление API ключами для OpenAI, Telegram и других сервисов.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
export default ApiKeySettingsV3;
