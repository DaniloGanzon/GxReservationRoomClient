import { Component } from '@angular/core';
import { LayoutComponent } from './features/layout/layout.component';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'GxReservationRoomClient';
}
