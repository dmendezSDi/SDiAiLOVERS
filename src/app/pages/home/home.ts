import { Component, signal } from '@angular/core';
import { SidebarMenu } from '../../components/sidebar-menu/sidebar-menu';
import { AgentsList } from '../../components/agents-list/agents-list';
import { CreateAgent } from '../../components/create-agent/create-agent';
import { AlertComponent } from '../../components/alert/alert';
import { Agent } from '../../services/agents.service';

@Component({
  selector: 'app-home',
  imports: [SidebarMenu, AgentsList, CreateAgent, AlertComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  currentView = signal<'agents' | 'create' | null>(null);
  
  // Estado del alert
  showAlert = signal<boolean>(false);
  alertTitle = signal<string>('');
  alertMessage = signal<string>('');
  alertType = signal<'info' | 'success' | 'warning' | 'alert'>('info');

  onNavigate(view: 'agents' | 'create' | null) {
    this.currentView.set(view);
  }

  onAgentCreated() {
    // Mostrar mensaje de éxito
    this.alertTitle.set('¡Éxito!');
    this.alertMessage.set('El agente ha sido creado exitosamente.');
    this.alertType.set('success');
    this.showAlert.set(true);
    
    // Navegar de vuelta a la lista de agentes
    this.currentView.set('agents');
    
    // Ocultar el alert después de 4 segundos
    setTimeout(() => {
      this.showAlert.set(false);
    }, 4000);
  }

  onAgentDeleted() {
    // Mostrar mensaje de éxito
    this.alertTitle.set('¡Agente Eliminado!');
    this.alertMessage.set('El agente ha sido eliminado exitosamente.');
    this.alertType.set('success');
    this.showAlert.set(true);
    
    // Ocultar el alert después de 4 segundos
    setTimeout(() => {
      this.showAlert.set(false);
    }, 4000);
  }

  onAgentStatusChanged(event: { agent: Agent, newStatus: boolean }) {
    const { agent, newStatus } = event;
    const statusText = newStatus ? 'activado' : 'desactivado';
    
    // Mostrar mensaje de éxito
    this.alertTitle.set('¡Estado Actualizado!');
    this.alertMessage.set(`El agente "${agent.name}" ha sido ${statusText} exitosamente.`);
    this.alertType.set('success');
    this.showAlert.set(true);
    
    // Ocultar el alert después de 4 segundos
    setTimeout(() => {
      this.showAlert.set(false);
    }, 4000);
  }
}
