import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Reservation } from '../../../../model/Reservation';
import { DateTimeService } from '../../../../services/feature/datetime.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-custom-calendar',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './custom-calendar.component.html',
  styleUrls: ['./custom-calendar.component.css']
})
export class CustomCalendarComponent {
  @Input() reservations: Reservation[] = [];
  @Input() selectedDate: Date = new Date();
  @Output() dateSelect = new EventEmitter<Date>();

  currentDate: Date = new Date();
  weeks: Date[][] = [];

  constructor(public dateTimeService: DateTimeService) {
    this.generateCalendar();
  }

  private generateCalendar(): void {
    const firstDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    );
    
    const lastDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      0
    );

    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    // Add previous month's days
    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i - 1);
      week.push(date);
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        i
      );
      
      week.push(date);
      
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Add next month's days
    if (week.length > 0) {
      while (week.length < 7) {
        const date = new Date(week[week.length - 1]);
        date.setDate(date.getDate() + 1);
        week.push(date);
      }
      weeks.push(week);
    }

    this.weeks = weeks;
  }

  hasReservation(date: Date): boolean {
    return this.reservations.some(res => {
      const startDate = new Date(res.startDate);
      const endDate = new Date(res.endDate);
      return this.dateTimeService.isSameDate(date, startDate) || 
             this.dateTimeService.isDateInRange(date, startDate, endDate);
    });
  }

  isSelected(date: Date): boolean {
    return this.dateTimeService.isSameDate(date, this.selectedDate);
  }

  onDateClick(date: Date): void {
    this.dateSelect.emit(date);
  }

  prevMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  getMonthYear(): string {
    return this.currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }
}