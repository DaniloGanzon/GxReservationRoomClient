import { Component, OnInit } from '@angular/core';
import { BaseCalendarComponent } from '../shared/base-calendar/base-calendar.component';
import { Reservation } from '../../../model/Reservation';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  imports: [
    BaseCalendarComponent,
    MatIconModule,
    MatTooltipModule
  ],
  selector: 'app-admin-calendar',
  templateUrl: './admin-calendar.component.html'
})

export class AdminCalendarComponent extends BaseCalendarComponent implements OnInit{
  allReservations: Reservation[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
      next: reservations => {
        this.allReservations = reservations; // Store all reservations
        this.reservations = this.filterReservations(reservations); // Filtered by room
        this.updateDashboardStats();
      },
      error: err => console.error('Failed to load:', err)
    });
  }



  override updateDashboardStats(): void {
    super.updateDashboardStats(); // Base stats (uses filtered reservations)
    // Override with all reservations data
    this.dashboardStats.totalReservations = this.allReservations.length;
    this.dashboardStats.pendingApprovals = this.allReservations.filter(r => r.status === 'Pending').length;
    this.dashboardStats.timeConflicts = this.calculateTimeConflicts();
    // Remove upcoming stat
    this.dashboardStats.upcomingReservations = 0;
  }


  private calculateTimeConflicts(): number {
    const approvedReservations = this.allReservations.filter(r => r.status === 'Approved');
    const reservationsByRoom = this.groupReservationsByRoom(approvedReservations);
    let conflicts = 0;
    
    Object.values(reservationsByRoom).forEach(roomReservations => {
      const dateMap = this.groupByDate(roomReservations);
      Object.values(dateMap).forEach(reservations => {
        conflicts += this.checkConflictsForDate(reservations);
      });
    });
    
    return conflicts;
  }


  private groupReservationsByRoom(reservations: Reservation[]): { [key: number]: Reservation[] } {
    return reservations.reduce((acc, reservation) => {
      const roomId = reservation.room?.id;
      if (roomId) {
        acc[roomId] = acc[roomId] || [];
        acc[roomId].push(reservation);
      }
      return acc;
    }, {} as { [key: number]: Reservation[] });
  }


  private groupByDate(reservations: Reservation[]): { [key: string]: Reservation[] } {
    return reservations.reduce((acc, reservation) => {
      const dateKey = reservation.startDate.split('T')[0];
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(reservation);
      return acc;
    }, {} as { [key: string]: Reservation[] });
  }

  private checkConflictsForDate(reservations: Reservation[]): number {
    let conflictCount = 0;
    const sorted = [...reservations].sort((a, b) => 
      a.timeStart.localeCompare(b.timeStart)
    );

    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = this.getEndTime(sorted[i-1]);
      const currentStart = sorted[i].timeStart;
      if (currentStart < prevEnd) {
        conflictCount++;
      }
    }
    
    return conflictCount;
  }

  private getEndTime(reservation: Reservation): string {
    const [startHours, startMinutes] = reservation.timeStart.split(':').map(Number);
    const durationHours = parseInt(reservation.timeDuration.split(':')[0], 10);
    const endHours = startHours + durationHours;
    return `${endHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
  }
}