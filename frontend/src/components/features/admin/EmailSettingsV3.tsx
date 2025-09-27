/**
 * Компонент для управления настройками email v3
 */

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Input, Switch, Badge,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Alert, AlertDescription,
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui';
import { 
  Mail, Plus, Edit, Trash2, TestTube, 
  CheckCircle, XCircle, Settings, Send
} from 'lucide-react';
import { useForm } from 'react-hook-form';

interface EmailSettings {
  id: number;
  name: string;
  smtpServer: string;
  smtpPort: number;
  username: string;
  useTls: boolean;
  useSsl: boolean;
  fromEmail: string;
  fromName?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface EmailFormData {
  name: string;
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  useTls: boolean;
  useSsl: boolean;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
  isDefault: boolean;
}

interface TestEmailData {
  toEmail: string;
  subject: string;
  body: string;
}

export const EmailSettingsV3: React.FC = () => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([]);
  const [selectedSettings, setSelectedSettings] = useState<EmailSettings | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);

  const settingsForm = useForm<EmailFormData>({
    defaultValues: {
      name: '',
      smtpServer: '',
      smtpPort: 587,
      username: '',
      password: '',
      useTls: true,
      useSsl: false,
      fromEmail: '',
      fromName: '',
      isActive: true,
      isDefault: false
    }
  });

  const testForm = useForm<TestEmailData>({
    defaultValues: {
      toEmail: '',
      subject: 'Тест настроек почты',
      body: 'Это тестовое сообщение для проверки настроек почты.'
    }
  });

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      // TODO: Загрузить настройки email через API v3
      setEmailSettings([
        {
          id: 1,
          name: 'Gmail SMTP',
          smtpServer: 'smtp.gmail.com',
          smtpPort: 587,
          username: 'your-email@gmail.com',
          useTls: true,
          useSsl: false,
          fromEmail: 'your-email@gmail.com',
          fromName: 'AGB Platform',
          isActive: false,
          isDefault: true,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки настроек email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSettings = () => {
    setSelectedSettings(null);
    setIsEditing(false);
    settingsForm.reset({
      name: '',
      smtpServer: '',
      smtpPort: 587,
      username: '',
      password: '',
      useTls: true,
      useSsl: false,
      fromEmail: '',
      fromName: '',
      isActive: true,
      isDefault: false
    });
    setShowSettingsDialog(true);
  };

  const handleEditSettings = (settings: EmailSettings) => {
    setSelectedSettings(settings);
    setIsEditing(true);
    settingsForm.reset({
      name: settings.name,
      smtpServer: settings.smtpServer,
      smtpPort: settings.smtpPort,
      username: settings.username,
      password: '', // Пароль не загружаем из соображений безопасности
      useTls: settings.useTls,
      useSsl: settings.useSsl,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName || '',
      isActive: settings.isActive,
      isDefault: settings.isDefault
    });
    setShowSettingsDialog(true);
  };

  const handleTestSettings = (settings: EmailSettings) => {
    setSelectedSettings(settings);
    testForm.reset({
      toEmail: '',
      subject: 'Тест настроек почты',
      body: 'Это тестовое сообщение для проверки настроек почты.'
    });
    setShowTestDialog(true);
  };

  const onSubmitSettings = async (data: EmailFormData) => {
    try {
      if (isEditing && selectedSettings) {
        // TODO: Обновить настройки через API
        console.log('Обновление настроек email:', data);
      } else {
        // TODO: Создать настройки через API
        console.log('Создание настроек email:', data);
      }
      setShowSettingsDialog(false);
      loadEmailSettings();
    } catch (error) {
      console.error('Ошибка сохранения настроек email:', error);
    }
  };

  const onSubmitTest = async (data: TestEmailData) => {
    if (!selectedSettings) return;
    
    setTestLoading(true);
    try {
      // TODO: Отправить тестовое письмо через API
      console.log('Отправка тестового письма:', { settingsId: selectedSettings.id, ...data });
      
      // Имитация отправки
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowTestDialog(false);
      // TODO: Показать уведомление об успешной отправке
    } catch (error) {
      console.error('Ошибка отправки тестового письма:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleDeleteSettings = async (settingsId: number) => {
    if (!confirm('Вы действительно хотите удалить эти настройки email?')) {
      return;
    }
    
    try {
      // TODO: Удалить настройки через API
      console.log('Удаление настроек email:', settingsId);
      loadEmailSettings();
    } catch (error) {
      console.error('Ошибка удаления настроек email:', error);
    }
  };

  const handleToggleActive = async (settingsId: number, isActive: boolean) => {
    try {
      // TODO: Обновить статус через API
      console.log('Изменение статуса настроек:', settingsId, isActive);
      setEmailSettings(settings => 
        settings.map(s => s.id === settingsId ? { ...s, isActive } : s)
      );
    } catch (error) {
      console.error('Ошибка изменения статуса настроек:', error);
    }
  };

  const getProviderPresets = () => [
    {
      name: 'Gmail',
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      useTls: true,
      useSsl: false
    },
    {
      name: 'Yandex',
      smtpServer: 'smtp.yandex.ru',
      smtpPort: 465,
      useTls: false,
      useSsl: true
    },
    {
      name: 'Mail.ru',
      smtpServer: 'smtp.mail.ru',
      smtpPort: 465,
      useTls: false,
      useSsl: true
    },
    {
      name: 'Outlook',
      smtpServer: 'smtp.live.com',
      smtpPort: 587,
      useTls: true,
      useSsl: false
    }
  ];

  const applyPreset = (preset: any) => {
    settingsForm.setValue('smtpServer', preset.smtpServer);
    settingsForm.setValue('smtpPort', preset.smtpPort);
    settingsForm.setValue('useTls', preset.useTls);
    settingsForm.setValue('useSsl', preset.useSsl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Настройки Email
              </CardTitle>
              <CardDescription>
                Управление настройками SMTP для отправки уведомлений
              </CardDescription>
            </div>
            <Button onClick={handleCreateSettings}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить настройки
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {emailSettings.length === 0 ? (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Настройки email не настроены. Добавьте настройки SMTP для отправки уведомлений.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>SMTP сервер</TableHead>
                    <TableHead>От кого</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailSettings.map(settings => (
                    <TableRow key={settings.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{settings.name}</div>
                          {settings.isDefault && (
                            <Badge variant="success" className="text-xs mt-1">
                              По умолчанию
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">{settings.smtpServer}:{settings.smtpPort}</div>
                          <div className="flex gap-1 mt-1">
                            {settings.useTls && <Badge variant="outline" className="text-xs">TLS</Badge>}
                            {settings.useSsl && <Badge variant="outline" className="text-xs">SSL</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{settings.fromName || 'Не указано'}</div>
                          <div className="text-xs text-muted-foreground">{settings.fromEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={settings.isActive}
                            onCheckedChange={(checked) => handleToggleActive(settings.id, checked)}
                          />
                          <Badge variant={settings.isActive ? 'success' : 'secondary'}>
                            {settings.isActive ? 'Активны' : 'Неактивны'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestSettings(settings)}
                            disabled={!settings.isActive}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSettings(settings)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSettings(settings.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог создания/редактирования настроек */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Редактирование настроек email' : 'Создание настроек email'}
            </DialogTitle>
            <DialogDescription>
              Настройте параметры SMTP сервера для отправки email уведомлений
            </DialogDescription>
          </DialogHeader>

          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={settingsForm.control}
                  name="name"
                  rules={{ required: 'Название обязательно' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input placeholder="Gmail SMTP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя отправителя</FormLabel>
                      <FormControl>
                        <Input placeholder="AGB Platform" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Быстрая настройка</FormLabel>
                  <Select onValueChange={(value) => {
                    const preset = getProviderPresets().find(p => p.name === value);
                    if (preset) applyPreset(preset);
                  }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Выберите провайдера" />
                    </SelectTrigger>
                    <SelectContent>
                      {getProviderPresets().map(preset => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={settingsForm.control}
                  name="smtpServer"
                  rules={{ required: 'SMTP сервер обязателен' }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>SMTP сервер</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="smtpPort"
                  rules={{ required: 'Порт обязателен' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Порт</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="587" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={settingsForm.control}
                  name="username"
                  rules={{ required: 'Имя пользователя обязательно' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя пользователя</FormLabel>
                      <FormControl>
                        <Input placeholder="your-email@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="password"
                  rules={{ required: !isEditing ? 'Пароль обязателен' : undefined }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={isEditing ? "Оставьте пустым, чтобы не менять" : "Пароль приложения"}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={settingsForm.control}
                name="fromEmail"
                rules={{ required: 'Email отправителя обязателен' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email отправителя</FormLabel>
                    <FormControl>
                      <Input placeholder="your-email@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={settingsForm.control}
                  name="useTls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Использовать TLS</FormLabel>
                        <FormDescription>
                          Шифрование STARTTLS (обычно порт 587)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="useSsl"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Использовать SSL</FormLabel>
                        <FormDescription>
                          Шифрование SSL/TLS (обычно порт 465)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-6">
                <FormField
                  control={settingsForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Активны</FormLabel>
                        <FormDescription>
                          Использовать эти настройки для отправки
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>По умолчанию</FormLabel>
                        <FormDescription>
                          Использовать как основные настройки
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {isEditing ? 'Сохранить' : 'Создать'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог тестирования настроек */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Тест настроек email
            </DialogTitle>
            <DialogDescription>
              Отправьте тестовое письмо для проверки настроек "{selectedSettings?.name}"
            </DialogDescription>
          </DialogHeader>

          <Form {...testForm}>
            <form onSubmit={testForm.handleSubmit(onSubmitTest)} className="space-y-4">
              <FormField
                control={testForm.control}
                name="toEmail"
                rules={{ required: 'Email получателя обязателен' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email получателя</FormLabel>
                    <FormControl>
                      <Input placeholder="test@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={testForm.control}
                name="subject"
                rules={{ required: 'Тема письма обязательна' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тема письма</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={testForm.control}
                name="body"
                rules={{ required: 'Текст письма обязателен' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Текст письма</FormLabel>
                    <FormControl>
                      <textarea 
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTestDialog(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={testLoading}>
                  {testLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Отправить
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
