import { Component, OnInit } from '@angular/core';
import { Room } from '../../../model/Room';
import { RoomService } from '../../../services/feature/room.service';
import { CommonModule } from '@angular/common';
import { RoomFormComponent } from '../room-form/room-form.component';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-room-lists',
  imports: [CommonModule, RoomFormComponent, ConfirmationDialogComponent, MatIconModule],
  templateUrl: './room-lists.component.html',
  styleUrls: ['./room-lists.component.css']
})
export class RoomListsComponent implements OnInit {
  rooms: Room[] = [];
  selectedRoom: Room | null = null;
  showDeleteConfirmation = false;
  roomToDelete: number | null = null;

  constructor(
    private roomService: RoomService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  get availableRoomsCount(): number {
    return this.rooms.filter(room => room.status === 'Available').length;
  }

  loadRooms(): void {
    this.roomService.getAllRooms().subscribe({
      next: (rooms) => this.rooms = rooms,
      error: (err) => {
        console.error('Error loading rooms:', err);
        this.toastr.error('Failed to load rooms', 'Error');
      }
    });
  }

  onAddNew(): void {
    this.selectedRoom = {} as Room; // This will trigger the form to show
  }

  onEdit(room: Room): void {
    this.selectedRoom = { ...room };
  }

  onDelete(roomId: number): void {
    this.roomToDelete = roomId;
    this.showDeleteConfirmation = true;
  }

  handleDeleteConfirmation(confirmed: boolean): void {
    this.showDeleteConfirmation = false;
    
    if (confirmed && this.roomToDelete) {
      this.roomService.deleteRoom(this.roomToDelete).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(r => r.id !== this.roomToDelete);
          this.selectedRoom = null;
          this.toastr.success('Room deleted successfully!', 'Success');
        },
        error: (err) => {
          console.error('Error deleting room:', err);
          this.toastr.error('Failed to delete room', 'Error');
        }
      });
    }
    this.roomToDelete = null;
  }

  handleFormSubmit(roomData: Room | Omit<Room, 'id'>): void {
    if ('id' in roomData) {
      // Update existing room
      this.roomService.updateRoom(roomData.id, roomData).subscribe({
        next: () => {
          this.rooms = this.rooms.map(r => r.id === roomData.id ? {...r, ...roomData} : r);
          this.resetForm();
          this.toastr.success('Room updated successfully!', 'Success');
        },
        error: (err) => {
          console.error('Update error:', err);
          this.toastr.error('Failed to update room', 'Error');
        }
      });
    } else {
      // Create new room
      this.roomService.createRoom(roomData).subscribe({
        next: (newRoom) => {
          this.rooms = [...this.rooms, newRoom];
          this.resetForm();
          this.toastr.success('Room created successfully!', 'Success');
        },
        error: (err) => {
          console.error('Create error:', err);
          this.toastr.error('Failed to create room', 'Error');
        }
      });
    }
  }

  resetForm(): void {
    this.selectedRoom = null;
  }
}