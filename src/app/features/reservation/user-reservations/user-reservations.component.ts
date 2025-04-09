import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../../services/feature/reservation.service';
import { Reservation } from '../../../model/Reservation';
import { DateTimeService } from '../../../services/feature/datetime.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-reservations',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './user-reservations.component.html',
  styleUrls: ['./user-reservations.component.css']
})
export class UserReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  approvedCount = 0;
  pendingCount = 0;
  rejectedCount = 0;
  isLoading = true;
  error: string | null = null;

  constructor(
    private reservationService: ReservationService,
    public datetimeService: DateTimeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  private loadReservations(): void {
    this.isLoading = true;
    this.error = null;
    
    this.reservationService.getReservationsForUser().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.updateCounts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reservations:', err);
        this.error = 'Failed to load reservations. Please try again later.';
        this.isLoading = false;
        
        // Redirect to login if unauthorized
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth']);
        }
      }
    });
  }

  private updateCounts(): void {
    this.pendingCount = this.reservations.filter(r => r.status === 'PENDING').length;
    this.approvedCount = this.reservations.filter(r => r.status === 'APPROVED').length;
    this.rejectedCount = this.reservations.filter(r => r.status === 'REJECTED').length;
  }

  getSafeRoomName(res: Reservation): string {
    return res.room?.name || 'Unknown Room';
  }

  refreshReservations(): void {
    this.loadReservations();
  }
}