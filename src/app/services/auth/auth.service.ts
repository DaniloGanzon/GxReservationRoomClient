import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { RegisterModelDto, LoginModelDto } from '../../model/authModel';
import { tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'authToken';
  public authSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.isAuthenticated());
  private jwtHelper = new JwtHelperService();


  constructor(
    private http: HttpClient
  ) { }

  get authState$(): Observable<boolean> {
    return this.authSubject.asObservable();
  }

  register(model: RegisterModelDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, model);
  }

  login(model: LoginModelDto): Observable<any> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, model).pipe(
      tap((response) => {
        this.setToken(response.token);
        this.authSubject.next(true);
      })
    );
  }

  logout(): void {
    this.removeToken();
    this.authSubject.next(false);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.authSubject.next(true);
  }


  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.authSubject.next(false);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (token && this.jwtHelper) {
      const isExpired = this.jwtHelper.isTokenExpired(token)
      return !isExpired;
    }
    return false;
  }


  getUserId(): string | null {
    const token = this.getToken();
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
    }
    return null;
  }
  
  getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
    }
    return null;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      console.error('No token found');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
  

}
