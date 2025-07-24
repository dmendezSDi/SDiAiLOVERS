import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Agent {
  name: string;
  type: string;
  status: 'Activo' | 'Inactivo' | 'Borrador';
  lastModified: string;
}

@Component({
  selector: 'app-agents-list',
  imports: [CommonModule],
  templateUrl: './agents-list.html',
  styleUrl: './agents-list.css'
})
export class AgentsList {
  navigate = output<'create'>();

  agents: Agent[] = [
    {
      name: 'Agente de Soporte al Cliente',
      type: 'Conversacional',
      status: 'Activo',
      lastModified: '2023-10-26'
    },
    {
      name: 'Agente de Análisis de Mercado',
      type: 'Analítico',
      status: 'Inactivo',
      lastModified: '2023-09-15'
    },
    {
      name: 'Agente de Automatización de Tareas',
      type: 'Productividad',
      status: 'Activo',
      lastModified: '2023-11-01'
    },
    {
      name: 'Agente de Generación de Contenido',
      type: 'Creativo',
      status: 'Borrador',
      lastModified: '2023-10-20'
    },
    {
      name: 'Agente de Traducción',
      type: 'Lingüístico',
      status: 'Activo',
      lastModified: '2023-11-05'
    },
    {
      name: 'Agente de Moderación',
      type: 'Seguridad',
      status: 'Activo',
      lastModified: '2023-10-30'
    },
    {
      name: 'Agente de Recomendaciones',
      type: 'ML',
      status: 'Borrador',
      lastModified: '2023-10-28'
    },
    {
      name: 'Agente de Clasificación de Documentos',
      type: 'Analítico',
      status: 'Inactivo',
      lastModified: '2023-10-15'
    },
    {
      name: 'Agente de Chatbot Legal',
      type: 'Conversacional',
      status: 'Activo',
      lastModified: '2023-11-02'
    },
    {
      name: 'Agente de Análisis de Sentimientos',
      type: 'ML',
      status: 'Activo',
      lastModified: '2023-10-25'
    }
  ];

  searchTerm: string = '';
  
  // Propiedades de paginación
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  // Getter para obtener los agentes filtrados
  get filteredAgents(): Agent[] {
    if (!this.searchTerm) {
      return this.agents;
    }
    return this.agents.filter(agent => 
      agent.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      agent.status.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Getter para obtener los agentes paginados
  get paginatedAgents(): Agent[] {
    const filtered = this.filteredAgents;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    return filtered.slice(startIndex, endIndex);
  }

  // Getter para obtener el array de páginas
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Helper para Math.min
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.currentPage = 1; // Resetear a la primera página al buscar
  }

  // Métodos de paginación
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onNewAgent() {
    this.navigate.emit('create');
  }

  onEditAgent(agent: Agent) {
    console.log('Editar agente:', agent);
  }

  onDeleteAgent(agent: Agent) {
    console.log('Eliminar agente:', agent);
  }
}
