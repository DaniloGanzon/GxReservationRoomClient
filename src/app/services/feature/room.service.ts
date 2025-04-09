import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Room } from '../../model/Room';
import { AuthService } from '../auth/auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private apiUrl = `${environment.apiUrl}/room`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getAllRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}`, {
      headers: this.authService.getAuthHeaders()  
    });
  }

  getRoomById(roomId: number): Observable<Room> {
    return this.http.get<Room>(`${this.apiUrl}/${roomId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createRoom(room: Omit<Room, 'id'>): Observable<Room> {
    console.log('Sending create request with:', JSON.stringify(room));
    return this.http.post<Room>(this.apiUrl, room, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Create response:', response)),
      catchError(error => {
        console.error('Create error:', error);
        console.log('Error response:', error.error);
        return throwError(error);
      })
    );
  }

  updateRoom(id: number, room: Room): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, room, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteRoom(roomId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roomId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}