import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Paper,
  Checkbox,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add as AddIcon,
  Event,
  Schedule,
  Assignment,
  Person,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  RadioButtonUnchecked,
  Build,
  Straighten,
  Support,
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ru';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

// Настройка moment для русского языка
moment.locale('ru');

// Упрощенный компонент календаря для замерщика
const CalendarComponent = ({ events = [], weekends = [] }) => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [viewEventsDialogOpen, setViewEventsDialogOpen] = useState(false);

  // Получение дней месяца
  const getMonthDays = () => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');
    
    const days = [];
    let currentDay = startDate.clone();
    
    while (currentDay.isSameOrBefore(endDate)) {
      const dayEvents = events.filter(event => 
        moment(event.date).isSame(currentDay, 'day')
      );
      
      const isWeekend = weekends.some(weekend => 
        moment(weekend.date).isSame(currentDay, 'day')
      );
      
      days.push({
        date: currentDay.clone(),
        events: dayEvents,
        isWeekend,
        isCurrentMonth: currentDay.isSame(currentDate, 'month'),
        isToday: currentDay.isSame(moment(), 'day')
      });
      
      currentDay.add(1, 'day');
    }
    
    return days;
  };

  const goToPrevious = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month'));
  };

  const goToNext = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'));
  };

  const goToToday = () => {
    setCurrentDate(moment());
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    const dayEvents = events.filter(event => 
      moment(event.date).isSame(date, 'day')
    );
    setSelectedDateEvents(dayEvents);
    setViewEventsDialogOpen(true);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'measurement':
        return <Straighten />;
      case 'installation':
        return <Build />;
      case 'support':
        return <Support />;
      case 'meeting':
        return <Person />;
      case 'task':
        return <Assignment />;
      case 'reminder':
        return <Schedule />;
      default:
        return <Event />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'measurement':
        return 'primary';
      case 'installation':
        return 'secondary';
      case 'support':
        return 'info';
      case 'meeting':
        return 'success';
      case 'task':
        return 'warning';
      case 'reminder':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDisplayTitle = () => {
    return currentDate.format('MMMM YYYY');
  };

  const monthDays = getMonthDays();

  return (
    <Box>
      {/* Навигация календаря */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <ButtonGroup size="small">
          <Button onClick={goToPrevious}>
            <ChevronLeft />
          </Button>
          <Button onClick={goToNext}>
            <ChevronRight />
          </Button>
        </ButtonGroup>
        
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {getDisplayTitle()}
        </Typography>
        
        <Button variant="outlined" size="small" onClick={goToToday}>
          Сегодня
        </Button>
      </Box>

      {/* Календарная сетка */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {/* Заголовки дней недели */}
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <Box
            key={day}
            sx={{
              p: 1,
              textAlign: 'center',
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}
          >
            {day}
          </Box>
        ))}

        {/* Дни месяца */}
        {monthDays.map((day, index) => (
          <Box
            key={index}
            onClick={() => handleDayClick(day.date)}
            sx={{
              minHeight: 80,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: day.isWeekend ? 'warning.light' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main'
              },
              ...(day.isToday && {
                borderColor: 'primary.main',
                borderWidth: 2,
                backgroundColor: 'primary.light'
              }),
              ...(!day.isCurrentMonth && {
                opacity: 0.5
              })
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: day.isToday ? 700 : 500,
                color: day.isToday ? 'primary.main' : 'text.primary',
                mb: 1
              }}
            >
              {day.date.format('D')}
            </Typography>

            {/* События дня */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {day.events.slice(0, 2).map((event) => (
                <Chip
                  key={event.id}
                  label={event.title}
                  size="small"
                  icon={getEventIcon(event.type)}
                  color={getEventColor(event.type)}
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    '& .MuiChip-label': {
                      px: 0.5
                    }
                  }}
                />
              ))}
              {day.events.length > 2 && (
                <Typography variant="caption" color="text.secondary">
                  +{day.events.length - 2} еще
                </Typography>
              )}
            </Box>

            {/* Индикатор выходного */}
            {day.isWeekend && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'warning.main'
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Диалог просмотра событий дня */}
      <Dialog 
        open={viewEventsDialogOpen} 
        onClose={() => setViewEventsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          События на {selectedDate?.format('DD MMMM YYYY')}
        </DialogTitle>
        <DialogContent>
          {selectedDateEvents.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              На этот день нет запланированных событий
            </Typography>
          ) : (
            <List>
              {selectedDateEvents.map((event) => (
                <ListItem key={event.id} divider>
                  <ListItemIcon>
                    {getEventIcon(event.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={event.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {event.time} • {event.type}
                        </Typography>
                        {event.description && (
                          <Typography variant="body2" color="text.secondary">
                            {event.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Chip
                    label={event.type}
                    color={getEventColor(event.type)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewEventsDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Основной компонент календаря (для админки)
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [viewEventsDialogOpen, setViewEventsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting',
    description: '',
    date: '',
    time: '09:00',
    itemType: 'event', // 'event', 'measurement', 'installation'
    // Поля для заявок
    client_name: '',
    client_phone: '',
    street: '',
    house: '',
    apartment: '',
  });

  const queryClient = useQueryClient();

  // Получение событий из API
  const { data: events = [], isLoading } = useQuery(['events'], apiService.getEvents);

  // Мутация для добавления события
  const addEventMutation = useMutation(
    (eventData) => apiService.addEvent(eventData),
    {
      onSuccess: () => {
        toast.success('Событие добавлено успешно!');
        queryClient.invalidateQueries(['events']);
        setAddEventDialogOpen(false);
        resetNewEvent();
      },
      onError: (error) => {
        toast.error('Ошибка при добавлении события: ' + error.message);
      },
    }
  );

  // Мутация для добавления заявки на замер
  const addMeasurementRequestMutation = useMutation(
    (requestData) => apiService.addMeasurementRequest(requestData),
    {
      onSuccess: () => {
        toast.success('Заявка на замер добавлена успешно!');
        queryClient.invalidateQueries('measurement-requests');
        setAddEventDialogOpen(false);
        resetNewEvent();
      },
      onError: (error) => {
        toast.error('Ошибка при добавлении заявки на замер: ' + error.message);
      },
    }
  );

  // Мутация для добавления заявки на монтаж
  const addInstallationRequestMutation = useMutation(
    (requestData) => apiService.addInstallationRequest(requestData),
    {
      onSuccess: () => {
        toast.success('Заявка на монтаж добавлена успешно!');
        queryClient.invalidateQueries('installation-requests');
        setAddEventDialogOpen(false);
        resetNewEvent();
      },
      onError: (error) => {
        toast.error('Ошибка при добавлении заявки на монтаж: ' + error.message);
      },
    }
  );

  // Мутация для обновления события
  const updateEventMutation = useMutation(
    (eventData) => apiService.updateEvent(eventData),
    {
      onSuccess: () => {
        toast.success('Событие обновлено успешно!');
        queryClient.invalidateQueries(['events']);
        setEditEventDialogOpen(false);
        setEditingEvent(null);
      },
      onError: (error) => {
        toast.error('Ошибка при обновлении события: ' + error.message);
      },
    }
  );

  // Мутация для переключения статуса события
  const toggleStatusMutation = useMutation(
    (eventId) => apiService.toggleEventStatus(eventId),
    {
      onSuccess: () => {
        toast.success('Статус события изменен!');
        queryClient.invalidateQueries(['events']);
      },
      onError: (error) => {
        toast.error('Ошибка при изменении статуса: ' + error.message);
      },
    }
  );

  // Мутация для удаления события
  const deleteEventMutation = useMutation(
    (eventId) => apiService.deleteEvent(eventId),
    {
      onSuccess: () => {
        toast.success('Событие удалено!');
        queryClient.invalidateQueries(['events']);
        setViewEventsDialogOpen(false);
      },
      onError: (error) => {
        toast.error('Ошибка при удалении события: ' + error.message);
      },
    }
  );

  // Генерация дней для месячного вида
  const getMonthDays = () => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startOfCalendar = startOfMonth.clone().startOf('week');
    const endOfCalendar = endOfMonth.clone().endOf('week');

    const days = [];
    let day = startOfCalendar.clone();

    while (day.isSameOrBefore(endOfCalendar)) {
      days.push({
        date: day.clone(),
        isCurrentMonth: day.isSame(currentDate, 'month'),
        isToday: day.isSame(moment(), 'day'),
        events: events.filter(event => 
          moment(event.created_at).isSame(day, 'day')
        )
      });
      day.add(1, 'day');
    }

    return days;
  };

  // Генерация часов для недельного и дневного вида
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = moment().hour(hour).minute(0);
      slots.push({
        hour,
        time: time,
        events: events.filter(event => {
          const eventTime = moment(event.created_at);
          const eventHour = eventTime.hour();
          return eventHour === hour;
        })
      });
    }
    return slots;
  };

  // Получение текущего временного слота для центрирования
  const getCurrentTimeSlot = () => {
    const now = moment();
    const currentHour = now.hour();
    
    return {
      hour: currentHour,
      time: moment().hour(currentHour).minute(0)
    };
  };

  // Эффект для центрирования на текущем времени при загрузке
  useEffect(() => {
    if (viewMode === 'week' || viewMode === 'day') {
      const currentSlot = getCurrentTimeSlot();
      const timeContainer = document.querySelector('.time-slots-container');
      if (timeContainer) {
        // Находим элемент текущего времени
        const currentTimeElement = timeContainer.querySelector(`[data-hour="${currentSlot.hour}"]`);
        if (currentTimeElement) {
          // Прокручиваем к текущему времени с отступом
          currentTimeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [viewMode, currentDate]);

  // Генерация дней недели для недельного вида
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = currentDate.clone().startOf('week');
    
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.clone().add(i, 'day');
      days.push({
        date: day.clone(),
        isToday: day.isSame(moment(), 'day'),
        events: events.filter(event => 
          moment(event.created_at).isSame(day, 'day')
        )
      });
    }
    
    return days;
  };

  // Навигация по календарю
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(currentDate.clone().subtract(1, 'month'));
    } else if (viewMode === 'week') {
      setCurrentDate(currentDate.clone().subtract(1, 'week'));
    } else {
      setCurrentDate(currentDate.clone().subtract(1, 'day'));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(currentDate.clone().add(1, 'month'));
    } else if (viewMode === 'week') {
      setCurrentDate(currentDate.clone().add(1, 'week'));
    } else {
      setCurrentDate(currentDate.clone().add(1, 'day'));
    }
  };

  const goToToday = () => {
    setCurrentDate(moment());
  };

  // Обработка клика по дню
  const handleDayClick = (date) => {
    const dayEvents = events.filter(event => 
      moment(event.created_at).isSame(date, 'day')
    );
    
    setSelectedDate(date);
    setSelectedDateEvents(dayEvents);
    
    if (dayEvents.length > 0) {
      setViewEventsDialogOpen(true);
    } else {
      setNewEvent({
        ...newEvent,
        date: date.format('YYYY-MM-DD'),
        time: '09:00',
        itemType: 'event'
      });
      setAddEventDialogOpen(true);
    }
  };

  // Обработка клика по временному слоту в недельном режиме
  const handleWeekSlotClick = (date, hour) => {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    
    // Проверяем, не является ли время прошедшим
    if (isPastDateTime(date, timeString)) {
      toast.error('Нельзя создавать события в прошлом времени');
      return;
    }
    
    const slotTime = date.clone().hour(hour).minute(0);
    const slotEvents = events.filter(event => 
      moment(event.created_at).isSame(slotTime, 'hour') &&
      moment(event.created_at).isSame(date, 'day')
    );
    
    if (slotEvents.length > 0) {
      setSelectedDate(date);
      setSelectedDateEvents(slotEvents);
      setViewEventsDialogOpen(true);
    } else {
      setNewEvent({
        ...newEvent,
        date: date.format('YYYY-MM-DD'),
        time: timeString,
        itemType: 'event'
      });
      setAddEventDialogOpen(true);
    }
  };

  // Обработка клика по временному слоту в дневном режиме
  const handleDaySlotClick = (hour) => {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    
    // Проверяем, не является ли время прошедшим
    if (isPastDateTime(currentDate, timeString)) {
      toast.error('Нельзя создавать события в прошлом времени');
      return;
    }
    
    const slotTime = currentDate.clone().hour(hour).minute(0);
    const slotEvents = events.filter(event => 
      moment(event.created_at).isSame(slotTime, 'hour') &&
      moment(event.created_at).isSame(currentDate, 'day')
    );
    
    if (slotEvents.length > 0) {
      setSelectedDate(currentDate);
      setSelectedDateEvents(slotEvents);
      setViewEventsDialogOpen(true);
    } else {
      setNewEvent({
        ...newEvent,
        date: currentDate.format('YYYY-MM-DD'),
        time: timeString,
        itemType: 'event'
      });
      setAddEventDialogOpen(true);
    }
  };

  // Добавление нового события
  const handleAddEvent = () => {
    if (newEvent.itemType === 'event') {
      if (!newEvent.title || !newEvent.date) {
        toast.error('Заполните название события и дату');
        return;
      }

      const eventData = {
        title: newEvent.title,
        type: newEvent.type,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
      };

      addEventMutation.mutate(eventData);
    } else if (newEvent.itemType === 'measurement') {
      if (!newEvent.client_name || !newEvent.client_phone || !newEvent.date || !newEvent.street || !newEvent.house) {
        toast.error('Заполните имя клиента, телефон, дату, улицу и дом');
        return;
      }

      // Формируем адрес из отдельных полей
      const client_address = `${newEvent.street}, д. ${newEvent.house}${newEvent.apartment ? `, ${newEvent.apartment}` : ''}`;

      const requestData = {
        client_name: newEvent.client_name,
        client_phone: newEvent.client_phone,
        client_address: client_address,
        preferred_date: newEvent.date,
        status: 'new',
      };

      addMeasurementRequestMutation.mutate(requestData);
    } else if (newEvent.itemType === 'installation') {
      if (!newEvent.client_name || !newEvent.client_phone || !newEvent.date || !newEvent.street || !newEvent.house) {
        toast.error('Заполните имя клиента, телефон, дату, улицу и дом');
        return;
      }

      // Формируем адрес из отдельных полей
      const client_address = `${newEvent.street}, д. ${newEvent.house}${newEvent.apartment ? `, ${newEvent.apartment}` : ''}`;

      const requestData = {
        client_name: newEvent.client_name,
        client_phone: newEvent.client_phone,
        client_address: client_address,
        preferred_date: newEvent.date,
        status: 'new',
      };

      addInstallationRequestMutation.mutate(requestData);
    }
  };

  // Сброс формы нового события
  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      type: 'meeting',
      description: '',
      date: '',
      time: '09:00',
      itemType: 'event',
      client_name: '',
      client_phone: '',
      street: '',
      house: '',
      apartment: '',
    });
  };

  // Получение иконки для типа события
  const getEventIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Event color="primary" />;
      case 'task':
        return <Assignment color="secondary" />;
      case 'reminder':
        return <Schedule color="info" />;
      case 'measurement':
        return <Straighten color="success" />;
      case 'installation':
        return <Build color="warning" />;
      case 'support':
        return <Support color="error" />;
      default:
        return <Event color="default" />;
    }
  };

  // Получение цвета для типа события
  const getEventColor = (type) => {
    switch (type) {
      case 'meeting':
        return 'primary';
      case 'task':
        return 'secondary';
      case 'reminder':
        return 'info';
      case 'measurement':
        return 'success';
      case 'installation':
        return 'warning';
      case 'support':
        return 'error';
      default:
        return 'default';
    }
  };

  // Получение названия типа события
  const getEventTypeName = (type) => {
    switch (type) {
      case 'meeting':
        return 'Встреча';
      case 'task':
        return 'Задача';
      case 'reminder':
        return 'Напоминание';
      case 'measurement':
        return 'Замер';
      case 'installation':
        return 'Монтаж';
      case 'support':
        return 'Сопровождение';
      default:
        return type;
    }
  };

  // Обработка редактирования события
  const handleEditEvent = (event) => {
    setEditingEvent({
      id: event.id,
      title: event.action_title,
      type: event.action_type,
      description: event.action_description || '',
      date: moment(event.created_at).format('YYYY-MM-DD'),
      time: moment(event.created_at).format('HH:mm'),
      is_completed: event.is_completed || false,
    });
    setEditEventDialogOpen(true);
  };

  // Обработка переключения статуса события
  const handleToggleStatus = (eventId) => {
    toggleStatusMutation.mutate(eventId);
  };

  // Обработка удаления события
  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  // Обработка сохранения редактирования
  const handleSaveEdit = () => {
    if (!editingEvent.title || !editingEvent.date) {
      toast.error('Заполните название события и дату');
      return;
    }

    updateEventMutation.mutate(editingEvent);
  };

  // Получение заголовка для отображения
  const getDisplayTitle = () => {
    switch (viewMode) {
      case 'month':
        return currentDate.format('MMMM YYYY');
      case 'week':
        const startOfWeek = currentDate.clone().startOf('week');
        const endOfWeek = currentDate.clone().endOf('week');
        return `${startOfWeek.format('DD.MM')} - ${endOfWeek.format('DD.MM.YYYY')}`;
      case 'day':
        return currentDate.format('dddd, DD MMMM YYYY');
      default:
        return currentDate.format('MMMM YYYY');
    }
  };

  // Русские названия дней недели
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Текущее время для выделения
  const now = moment();
  const currentHour = now.hour();
  const currentMinute = now.minute();

  // Функция для получения позиции линии времени (каждые 10 минут)
  const getTimeLinePosition = () => {
    const minutePosition = Math.floor(currentMinute / 10) * 10; // Округляем до ближайших 10 минут
    return (minutePosition / 60) * 100; // Конвертируем в проценты
  };

  // Проверка, является ли дата/время прошедшим
  const isPastDateTime = (date, time = null) => {
    const now = moment();
    const checkDateTime = time 
      ? moment(date).hour(parseInt(time.split(':')[0])).minute(parseInt(time.split(':')[1]))
      : moment(date).endOf('day');
    
    return checkDateTime.isBefore(now);
  };

  // Проверка, является ли дата прошедшей (для месячного режима)
  const isPastDate = (date) => {
    return moment(date).endOf('day').isBefore(moment());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Загрузка календаря...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 'fit-content' }}>
      <CardContent>
        {/* Заголовок календаря */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Календарь событий
            </Typography>
            
            {/* Подсказка */}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Кликните по временному слоту для создания события или заявки
            </Typography>
            
            {/* Переключатели вида */}
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={viewMode === 'month' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('month')}
              >
                Месяц
              </Button>
              <Button
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('week')}
              >
                Неделя
              </Button>
              <Button
                variant={viewMode === 'day' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('day')}
              >
                День
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        {/* Навигация */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={goToPrevious} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6">
              {getDisplayTitle()}
            </Typography>
            <IconButton onClick={goToNext} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={goToToday}>
              Сегодня
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDate(currentDate);
                setNewEvent({
                  ...newEvent,
                  date: currentDate.format('YYYY-MM-DD'),
                  time: '09:00',
                  itemType: 'event'
                });
                setAddEventDialogOpen(true);
              }}
            >
              Добавить элемент
            </Button>
          </Box>
        </Box>

        {/* Календарь */}
        <Box sx={{ 
          height: viewMode === 'month' ? 380 : 500,
          overflowY: viewMode === 'week' || viewMode === 'day' ? 'auto' : 'visible',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
        }}>
          
          {/* Месячный вид */}
          {viewMode === 'month' && (
            <Box>
              {/* Заголовки дней недели */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                {weekDays.map((day, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      borderRight: index < 6 ? '1px solid #e0e0e0' : 'none',
                    }}
                  >
                    {day}
                  </Box>
                ))}
              </Box>

              {/* Дни месяца */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)',
                gridTemplateRows: 'repeat(6, 1fr)',
                height: 'calc(100% - 40px)',
              }}>
                {getMonthDays().map((day, index) => {
                  const isPast = isPastDate(day.date);
                  
                  return (
                    <Box
                      key={index}
                      onClick={() => {
                        if (!isPast && day.isCurrentMonth) {
                          handleDayClick(day.date);
                        }
                      }}
                      sx={{
                        p: 1,
                        borderRight: (index + 1) % 7 !== 0 ? '1px solid #e0e0e0' : 'none',
                        borderBottom: '1px solid #e0e0e0',
                        cursor: (isPast || !day.isCurrentMonth) ? 'not-allowed' : 'pointer',
                        backgroundColor: isPast ? '#f5f5f5' : 
                                       (day.isToday ? '#e3f2fd' : 
                                       !day.isCurrentMonth ? '#fafafa' : 'white'),
                        opacity: isPast ? 0.6 : 1,
                        '&:hover': {
                          backgroundColor: isPast ? '#f5f5f5' : '#f5f5f5',
                        },
                        position: 'relative',
                        minHeight: '60px',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: day.isToday ? 'bold' : 'normal',
                          color: isPast ? '#999' : 
                                 (day.isToday ? '#1976d2' : 
                                 !day.isCurrentMonth ? '#ccc' : 'inherit'),
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                        }}
                      >
                        {day.date.format('D')}
                      </Typography>
                      
                      {/* События дня */}
                      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {day.events.slice(0, 2).map((event, eventIndex) => (
                          <Chip
                            key={eventIndex}
                            label={event.action_title}
                            size="small"
                            color={getEventColor(event.action_type)}
                            sx={{ 
                              fontSize: '0.7rem',
                              height: '16px',
                              '& .MuiChip-label': { px: 1 },
                              opacity: isPast ? 0.7 : 1,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isPast) {
                                handleEditEvent(event);
                              }
                            }}
                          />
                        ))}
                        {day.events.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{day.events.length - 2} ещё
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Недельный вид */}
          {viewMode === 'week' && (
            <Box>
              {/* Заголовки дней недели */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '60px repeat(7, 1fr)',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                <Box sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}></Box>
                {getWeekDays().map((day, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      borderRight: index < 6 ? '1px solid #e0e0e0' : 'none',
                      backgroundColor: day.isToday ? '#e3f2fd' : 'inherit',
                    }}
                  >
                    <Typography variant="caption" display="block">
                      {day.date.format('ddd')}
                    </Typography>
                    <Typography variant="h6">
                      {day.date.format('D')}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Временные слоты */}
              <Box sx={{ maxHeight: '500px', overflowY: 'auto', position: 'relative' }} className="time-slots-container">
                {getTimeSlots().map((slot, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '60px repeat(7, 1fr)',
                      minHeight: '60px',
                      borderBottom: '1px solid #e0e0e0',
                      backgroundColor: 'white',
                      position: 'relative',
                      '&::after': slot.time.isSame(moment(), 'day') && slot.time.hour() === currentHour ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${getTimeLinePosition()}%`,
                        height: '2px',
                        backgroundColor: '#1976d2',
                        zIndex: 2,
                      } : {},
                    }}
                    data-hour={slot.hour}
                  >
                    <Box sx={{ 
                      p: 1, 
                      borderRight: '1px solid #e0e0e0',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: '#666',
                    }}>
                      {slot.time.format('HH:mm')}
                    </Box>
                    {getWeekDays().map((day, dayIndex) => {
                      const timeString = `${slot.hour.toString().padStart(2, '0')}:00`;
                      const isPast = isPastDateTime(day.date, timeString);
                      
                      return (
                        <Box
                          key={dayIndex}
                          sx={{
                            p: 1,
                            borderRight: dayIndex < 6 ? '1px solid #e0e0e0' : 'none',
                            position: 'relative',
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            backgroundColor: isPast ? '#f5f5f5' : 'white',
                            opacity: isPast ? 0.6 : 1,
                            '&:hover': {
                              backgroundColor: isPast ? '#f5f5f5' : '#f5f5f5',
                            },
                          }}
                          onClick={() => {
                            if (!isPast) {
                              handleWeekSlotClick(day.date, slot.hour);
                            }
                          }}
                        >
                          {slot.events.filter(event => 
                            moment(event.created_at).isSame(day.date, 'day') &&
                            moment(event.created_at).hour() === slot.hour
                          ).map((event, eventIndex) => (
                            <Chip
                              key={eventIndex}
                              label={event.action_title}
                              size="small"
                              color={getEventColor(event.action_type)}
                              sx={{ 
                                fontSize: '0.7rem',
                                height: '16px',
                                '& .MuiChip-label': { px: 1 },
                                opacity: isPast ? 0.7 : 1,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPast) {
                                  handleEditEvent(event);
                                }
                              }}
                            />
                          ))}
                          {slot.events.filter(event => 
                            moment(event.created_at).isSame(day.date, 'day') &&
                            moment(event.created_at).hour() === slot.hour
                          ).length === 0 && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '20px',
                                color: isPast ? '#999' : '#ccc',
                                fontSize: '12px',
                              }}
                            >
                              +
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Дневной вид */}
          {viewMode === 'day' && (
            <Box>
              {/* Заголовок дня */}
              <Box sx={{ 
                p: 2,
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                <Typography variant="h6" textAlign="center">
                  {currentDate.format('dddd, DD MMMM YYYY')}
                </Typography>
              </Box>

                             {/* Временные слоты */}
               <Box sx={{ maxHeight: '500px', overflowY: 'auto', position: 'relative' }} className="time-slots-container">
                {getTimeSlots().map((slot, index) => (
                  <Box
                    key={index}
                                         sx={{
                       display: 'flex',
                       minHeight: '60px',
                       borderBottom: '1px solid #e0e0e0',
                       backgroundColor: 'white',
                       position: 'relative',
                       '&::after': slot.time.isSame(moment(), 'day') && slot.time.hour() === currentHour ? {
                         content: '""',
                         position: 'absolute',
                         left: 0,
                         right: 0,
                         top: `${getTimeLinePosition()}%`,
                         height: '2px',
                         backgroundColor: '#1976d2',
                         zIndex: 2,
                       } : {},
                     }}
                     data-hour={slot.hour}
                  >
                    <Box sx={{ 
                      p: 1, 
                      width: '80px',
                      borderRight: '1px solid #e0e0e0',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: '#666',
                    }}>
                      {slot.time.format('HH:mm')}
                    </Box>
                                                             <Box 
                      sx={{ 
                        p: 1, 
                        flex: 1,
                        cursor: isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`) ? 'not-allowed' : 'pointer',
                        backgroundColor: isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`) ? '#f5f5f5' : 'white',
                        opacity: isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`) ? 0.6 : 1,
                        '&:hover': {
                          backgroundColor: isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`) ? '#f5f5f5' : '#f5f5f5',
                        },
                      }}
                      onClick={() => {
                        if (!isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`)) {
                          handleDaySlotClick(slot.hour);
                        }
                      }}
                    >
                      {slot.events.map((event, eventIndex) => (
                        <Chip
                          key={eventIndex}
                          label={event.action_title}
                          size="small"
                          color={getEventColor(event.action_type)}
                          sx={{ 
                            fontSize: '0.8rem',
                            mr: 1,
                            mb: 1,
                            opacity: isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`) ? 0.7 : 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`)) {
                              handleEditEvent(event);
                            }
                          }}
                        />
                      ))}
                      {slot.events.length === 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '40px',
                            color: isPastDateTime(currentDate, `${slot.hour.toString().padStart(2, '0')}:00`) ? '#999' : '#ccc',
                            fontSize: '14px',
                          }}
                        >
                          +
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Диалог просмотра событий дня */}
      <Dialog 
        open={viewEventsDialogOpen} 
        onClose={() => setViewEventsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          События на {selectedDate?.format('dddd, DD MMMM YYYY')}
        </DialogTitle>
        <DialogContent>
          <List sx={{ p: 0 }}>
            {selectedDateEvents.map((event, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {getEventIcon(event.action_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          sx={{ 
                            textDecoration: event.is_completed ? 'line-through' : 'none',
                            color: event.is_completed ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {event.action_title}
                        </Typography>
                        {event.is_completed && (
                          <CheckCircle color="success" fontSize="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {moment(event.created_at).format('HH:mm')} • {getEventTypeName(event.action_type)}
                        </Typography>
                        {event.action_description && (
                          <Typography variant="caption" color="text.secondary">
                            {event.action_description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (!isPastDateTime(event.date, event.time)) {
                          handleToggleStatus(event.id);
                        }
                      }}
                      color={event.is_completed ? "success" : "default"}
                      disabled={isPastDateTime(event.date, event.time)}
                      title={isPastDateTime(event.date, event.time) ? "Нельзя изменить статус события в прошлом" : "Изменить статус"}
                    >
                      {event.is_completed ? <CheckCircle /> : <RadioButtonUnchecked />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (!isPastDateTime(event.date, event.time)) {
                          handleEditEvent(event);
                        }
                      }}
                      color="primary"
                      disabled={isPastDateTime(event.date, event.time)}
                      title={isPastDateTime(event.date, event.time) ? "Нельзя редактировать событие в прошлом" : "Редактировать событие"}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (!isPastDateTime(event.date, event.time)) {
                          handleDeleteEvent(event.id);
                        }
                      }}
                      color="error"
                      disabled={isPastDateTime(event.date, event.time)}
                      title={isPastDateTime(event.date, event.time) ? "Нельзя удалить событие в прошлом" : "Удалить событие"}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < selectedDateEvents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setViewEventsDialogOpen(false);
              setNewEvent({
                ...newEvent,
                date: selectedDate?.format('YYYY-MM-DD'),
                time: '09:00',
                itemType: 'event'
              });
              setAddEventDialogOpen(true);
            }}
            startIcon={<AddIcon />}
          >
            Добавить элемент
          </Button>
          <Button onClick={() => setViewEventsDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог добавления события/заявки */}
      <Dialog open={addEventDialogOpen} onClose={() => setAddEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить элемент</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Выбор типа элемента */}
            <FormControl fullWidth>
              <InputLabel>Тип элемента</InputLabel>
              <Select
                value={newEvent.itemType}
                onChange={(e) => setNewEvent({ ...newEvent, itemType: e.target.value })}
                label="Тип элемента"
              >
                <MenuItem value="event">Событие</MenuItem>
                <MenuItem value="measurement">Заявка на замер</MenuItem>
                <MenuItem value="installation">Заявка на монтаж</MenuItem>
              </Select>
            </FormControl>

            {/* Поля для событий */}
            {newEvent.itemType === 'event' && (
              <>
                <TextField
                  label="Название события"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  fullWidth
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Тип события</InputLabel>
                  <Select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    label="Тип события"
                  >
                    <MenuItem value="meeting">Встреча</MenuItem>
                    <MenuItem value="task">Задача</MenuItem>
                    <MenuItem value="reminder">Напоминание</MenuItem>
                    <MenuItem value="measurement">Замер</MenuItem>
                    <MenuItem value="installation">Монтаж</MenuItem>
                    <MenuItem value="support">Сопровождение</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Описание"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </>
            )}

            {/* Поля для заявок */}
            {(newEvent.itemType === 'measurement' || newEvent.itemType === 'installation') && (
              <>
                <TextField
                  label="Имя клиента"
                  value={newEvent.client_name}
                  onChange={(e) => setNewEvent({ ...newEvent, client_name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Телефон клиента"
                  value={newEvent.client_phone}
                  onChange={(e) => setNewEvent({ ...newEvent, client_phone: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Улица"
                  value={newEvent.street}
                  onChange={(e) => setNewEvent({ ...newEvent, street: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Дом"
                  value={newEvent.house}
                  onChange={(e) => setNewEvent({ ...newEvent, house: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Квартира/Офис"
                  value={newEvent.apartment}
                  onChange={(e) => setNewEvent({ ...newEvent, apartment: e.target.value })}
                  fullWidth
                  placeholder="Необязательно"
                />
              </>
            )}

            {/* Общие поля */}
            <TextField
              label="Дата"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            {newEvent.itemType === 'event' && (
              <TextField
                label="Время"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEventDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleAddEvent} 
            variant="contained"
            disabled={addEventMutation.isLoading || addMeasurementRequestMutation.isLoading || addInstallationRequestMutation.isLoading}
          >
            {addEventMutation.isLoading || addMeasurementRequestMutation.isLoading || addInstallationRequestMutation.isLoading 
              ? 'Добавление...' 
              : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования события */}
      <Dialog open={editEventDialogOpen} onClose={() => setEditEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Редактировать событие
          {editingEvent && isPastDateTime(editingEvent.date, editingEvent.time) && (
            <Typography variant="caption" display="block" color="error" sx={{ mt: 1 }}>
              ⚠️ Это событие в прошлом. Редактирование заблокировано.
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Название события"
              value={editingEvent?.title || ''}
              onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
              fullWidth
              required
              disabled={editingEvent && isPastDateTime(editingEvent.date, editingEvent.time)}
            />
            <FormControl fullWidth>
              <InputLabel>Тип события</InputLabel>
              <Select
                value={editingEvent?.type || 'meeting'}
                onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                label="Тип события"
                disabled={editingEvent && isPastDateTime(editingEvent.date, editingEvent.time)}
              >
                <MenuItem value="meeting">Встреча</MenuItem>
                <MenuItem value="task">Задача</MenuItem>
                <MenuItem value="reminder">Напоминание</MenuItem>
                <MenuItem value="measurement">Замер</MenuItem>
                <MenuItem value="installation">Монтаж</MenuItem>
                <MenuItem value="support">Сопровождение</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Дата"
              type="date"
              value={editingEvent?.date || ''}
              onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              disabled={editingEvent && isPastDateTime(editingEvent.date, editingEvent.time)}
            />
            <TextField
              label="Время"
              type="time"
              value={editingEvent?.time || '09:00'}
              onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              disabled={editingEvent && isPastDateTime(editingEvent.date, editingEvent.time)}
            />
            <TextField
              label="Описание"
              value={editingEvent?.description || ''}
              onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              disabled={editingEvent && isPastDateTime(editingEvent.date, editingEvent.time)}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editingEvent?.is_completed || false}
                  onChange={(e) => setEditingEvent({ ...editingEvent, is_completed: e.target.checked })}
                  disabled={editingEvent && isPastDateTime(editingEvent.date, editingEvent.time)}
                />
              }
              label="Выполнено"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEventDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={updateEventMutation.isLoading || (editingEvent && isPastDateTime(editingEvent.date, editingEvent.time))}
          >
            {updateEventMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default Calendar;
export { CalendarComponent }; 