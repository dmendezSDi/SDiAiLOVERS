import { Component, signal } from '@angular/core';
import { SidebarMenu } from '../../components/sidebar-menu/sidebar-menu';
import { AgentsList } from '../../components/agents-list/agents-list';
import { CreateAgent } from '../../components/create-agent/create-agent';

@Component({
  selector: 'app-home',
  imports: [SidebarMenu, AgentsList, CreateAgent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  currentView = signal<'agents' | 'create' | null>(null);

  onNavigate(view: 'agents' | 'create' | null) {
    this.currentView.set(view);
  }
}
