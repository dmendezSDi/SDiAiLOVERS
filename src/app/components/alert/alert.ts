import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [NgClass],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class AlertComponent implements OnInit, OnChanges {
  @Input() title: string = 'Notificación';
  @Input() message: string = 'Mensaje de alerta';
  @Input() type: 'info' | 'success' | 'warning' | 'alert' = 'info';
  @Input() duration: number = 4000;
  visible: boolean = false;

  get bgColor(): string {
    return (
      {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        alert: 'bg-red-500',
      }[this.type] || 'bg-blue-500'
    );
  }

  get textColor(): string {
    return this.type === 'warning' ? 'text-black' : 'text-white';
  }

  ngOnInit() {
    this.visible = true;
    this.startHideTimer();
  }

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['message'] || changes['title'] || changes['type']) {
        this.visible = true;
        this.startHideTimer();
    }
  }

  private startHideTimer() {
    if (this.duration > 0) {
      setTimeout(() => {
        this.visible = false;
      }, this.duration);
    }
  }
}
