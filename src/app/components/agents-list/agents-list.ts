import { Component, output, inject, OnInit, computed, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentsService, Agent } from '../../services/agents.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-agents-list',
  imports: [CommonModule, ConfirmModalComponent],
  templateUrl: './agents-list.html',
  styleUrl: './agents-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentsList implements OnInit {
  private readonly agentsService = inject(AgentsService);
  
  navigate = output<'create'>();
  agentDeleted = output<void>();
  agentStatusChanged = output<{ agent: Agent, newStatus: boolean }>();
  
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

  // Modal de confirmación para eliminar
  protected readonly showDeleteModal = signal<boolean>(false);
  protected readonly agentToDelete = signal<Agent | null>(null);
  protected readonly isDeleting = signal<boolean>(false);
  
  // Modal de confirmación para cambio de estado
  protected readonly showStatusModal = signal<boolean>(false);
  protected readonly agentToChangeStatus = signal<Agent | null>(null);
  protected readonly isChangingStatus = signal<boolean>(false);
  protected readonly targetStatus = signal<boolean>(true);
  
  // Dropdown de acciones
  protected readonly openDropdownId = signal<string | null>(null);
  private readonly dropdownPositions = new Map<string, 'up' | 'down'>();
  
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

  protected openDeleteModal(agent: Agent) {
    this.agentToDelete.set(agent);
    this.showDeleteModal.set(true);
  }

  protected onDeleteConfirmed() {
    const agent = this.agentToDelete();
    if (agent) {
      this.isDeleting.set(true);
      this.agentsService.deleteAgent(agent.id).subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.showDeleteModal.set(false);
          this.agentToDelete.set(null);
          // Emit success event to parent
          this.agentDeleted.emit();
        },
        error: (error) => {
          console.error('Error deleting agent:', error);
          this.isDeleting.set(false);
          // Here you could emit an error event to show an error toast
        }
      });
    }
  }

  protected onDeleteCancelled() {
    this.showDeleteModal.set(false);
    this.agentToDelete.set(null);
  }

  protected getDeleteMessage(): string {
    const agent = this.agentToDelete();
    return agent 
      ? `¿Estás seguro de que deseas eliminar el agente "${agent.name}"? Esta acción no se puede deshacer.`
      : '';
  }

  protected openStatusModal(agent: Agent, newStatus: boolean) {
    this.agentToChangeStatus.set(agent);
    this.targetStatus.set(newStatus);
    this.showStatusModal.set(true);
  }

  protected onStatusChangeConfirmed() {
    const agent = this.agentToChangeStatus();
    const newStatus = this.targetStatus();
    
    if (agent) {
      this.isChangingStatus.set(true);
      this.agentsService.updateAgentStatus(agent.id, newStatus).subscribe({
        next: (updatedAgent) => {
          this.isChangingStatus.set(false);
          this.showStatusModal.set(false);
          this.agentToChangeStatus.set(null);
          // Emit success event to parent for toast notification
          this.agentStatusChanged.emit({ agent: updatedAgent, newStatus });
        },
        error: (error) => {
          console.error('Error changing agent status:', error);
          this.isChangingStatus.set(false);
          // Here you could emit an error event to show an error toast
        }
      });
    }
  }

  protected onStatusChangeCancelled() {
    this.showStatusModal.set(false);
    this.agentToChangeStatus.set(null);
  }

  protected getStatusChangeMessage(): string {
    const agent = this.agentToChangeStatus();
    const newStatus = this.targetStatus();
    
    if (!agent) return '';
    
    const action = newStatus ? 'activar' : 'desactivar';
    const statusText = newStatus ? 'activo' : 'inactivo';
    
    return `¿Estás seguro de que deseas ${action} el agente "${agent.name}"? El agente quedará ${statusText}.`;
  }

  protected toggleDropdown(agentId: string) {
    if (this.openDropdownId() === agentId) {
      this.closeDropdown();
    } else {
      // Cerrar cualquier dropdown abierto primero
      this.closeDropdown();
      // Calcular posición ANTES de abrir el dropdown
      this.calculateDropdownPositionSync(agentId);
      // Abrir el nuevo dropdown
      this.openDropdownId.set(agentId);
    }
  }

  protected closeDropdown() {
    this.openDropdownId.set(null);
    this.dropdownPositions.clear();
  }

  protected isDropdownOpen(agentId: string): boolean {
    return this.openDropdownId() === agentId;
  }

  private calculateDropdownPositionSync(agentId: string) {
    const dropdownButton = document.querySelector(`[data-agent-id="${agentId}"]`) as HTMLElement;
    if (!dropdownButton) {
      console.log('Dropdown button not found!');
      return;
    }

    const rect = dropdownButton.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 120; // Altura aproximada del dropdown
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Encontrar la tabla para obtener su contexto
    const tableElement = dropdownButton.closest('table');
    let isLastRow = false;
    let totalRows = 0;
    let currentRowIndex = -1;
    
    if (tableElement) {
      const rows = tableElement.querySelectorAll('tbody tr');
      const currentRow = dropdownButton.closest('tr');
      totalRows = rows.length;
      
      if (currentRow && rows.length > 0) {
        currentRowIndex = Array.from(rows).indexOf(currentRow);
        // Simplificar: considerar última fila o penúltima si hay espacio muy limitado
        const isLastTwoRows = currentRowIndex >= totalRows - 2;
        const hasVeryLimitedSpace = spaceBelow < dropdownHeight * 0.8; // Menos restrictivo
        isLastRow = isLastTwoRows || hasVeryLimitedSpace;
      }
    }

    // Lógica simplificada: priorizar el posicionamiento hacia arriba cuando hay dudas
    const shouldPositionUp = isLastRow || 
                            (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) ||
                            (spaceBelow < dropdownHeight * 1.2 && currentRowIndex >= totalRows - 1); // Última fila con poco espacio

    if (shouldPositionUp) {
      this.dropdownPositions.set(agentId, 'up');
    } else {
      this.dropdownPositions.set(agentId, 'down');
    }
    
  }

  protected getDropdownPositionClass(agentId: string): string {
    const position = this.dropdownPositions.get(agentId) || 'down';
    const classes = position === 'up' ? 'bottom-full mb-2' : 'mt-2';
    
    return classes;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    
    // Si el clic es en un botón de dropdown, no cerrar (el toggle se encarga)
    if (target.closest('[data-agent-id]')) {
      return;
    }
    
    // Si el clic es dentro del dropdown, no cerrar
    if (target.closest('.absolute.right-0')) {
      return;
    }
    
    // Cerrar dropdown en cualquier otro caso
    this.closeDropdown();
  }
}
