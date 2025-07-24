import { Component, output, inject, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentsService, Agent } from '../../services/agents.service';

@Component({
  selector: 'app-agents-list',
  imports: [CommonModule],
  templateUrl: './agents-list.html',
  styleUrl: './agents-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentsList implements OnInit {
  private readonly agentsService = inject(AgentsService);
  
  navigate = output<'create'>();
  
  // Señales reactivas
  protected readonly agents = this.agentsService.agents;
  protected readonly loading = this.agentsService.loading;
  protected readonly error = this.agentsService.error;
  
  // Filtros
  protected readonly searchTerm = signal<string>('');
  protected readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  
  // Paginación
  protected readonly currentPage = signal<number>(1);
  protected readonly itemsPerPage = 6;
  
  // Agentes filtrados usando computed
  protected readonly filteredAgents = computed(() => {
    let agents = this.agents();
    
    // Filtrar por búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      agents = agents.filter(agent => 
        agent.name.toLowerCase().includes(search) ||
        agent.meta.description?.toLowerCase().includes(search) ||
        this.agentsService.getModelType(agent.base_model_id).toLowerCase().includes(search) ||
        agent.user?.name?.toLowerCase().includes(search)
      );
    }
    
    // Filtrar por estado
    const status = this.statusFilter();
    if (status === 'active') {
      agents = agents.filter(agent => agent.is_active);
    } else if (status === 'inactive') {
      agents = agents.filter(agent => !agent.is_active);
    }
    
    return agents;
  });
  
  // Agentes paginados
  protected readonly paginatedAgents = computed(() => {
    const filtered = this.filteredAgents();
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  });
  
  // Cálculos de paginación
  protected readonly totalPages = computed(() => {
    return Math.ceil(this.filteredAgents().length / this.itemsPerPage);
  });
  
  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });
  
  // Estadísticas computed
  protected readonly stats = computed(() => {
    const allAgents = this.agents();
    return {
      total: allAgents.length,
      active: allAgents.filter(agent => agent.is_active).length,
      inactive: allAgents.filter(agent => !agent.is_active).length
    };
  });

  ngOnInit(): void {
    this.loadAgents();
  }

  private loadAgents(): void {
    this.agentsService.getAgents().subscribe({
      next: () => {
        console.log('Agentes cargados exitosamente');
      },
      error: (error) => {
        console.error('Error al cargar agentes:', error);
      }
    });
  }

  protected onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(1); // Reset a primera página al buscar
  }

  protected onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(status);
    this.currentPage.set(1); // Reset a primera página al filtrar
  }

  protected onRefresh(): void {
    this.agentsService.refreshAgents();
  }

  // Métodos de paginación
  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected previousPage(): void {
    const current = this.currentPage();
    if (current > 1) {
      this.currentPage.set(current - 1);
    }
  }

  protected nextPage(): void {
    const current = this.currentPage();
    if (current < this.totalPages()) {
      this.currentPage.set(current + 1);
    }
  }

  protected min(a: number, b: number): number {
    return Math.min(a, b);
  }

  protected getAgentStatus(agent: Agent): 'Activo' | 'Inactivo' | 'Borrador' {
    return this.agentsService.getAgentStatus(agent);
  }

  protected getModelType(baseModelId: string): string {
    return this.agentsService.getModelType(baseModelId);
  }

  protected formatDate(timestamp: number): string {
    return this.agentsService.formatDate(timestamp);
  }

  protected getStatusClass(agent: Agent): string {
    const status = this.getAgentStatus(agent);
    return {
      'Activo': 'bg-green-100 text-green-800',
      'Inactivo': 'bg-red-100 text-red-800',
      'Borrador': 'bg-yellow-100 text-yellow-800'
    }[status];
  }

  protected onCreateAgent(): void {
    this.navigate.emit('create');
  }
}
