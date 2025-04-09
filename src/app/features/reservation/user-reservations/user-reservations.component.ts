// user-reservations.component.ts
import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../../services/feature/reservation.service';
import { Reservation } from '../../../model/Reservation';
import { DateTimeService } from '../../../services/feature/datetime.service';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-reservations',
  imports: [CommonModule, MatIconModule],
  templateUrl: './user-reservations.component.html',
  styleUrls: ['./user-reservations.component.css']
})
export class UserReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  approvedCount = 0;
  pendingCount = 0;
  rejectedCount = 0;

  constructor(
    private reservationService: ReservationService,
    public datetimeService: DateTimeService
  ) {}

  ngOnInit(): void {
    this.reservationService.getReservationsForUser().subscribe(reservations => {
      this.reservations = reservations;
      this.updateCounts();
    });
  }

  private updateCounts(): void {
    this.pendingCount = this.reservations.filter(r => r.status === 'Pending').length;
    this.approvedCount = this.reservations.filter(r => r.status === 'Approved').length;
    this.rejectedCount = this.reservations.filter(r => r.status === 'Rejected').length;
  }

  getSafeRoomName(res: Reservation): string {
    return res.room?.name || 'Unknown Room';
  }
}