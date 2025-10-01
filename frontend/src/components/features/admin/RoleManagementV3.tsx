/**
 * Компонент для управления ролями и разрешениями v3
 * ВРЕМЕННО ОТКЛЮЧЕН ДЛЯ СБОРКИ
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

const RoleManagementV3: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Управление ролями</CardTitle>
          <CardDescription>
            Компонент временно отключен для сборки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Управление ролями будет доступно в следующей версии
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagementV3;