import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Reservation } from '../../../../model/Reservation';
import { DateTimeService } from '../../../../services/feature/datetime.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-reservation-list',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent {
  @Input() reservations: Reservation[] = [];
  @Input() isAdmin = false;
  @Input() selectedDate!: Date;

  constructor(public dateTimeService: DateTimeService) {}

  // Convert Date to ISO string for service methods
  getSelectedDateString(): string {
    return this.selectedDate.toISOString().split('T')[0];
  }

  getDateReservations(): Reservation[] {
    return this.reservations.filter(res => {
      if (!res.startDate || !res.endDate) return false;
      
      // Convert all dates to local timezone-neutral dates
      const selected = this.stripTime(this.selectedDate);
      const start = this.stripTime(new Date(res.startDate));
      const end = this.stripTime(new Date(res.endDate));
  
      return selected >= start && selected <= end;
    });
  }
  
  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  

  // Format the selected date for display
  getFormattedSelectedDate(): string {
    return this.dateTimeService.formatDisplayDate(this.getSelectedDateString());
  }

  getStatusClass(status?: string): string {
    return status ? status.toLowerCase() : 'unknown';
  }

  getSafeRoomName(res: Reservation): string {
    return res.room?.name || 'Unknown Room';
  }

  getSafeStatus(res: Reservation): string {
    return res.status || 'UNKNOWN';
  }

  getSafeTimeRange(res: Reservation): string {
    if (!res.timeStart || !res.timeDuration) return 'Time not specified';
    return this.dateTimeService.formatTimeRange(res.timeStart, res.timeDuration);
  }

  getSafeRoomId(res: Reservation): number | null {
    return res.room?.id || null;
  }

  private findPendingReservationsForSameRoom(res: Reservation): Reservation[] {
    return this.reservations.filter(other => {
      return other.id !== res.id &&
             other.room?.id === res.room?.id &&
             other.status === 'PENDING';
    });
  }
  
  
}