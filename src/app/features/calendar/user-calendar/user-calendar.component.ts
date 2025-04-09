import { Component } from '@angular/core';
import { BaseCalendarComponent } from '../shared/base-calendar/base-calendar.component';

@Component({
  selector: 'app-user-calendar',
  imports: [
    BaseCalendarComponent
  ],
  templateUrl: './user-calendar.component.html',
  styleUrl: './user-calendar.component.css'
})
export class UserCalendarComponent extends BaseCalendarComponent {

}
