import { Injectable } from '@angular/core';
import { Reservation } from '../../model/Reservation';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { DateTimeService } from './datetime.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly apiUrl = `${environment.apiUrl}/reservation`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private dateTimeService: DateTimeService
  ) { }

  //#region PUBLIC API METHODS
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/`,{ 
      headers: this.authService.getAuthHeaders() }
    ).pipe(
      map(reservations => this.formatReservations(reservations))
    );
  }

  getReservationsByRoom(roomId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(
      `${this.apiUrl}/room/${roomId}`, 
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map(reservations => this.formatReservations (reservations))
    );
  }

  getReservationsForUser(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(
      this.apiUrl,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map(reservations => this.formatReservations(reservations))
    );
  }

  createReservation(reservation: any): Observable<Reservation> {
    return this.http.post<Reservation>(
      this.apiUrl,
      this.prepareReservationForBackend(reservation),
      { headers: this.authService.getAuthHeaders() }
    );
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  acceptReservation(id: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${id}/approve`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  rejectReservation(id: number): Observable<void> {
    return this.http.patch<void>(
     `${this.apiUrl}/${id}/reject`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }


  //#region PRIVATE HELPERS
  private formatReservations(reservations: Reservation[]): Reservation[] {
    return reservations.map(reservation => ({
      ...reservation,
      displayDate: this.dateTimeService.formatDateRange(
        reservation.startDate,
        reservation.endDate
      ),
      displayTime: this.dateTimeService.formatTimeRange(
        reservation.timeStart,
        reservation.timeDuration
      ),
      displayDuration: this.dateTimeService.formatDuration(
        reservation.timeDuration
      )
    }));
  }
  
  private prepareReservationForBackend(reservationData: any): any {
    const formattedDuration = `${reservationData.durationHours.toString().padStart(2, '0')}:00:00`;
    
    console.log('Prepared reservation payload:', {
      ...reservationData,
      timeDuration: formattedDuration
    });

    return {
      name: reservationData.name,
      purpose: reservationData.purpose,
      roomId: reservationData.roomId,
      startDate: reservationData.startDate,
      endDate: reservationData.endDate,
      timeStart: reservationData.timeStart,
      timeDuration: formattedDuration
    };
  }

  // Add these methods to ReservationService

public findConflictingPendingReservations(currentReservation: Reservation, allReservations: Reservation[]): Reservation[] {
  return allReservations.filter(res => {
    if (res.id === currentReservation.id) return false;
    if (res.status !== 'PENDING') return false;
    if (res.room?.id !== currentReservation.room?.id) return false;

    // Date overlap check
    const currentStart = new Date(currentReservation.startDate);
    const currentEnd = new Date(currentReservation.endDate);
    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    const dateOverlap = currentStart <= resEnd && currentEnd >= resStart;
    if (!dateOverlap) return false;

    // Time overlap check
    const currentTimeStart = this.parseTimeToMinutes(currentReservation.timeStart);
    const currentTimeEnd = currentTimeStart + this.parseDurationToMinutes(currentReservation.timeDuration);
    const resTimeStart = this.parseTimeToMinutes(res.timeStart);
    const resTimeEnd = resTimeStart + this.parseDurationToMinutes(res.timeDuration);
    return currentTimeStart < resTimeEnd && currentTimeEnd > resTimeStart;
  });
}

private parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

private parseDurationToMinutes(duration: string): number {
  const [hours] = duration.split(':').map(Number);
  return hours * 60;
}
}