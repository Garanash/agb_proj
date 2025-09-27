/**
 * Компонент для управления системными уведомлениями v3
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from '@/components/ui';
import { Bell, Construction } from 'lucide-react';

export const SystemNotificationsV3: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Системные уведомления
        </CardTitle>
        <CardDescription>
          Создание и управление системными уведомлениями для пользователей
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Construction className="h-4 w-4" />
          <AlertDescription>
            Компонент в разработке. Здесь будет создание и отправка системных уведомлений пользователям.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
