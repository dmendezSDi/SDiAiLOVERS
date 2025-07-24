import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Agent {
  id: string;
  user_id: string;
  base_model_id: string;
  name: string;
  params: {
    system?: string;
  };
  meta: {
    profile_image_url?: string;
    description?: string;
    capabilities?: {
      vision?: boolean;
      file_upload?: boolean;
      web_search?: boolean;
      image_generation?: boolean;
      code_interpreter?: boolean;
      citations?: boolean;
      usage?: boolean;
    };
    suggestion_prompts?: string[] | null;
    tags?: string[];
  };
  access_control?: any;
  is_active: boolean;
  updated_at: number;
  created_at: number;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    profile_image_url?: string;
  };
}

export interface ApiResponse {
  success: boolean;
  data?: Agent[];
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentsService {
  private readonly http = inject(HttpClient);
  
  // Configuración de la API
  private readonly API_URL = 'https://hackaton.sdilab.es/api/v1/models/';
  private readonly API_KEY = ''; // Agregar tu API Key aquí
  
  // Estado reactivo con signals
  readonly agents = signal<Agent[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  private readonly agentsSubject = new BehaviorSubject<Agent[]>([]);
  readonly agents$ = this.agentsSubject.asObservable();

  constructor() {}

  /**
   * Obtiene todos los agentes desde la API
   */
  getAgents(): Observable<Agent[]> {
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`,
      'Content-Type': 'application/json'
    });

    const params = {
      id: this.API_KEY
    };

    return this.http.get<Agent[]>(this.API_URL, { 
      headers, 
      params,
      observe: 'response'
    }).pipe(
      map(response => {
        // La API devuelve directamente el array de agentes
        const agents = response.body || [];
        return agents;
      }),
      tap(agents => {
        this.agents.set(agents);
        this.agentsSubject.next(agents);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener agentes:', error);
        let errorMessage = 'Error desconocido al cargar los agentes';
        
        if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado. Verifique la API Key.';
        } else if (error.status === 403) {
          errorMessage = 'Acceso denegado. Permisos insuficientes.';
        } else if (error.status === 404) {
          errorMessage = 'Endpoint no encontrado.';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Intente más tarde.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
        return EMPTY;
      })
    );
  }

  /**
   * Refresca la lista de agentes
   */
  refreshAgents(): void {
    this.getAgents().subscribe();
  }

  /**
   * Obtiene un agente por ID
   */
  getAgentById(id: string): Agent | undefined {
    return this.agents().find(agent => agent.id === id);
  }

  /**
   * Filtra agentes por estado activo/inactivo
   */
  getActiveAgents(): Agent[] {
    return this.agents().filter(agent => agent.is_active);
  }

  getInactiveAgents(): Agent[] {
    return this.agents().filter(agent => !agent.is_active);
  }

  /**
   * Busca agentes por nombre
   */
  searchAgents(query: string): Agent[] {
    if (!query.trim()) {
      return this.agents();
    }
    
    const searchTerm = query.toLowerCase();
    return this.agents().filter(agent => 
      agent.name.toLowerCase().includes(searchTerm) ||
      agent.meta.description?.toLowerCase().includes(searchTerm) ||
      agent.base_model_id.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Formatea la fecha de actualización
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el tipo de modelo base formateado
   */
  getModelType(baseModelId: string): string {
    const modelMap: Record<string, string> = {
      'gpt-4o': 'GPT-4 Omni',
      'gpt-4.1-mini': 'GPT-4 Mini',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo'
    };
    
    return modelMap[baseModelId] || baseModelId;
  }

  /**
   * Determina el estado del agente basado en sus propiedades
   */
  getAgentStatus(agent: Agent): 'Activo' | 'Inactivo' | 'Borrador' {
    if (!agent.is_active) {
      return 'Inactivo';
    }
    
    // Si no tiene descripción o parámetros del sistema, considerarlo borrador
    if (!agent.meta.description && !agent.params.system) {
      return 'Borrador';
    }
    
    return 'Activo';
  }
}
