// Утилиты для работы с временными зонами
export const ALMATY_TIMEZONE = 'Asia/Almaty';

export class TimezoneUtils {
  /**
   * Форматирует дату для временной зоны Алматы
   */
  static formatDateForAlmaty(date: Date): string {
    return date ? new Date(date).toLocaleDateString('ru-RU', {
      timeZone: ALMATY_TIMEZONE
    }) : '—';
  }

  /**
   * Форматирует дату и время для временной зоны Алматы
   */
  static formatDateTimeForAlmaty(date: Date): string {
    if (!date) return '—';
    
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ru-RU', {
      timeZone: ALMATY_TIMEZONE
    });
    const timeStr = d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: ALMATY_TIMEZONE
    });
    
    return `${dateStr} в ${timeStr}`;
  }

  /**
   * Возвращает текущую дату в временной зоне Алматы
   */
  static getCurrentDateTimeForAlmaty(): string {
    return new Date().toLocaleString('ru-RU', { 
      timeZone: ALMATY_TIMEZONE 
    });
  }

  /**
   * Преобразует дату в временную зону Алматы
   */
  static convertToAlmatyTimezone(date: Date): Date {
    return new Date(date.toLocaleString("en-US", { timeZone: ALMATY_TIMEZONE }));
  }
}