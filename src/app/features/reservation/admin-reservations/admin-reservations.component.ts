// admin-reservations.component.ts
import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../../services/feature/reservation.service';
import { RoomService } from '../../../services/feature/room.service';
import { Reservation } from '../../../model/Reservation';
import { Room } from '../../../model/Room';
import { DateTimeService } from '../../../services/feature/datetime.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { ToastrService } from 'ngx-toastr'; 
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-admin-reservations',
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-reservations.component.html',
  styleUrls: ['./admin-reservations.component.css']
})

export class AdminReservationsComponent implements OnInit {
  showConfirmation = false;
  selectedReservationId: number | null = null;
  currentAction: 'delete' | 'approve' | 'reject' | null = null;
  allReservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  rooms: Room[] = [];
  selectedFilter = 'all';
  selectedRoomId: number | null = null;
  approvedCount = 0;
  rejectedCount = 0;
  pendingCount = 0;
  isLoading = false;
  roomSelectionRequired = false;
  conflictDetails: string | null = null;

  constructor(
    private reservationService: ReservationService,
    private roomService: RoomService,
    public datetimeService: DateTimeService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  private loadReservations(): void {
    this.isLoading = true;
    this.reservationService.getAllReservations().subscribe({
      next: (reservations) => {
        this.allReservations = reservations;
        this.updatePendingCount();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reservations:', err);
        this.isLoading = false;
        this.toastr.error('Failed to load reservations', 'Error');
      }
    });
  }

  private loadRooms(): void {
    this.roomService.getAllRooms().subscribe(rooms => {
      this.rooms = rooms;
      this.loadReservations();
    });
  }

  applyFilters(): void {
    if (this.selectedFilter === 'byRoom') {
      this.handleRoomFilter();
    } else {
      this.applyClientSideFilters();
    }
  }

  private handleRoomFilter(): void {
    if (!this.selectedRoomId) {
      this.roomSelectionRequired = true;
      this.filteredReservations = [];
      return;
    }
    
    this.roomSelectionRequired = false;
    this.isLoading = true;
    
    this.reservationService.getReservationsByRoom(this.selectedRoomId).subscribe({
      next: (reservations) => {
        this.filteredReservations = this.sortReservations(reservations);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading room reservations:', err);
        this.filteredReservations = [];
        this.isLoading = false;
      }
    });
  }

  private applyClientSideFilters(): void {
    let filtered = this.allReservations;

    switch (this.selectedFilter) {
      case 'pending':
        filtered = filtered.filter(r => r.status === 'Pending');
        break;
      case 'noRooms':
        filtered = filtered.filter(r => !r.room);
        break;
      case 'approved':
        filtered = filtered.filter(r => r.status === 'Approved');
        break;
      case 'rejected':
        filtered = filtered.filter(r => r.status === 'Rejected');
        break;
    }

    this.filteredReservations = this.sortReservations(filtered);
  }

  private sortReservations(reservations: Reservation[]): Reservation[] {
    return reservations.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  private updatePendingCount(): void {
    this.pendingCount = this.allReservations.filter(r => r.status === 'Pending').length;
    this.approvedCount = this.allReservations.filter(r => r.status === 'Approved').length;
    this.rejectedCount = this.allReservations.filter(r => r.status === 'Rejected').length;
  }

  filterByStatus(status: string): void {
    this.selectedFilter = status;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.selectedRoomId = null;
    this.roomSelectionRequired = false;
    if (this.selectedFilter !== 'byRoom') {
      this.applyFilters();
    }
  }

  confirmAction() {
    if (!this.selectedReservationId) return;
    
    switch(this.currentAction) {
      case 'delete':
        this.deleteReservation(this.selectedReservationId);
        break;
      case 'approve':
        this.approveReservation(this.selectedReservationId);
        break;
      case 'reject':
        this.ignoreReservation(this.selectedReservationId);
        break;
    }
    
    this.showConfirmation = false;
  }
  
  triggerAction(action: 'delete' | 'approve' | 'reject', id: number) {
    this.selectedReservationId = id;
    this.currentAction = action;
    this.conflictDetails = null;
  
    if (action === 'approve') {
      const conflicts = this.getConflictingReservations(id);
      if (conflicts.length > 0) {
        this.conflictDetails = conflicts.map(c => 
          `${c.name}, ${this.datetimeService.formatDateRange(c.startDate, c.endDate)}, ${this.datetimeService.formatTimeRange(c.timeStart, c.timeDuration)}, ${c.status}`
        ).join('\n');
      }
    }
  
    this.showConfirmation = true;
  }
  

  handleDialogResponse(confirmed: boolean) {
    if (confirmed && this.selectedReservationId) {
      switch(this.currentAction) {
        case 'delete':
          this.deleteReservation(this.selectedReservationId);
          break;
        case 'approve':
          this.approveReservation(this.selectedReservationId);
          break;
        case 'reject':
          this.ignoreReservation(this.selectedReservationId);
          break;
      }
    }
    this.showConfirmation = false;
    this.selectedReservationId = null;
    this.currentAction = null;
  }

  getDialogTitle(): string {
    const titles = {
      delete: 'Delete Reservation',
      approve: 'Approve Reservation',
      reject: 'Reject Reservation'
    };
    return titles[this.currentAction!] || 'Confirm Action';
  }
  
  getDialogMessage(): string {
    if (this.currentAction === 'approve' && this.conflictDetails) {
      return `Approving this reservation conflicts with the following PENDING reservations:\n${this.conflictDetails}\n\nAre you sure you want to proceed?`;
    }
    const messages = {
      delete: 'Are you sure you want to permanently delete this reservation?',
      approve: 'Are you sure you want to approve this reservation?',
      reject: 'Are you sure you want to reject this reservation?'
    };
    return messages[this.currentAction!] || 'Are you sure you want to perform this action?';
  }
  

  deleteReservation(id: number): void {
    this.reservationService.deleteReservation(id).subscribe({
      next: () => {
        this.loadReservations();
        this.toastr.success('Reservation deleted successfully!', 'Success');
      },
      error: (err) => {
        console.error('Error deleting reservation:', err);
        this.toastr.error('Failed to delete reservation', 'Error');
      }
    });
  }

  approveReservation(id: number): void {
    this.reservationService.acceptReservation(id).subscribe({
      next: () => {
        this.loadReservations();
        this.toastr.success('Reservation approved successfully!', 'Success');
      },
      error: (err) => {
        console.error('Error approving reservation:', err);
        this.toastr.error('Failed to approve reservation', 'Error');
      }
    });
  }

  ignoreReservation(id: number): void {
    this.reservationService.rejectReservation(id).subscribe({
      next: () => {
        this.loadReservations();
        this.toastr.success('Reservation rejected successfully!', 'Success');
      },
      error: (err) => {
        console.error('Error rejecting reservation:', err);
        this.toastr.error('Failed to reject reservation', 'Error');
      }
    });
  }

  getSafeRoomName(res: Reservation): string {
    return res.room?.name || 'Unknown Room';
  }

  private getConflictingReservations(reservationId: number): Reservation[] {
    const reservation = this.allReservations.find(r => r.id === reservationId);
    if (!reservation || !reservation.room) {
      return [];
    }
  
    const roomId = reservation.room.id;
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    const timeStart = reservation.timeStart;
    const timeDuration = reservation.timeDuration;
  
    const selectedStartMinutes = this.parseTime(timeStart);
    const selectedDurationMinutes = this.parseDuration(timeDuration);
    const selectedEndMinutes = selectedStartMinutes + selectedDurationMinutes;
  
    return this.allReservations.filter(other => {
      if (other.id === reservationId) return false;
      if (other.status !== 'Pending') return false;
      if (!other.room || other.room.id !== roomId) return false;
  
      const otherStartDate = new Date(other.startDate);
      const otherEndDate = new Date(other.endDate);
      const dateOverlap = (otherStartDate <= endDate) && (otherEndDate >= startDate);
      if (!dateOverlap) return false;
  
      const otherStartMinutes = this.parseTime(other.timeStart);
      const otherDurationMinutes = this.parseDuration(other.timeDuration);
      const otherEndMinutes = otherStartMinutes + otherDurationMinutes;
  
      return (selectedStartMinutes < otherEndMinutes) && (selectedEndMinutes > otherStartMinutes);
    });
  }
  
  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }
  
  private parseDuration(duration: string): number {
    const [hours] = duration.split(':').map(Number);
    return hours * 60;
  }
}
