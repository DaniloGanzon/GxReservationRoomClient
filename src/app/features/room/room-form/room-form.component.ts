// room-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnChanges  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Room } from '../../../model/Room';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-room-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './room-form.component.html',
  styleUrls: ['./room-form.component.css']
})
export class RoomFormComponent implements OnChanges {
  @Input() room: Room | null = null;
  @Output() submitForm = new EventEmitter<Room | Omit<Room, 'id'>>();
  @Output() cancel = new EventEmitter<void>();

  roomForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.roomForm = this.fb.group({
      name: ['', Validators.required],
      building: ['', Validators.required],
      floor: ['', Validators.required],
      status: ['Available', Validators.required] // Default to 'Available'
    });
  }

  ngOnChanges(): void {
    if (this.room) {
      this.roomForm.patchValue(this.room);
    } else {
      this.roomForm.reset({ status: 'Available' });
    }
  }

  onSubmit(): void {
    if (this.roomForm.valid) {
      const formValue = this.roomForm.value;
      
      if (this.room?.id) {
        // For edits - include ID
        const roomData: Room = {
          id: this.room.id,
          name: formValue.name,
          building: formValue.building,
          floor: formValue.floor,
          status: formValue.status
        };
        this.submitForm.emit(roomData);
      } else {
        // For creates - exclude ID
        const roomData: Omit<Room, 'id'> = {
          name: formValue.name,
          building: formValue.building,
          floor: formValue.floor,
          status: formValue.status
        };
        this.submitForm.emit(roomData);
      }
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
