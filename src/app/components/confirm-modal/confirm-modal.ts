import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css'
})
export class ConfirmModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirmar acción';
  @Input() message: string = '¿Estás seguro de que deseas continuar?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmButtonClass: string = 'bg-blue-600 hover:bg-blue-700 text-white';
  @Input() isLoading: boolean = false;
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    if (!this.isLoading) {
      this.confirmed.emit();
    }
  }

  onCancel() {
    if (!this.isLoading) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget && !this.isLoading) {
      this.onCancel();
    }
  }
}
