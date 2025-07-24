import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar-menu',
  imports: [],
  templateUrl: './sidebar-menu.html',
  styleUrl: './sidebar-menu.css'
})
export class SidebarMenu {
  @Input() currentView: 'agents' | 'create' | null = null;
  @Output() navigate = new EventEmitter<'agents' | 'create' | null>();

  onMenuClick(option: 'agents' | 'create' | null) {
    this.navigate.emit(option);
  }
}
