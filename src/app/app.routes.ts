import { Routes } from '@angular/router';
import { AdminCalendarComponent } from './features/calendar/admin-calendar/admin-calendar.component';
import { AuthComponent } from './auth/auth.component';
import { UserCalendarComponent } from './features/calendar/user-calendar/user-calendar.component';
import { RoomListsComponent } from './features/room/room-lists/room-lists.component';
import { AdminReservationsComponent } from './features/reservation/admin-reservations/admin-reservations.component';
import { UserReservationsComponent } from './features/reservation/user-reservations/user-reservations.component';
import { AuthGuard } from './services/guard/AuthGuard';
import { UnauthenticatedGuard } from './services/guard/UnauthenticatedGuard';
import { AdminGuard } from './services/guard/AdminGuard';
import { LayoutComponent } from './features/layout/layout.component';

export const routes: Routes = [
    { path: '', component: LayoutComponent, pathMatch: 'full' },
    { 
        path: 'auth', 
        component: AuthComponent,
        canActivate: [UnauthenticatedGuard] 
    },
    {
        path: 'admin',
        canActivate: [AdminGuard],
        children: [
            { path: 'calendar', component: AdminCalendarComponent },
            { path: 'rooms', component: RoomListsComponent },
            { path: 'reservations', component: AdminReservationsComponent },
        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        children: [
            { path: 'calendar', component: UserCalendarComponent },
            { path: 'reservations', component: UserReservationsComponent }
        ]
    },
    { path: '**', redirectTo: '' }
];