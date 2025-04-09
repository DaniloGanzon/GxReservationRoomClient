import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Room } from '../../../../model/Room';
import { FormsModule } from '@angular/forms'; 
import { DateTimeService } from '../../../../services/feature/datetime.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-reservation-form',
  imports: [FormsModule, CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit{
  @Input({ required: true }) selectedRoom!: Room; 
  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  reservationData: any = {
  name: '',       
  purpose: '',
  startDate: '',
  endDate: '',
  startTime: '08:00', 
  durationHours: 1     
};

  constructor(
    private dateTimeService: DateTimeService
  ) {}

  ngOnInit(): void {
    const today = this.getTodayDate();
    this.reservationData.startDate = today;
    this.reservationData.endDate = today;
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const payload = {
        ...this.reservationData,
        startDate: this.getFormattedDate(this.reservationData.startDate),
        endDate: this.getFormattedDate(this.reservationData.endDate),
        timeStart: this.reservationData.startTime + ':00',
        roomId: this.selectedRoom.id
      };
      
      this.submitForm.emit(payload);
    }
  }

  getFormattedDate(date: string): string {
    return this.dateTimeService.convertToBackendDate(
      this.dateTimeService.convertDatePickerToDate(date)
    );
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getTimeOptions(): string[] {
    const times = [];
    for (let hour = 8; hour <= 18; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return times;
  }

  private isFormValid(): boolean {
    return !!this.reservationData.name &&
           !!this.reservationData.purpose &&
           !!this.reservationData.startDate &&
           !!this.reservationData.endDate &&
           this.reservationData.durationHours > 0;
  }

  onStartDateChange(newStartDate: string): void {
    this.reservationData.endDate = newStartDate;
  }

  getMaxDate(): string {
    const nextMonths = new Date();
    nextMonths.setMonth(nextMonths.getMonth() + 3); // 3 months ahead
    return this.dateTimeService.convertToBackendDate(nextMonths);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMinDate(): string {
    return this.dateTimeService.convertToBackendDate(new Date());
  }
}