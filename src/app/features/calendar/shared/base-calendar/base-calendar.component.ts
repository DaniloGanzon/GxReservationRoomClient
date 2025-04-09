// base-calendar.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { RoomService } from '../../../../services/feature/room.service';
import { DateTimeService } from '../../../../services/feature/datetime.service';
import { Room } from '../../../../model/Room';
import { Reservation } from '../../../../model/Reservation';
import { ReservationService } from '../../../../services/feature/reservation.service';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';
import { ReservationListComponent } from '../reservation-list/reservation-list.component';
import { CustomCalendarComponent } from '../custom-calendar/custom-calendar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-base-calendar',
  imports:[
    ReservationFormComponent,
    ReservationListComponent,
    CustomCalendarComponent,  
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './base-calendar.component.html',
  styleUrls: ['./base-calendar.component.css']
})

export class BaseCalendarComponent implements OnInit {
  @Input() isAdmin: boolean = false;
  selectedDate: Date = new Date();
  selectedRoom: Room | 'all' = 'all';
  approvedReservations: Reservation[] = [];
  rooms: Room[] = [];
  reservations: Reservation[] = [];
  currentView: 'list' | 'form' = 'list';
  showFormPopup: boolean = false;
  protected dashboardStats = {
    totalReservations: 0,
    pendingApprovals: 0,
    upcomingReservations: 0,
    totalRooms: 0,
    timeConflicts: 0
  };

  constructor(
    protected reservationService: ReservationService,
    private roomService: RoomService,
    public dateTimeService: DateTimeService,
    private toastr: ToastrService 
  ) {}

  ngOnInit(): void {
    this.loadRooms();
    this.selectedRoom = 'all'; 
    this.loadReservations();
  }

  private loadRooms(): void {
    this.roomService.getAllRooms().subscribe(rooms => {
      this.rooms = rooms;
      this.selectedRoom = 'all';
      if (this.isAdmin) {
        this.updateDashboardStats();  // Add this line
      }

      this.onRoomChange();
    });
  }

