import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateTimeService {

  constructor() { }
  
  formatDisplayDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Invalid date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? 'Invalid date' 
      : date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
  }

  formatDisplayTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  }

  formatTimeRange(startTime: string, duration: string): string {
    if (!startTime || !duration) return '';
    const start = this.formatDisplayTime(startTime);
    const end = this.calculateEndTime(startTime, duration);
    return `${start} - ${end}`;
  }

  formatDateRange(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return '';
    const start = this.formatDisplayDate(startDate);
    const end = this.formatDisplayDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  }

  formatDuration(duration: string): string {
    if (!duration) return '';
    const [hours] = duration.split(':').map(Number);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  convertToBackendDate(date: Date | string): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    // Ensure valid date
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  

  convertToBackendTime(time: string): string {
    if (!time) return '';
    if (time.includes('am') || time.includes('pm')) {
      const [timePart, modifier] = time.split(/(am|pm)/i);
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (modifier?.toLowerCase() === 'pm' && hours !== 12) hours += 12;
      if (modifier?.toLowerCase() === 'am' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
    return time.length === 5 ? `${time}:00` : time;
  }
  
  convertDatePickerToDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    return dateInput instanceof Date ? dateInput : new Date(dateInput);
  }

  convertTimePickerToBackend(timeInput: string): string {
    if (!timeInput) return '00:00:00';
    return this.convertToBackendTime(timeInput);
  }

  convertDurationToBackend(hours: number): string {
    return `${hours.toString().padStart(2, '0')}:00:00`;
  }

  public calculateEndTime(startTime: string, duration: string): string {
    const [startHours] = startTime.split(':').map(Number);
    const [durationHours] = duration.split(':').map(Number);
    const endHours = startHours + durationHours;
    return this.formatDisplayTime(`${endHours.toString().padStart(2, '0')}:00`);
  }

  isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  isSameDate(date1: Date | string, date2: Date | string): boolean {
    const d1 = this.normalizeDate(date1);
    const d2 = this.normalizeDate(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  isDateInRange(testDate: Date | string, startDate: Date | string, endDate: Date | string): boolean {
    const dTest = this.stripTime(testDate);
    const dStart = this.stripTime(startDate);
    const dEnd = this.stripTime(endDate);
  
    return dTest >= dStart && dTest <= dEnd;
  }
  
  private stripTime(date: Date | string): Date {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

private normalizeDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

}