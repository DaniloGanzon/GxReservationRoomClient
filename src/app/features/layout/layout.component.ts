import { Component, OnInit, OnDestroy, Renderer2, ElementRef, HostBinding } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    CommonModule, 
    MatIconModule, 
    RouterLink,
    MatTooltipModule, 
    RouterModule,
    ConfirmationDialogComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})

export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isSidebarOpen = true;
  userRole: string | null = null;
  isAuthenticated = false;
  showLogoutDialog = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  @HostBinding('style.--sidebar-width') 
  sidebarWidth = '250px';

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebarWidth = this.isSidebarOpen ? '250px' : '70px';
  }

  ngOnInit() {
    this.updateAuthState();
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateAuthState());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateAuthState() {
    this.userRole = this.authService.getUserRole();
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  login() {
    this.router.navigate(['/auth']);
  }

  onLogoutConfirmed(confirmed: boolean): void {
    this.showLogoutDialog = false;
    if (confirmed) {
      this.authService.removeToken();
      this.router.navigate(['/auth']);
    }
  }
}