  protected loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
      next: reservations => {
        // Store approved reservations separately for conflict checking
        this.approvedReservations = this.filterApprovedReservations(reservations);
        
        // Maintain existing filtered reservations (includes pending for admin)
        this.reservations = this.filterReservations(reservations);
        
        if (this.isAdmin) this.updateDashboardStats();
      },
      error: err => console.error('Failed to load:', err)
    });
  }

  protected filterReservations(reservations: Reservation[]): Reservation[] {
    let filtered = this.selectedRoom === 'all' 
      ? reservations 
      : reservations.filter(res => res.room?.id === (this.selectedRoom as Room).id);
  
    // Add approval filter for non-admin users
    if (!this.isAdmin) {
      filtered = filtered.filter(res => res.status === 'Approved');
    }
  
    return filtered;
  }

  private filterApprovedReservations(reservations: Reservation[]): Reservation[] {
    // Always filter to approved status, but maintain room filtering
    const statusFiltered = reservations.filter(r => r.status === 'Approved');
    return this.selectedRoom === 'all' 
      ? statusFiltered 
      : statusFiltered.filter(res => res.room?.id === (this.selectedRoom as Room).id);
  }

  private checkForTimeConflicts(formData: any): Reservation[] {
    if (!formData?.roomId || !formData.startDate || !formData.endDate || !formData.timeStart) {
      console.error('Incomplete form data for conflict check');
      return [];
    }
    const newStartDate = new Date(formData.startDate);
    const newEndDate = new Date(formData.endDate);
    newStartDate.setHours(0, 0, 0, 0);
    newEndDate.setHours(0, 0, 0, 0);
    const newTimeStart = formData.timeStart.includes(':') 
      ? formData.timeStart.padEnd(8, ':00').slice(0, 8) 
      : '00:00:00';
    const [startH, startM] = newTimeStart.split(':').map(Number);
    const [durationH] = (formData.timeDuration || '01:00:00').split(':').map(Number);
    const newEndTime = `${String(startH + durationH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`;
  
    return this.approvedReservations.filter(existing => {
      if (!existing.room || existing.room.id !== formData.roomId) return false;
  
      try {
        const existingStart = new Date(existing.startDate);
        const existingEnd = new Date(existing.endDate);
        existingStart.setHours(0, 0, 0, 0);
        existingEnd.setHours(0, 0, 0, 0);
  
        if (newEndDate < existingStart || newStartDate > existingEnd) {
          return false;
        }
      } catch (e) {
        console.error('Invalid existing reservation dates', existing);
        return false;
      }
      try {
        const existingEndTime = this.getReservationEndTime(existing);
        return newTimeStart < existingEndTime && 
               newEndTime > existing.timeStart;
      } catch (e) {
        console.error('Invalid existing reservation times', existing);
        return false;
      }
    });
  }

  private getReservationEndTime(res: Reservation): string {
    if (!res || !res.timeStart || !res.timeDuration) return '';
  
    try {
      const startParts = res.timeStart.split(':');
      const durParts = res.timeDuration.split(':');
      
      const startH = parseInt(startParts[0]) || 0;
      const startM = parseInt(startParts[1]) || 0;
      const durH = parseInt(durParts[0]) || 0;
      const durM = parseInt(durParts[1]) || 0;
  
      let endH = startH + durH;
      let endM = startM + durM;
      
      // Handle minute overflow
      if (endM >= 60) {
        endH += Math.floor(endM / 60);
        endM = endM % 60;
      }
  
      return this.dateTimeService.formatDisplayTime(
        `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
      );
    } catch (e) {
      console.error('Error calculating end time:', e);
      return '';
    }
  }

  onRoomChange(): void {
    this.reservations = [];
    this.approvedReservations = []; 
    this.loadReservations();
  }

  onDateSelect(selectedDate: Date): void {
    const normalizedDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    this.selectedDate = normalizedDate;
    this.currentView = 'list';
  }

  showReservationForm(): void {
    if (this.selectedRoom === 'all') {
      this.toastr.warning('Please select a room first', 'Room Selection Required');
      return;
    }
    this.showFormPopup = true;
  }


  handleReservationSubmit(formData: any): void {
    // 1. Validate dates first
    if (!this.validateReservationDates(formData)) {
      this.toastr.warning('Invalid date selection', 'Validation Error');
      return;
    }
  
    // 2. Prepare payload with proper timeDuration format
    const payload = {
      ...formData,
      timeDuration: `${String(formData.durationHours).padStart(2, '0')}:00:00`
    };
  
    // 3. Check for time conflicts with properly formatted data
    const conflicts = this.checkForTimeConflicts({
      ...payload,
      roomId: this.selectedRoom === 'all' ? null : (this.selectedRoom as Room).id
    });
  
    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(c => 
        `• ${c.name} (${this.dateTimeService.formatDisplayTime(c.timeStart)} - ${this.getReservationEndTime(c)}`
      ).join('<br>');
      
      this.toastr.error(
        `Time conflict with:<br>${conflictMessages}`, 
        'Reservation Conflict',
        { enableHtml: true, timeOut: 10000 }
      );
      return;
    }
  
    // 4. Submit to backend
    this.reservationService.createReservation(payload).subscribe({
      next: () => {
        this.toastr.success('Reservation created!', 'Success');
        this.loadReservations();
        this.showFormPopup = false;
      },
      error: (err) => {
        this.toastr.error(
          err.error?.message || 'Failed to create reservation',
          'Error'
        );
      }
    });
  }

  private validateReservationDates(formData: any): boolean {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    
    return start <= end && end >= now;
  }
  
  protected updateDashboardStats(): void {
    this.dashboardStats = {
      totalRooms: this.rooms.length, 
      totalReservations: this.reservations.length,
      pendingApprovals: this.reservations.filter(r => r.status === 'Pending').length,
      upcomingReservations: this.reservations.filter(r => 
        new Date(r.startDate) > new Date()
      ).length,
      timeConflicts: this.dashboardStats.timeConflicts 
    };
  }

  getRoomDetails(): string {
    if (this.selectedRoom === 'all') {
      return `Showing all ${this.rooms.length} rooms`;
    }
    return `
      ${this.selectedRoom.name} - 
      Building: ${this.selectedRoom.building}, 
      Status: ${this.selectedRoom.status}
    `;
  }

  handleReservationApprove(reservationId: number): void {
    this.reservationService.acceptReservation(reservationId).subscribe({
      next: () => this.loadReservations(),
      error: (err) => console.error('Approval failed:', err)
    });
  }

  getSelectedRoomForForm(): Room {
    if (this.selectedRoom === 'all') {
      throw new Error('No room selected');
    }
    return this.selectedRoom;
  }
  
}
