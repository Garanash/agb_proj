/**
 * Компонент для управления настройками email v3
 * ВРЕМЕННО ОТКЛЮЧЕН ДЛЯ СБОРКИ
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

const EmailSettingsV3: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройки Email</CardTitle>
          <CardDescription>
            Компонент временно отключен для сборки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Настройки email будут доступны в следующей версии
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettingsV3;