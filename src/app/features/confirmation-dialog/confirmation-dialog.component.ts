import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent {
  @Input() title: string = 'Are you sure?';
  @Input() message: string = 'This action cannot be undone.';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() actionType: 'delete' | 'logout' | 'approve' | 'reject' = 'delete';
  @Output() confirmed = new EventEmitter<boolean>();

  get icon(): string {
    const icons = {
      delete: '⚠️',
      logout: '🔒',
      approve: '✅',
      reject: '❌'
    };
    return icons[this.actionType];
  }

  confirm() {
    this.confirmed.emit(true);
  }

  cancel() {
    this.confirmed.emit(false);
  }
}