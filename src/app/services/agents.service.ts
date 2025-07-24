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

export interface CreateAgentRequest {
  id?: string;
  base_model_id: string;
  name: string;
  meta: {
    profile_image_url?: string;
    description?: string;
    capabilities?: {
      [key: string]: any;
    };
    [key: string]: any;
  };
  params?: {
    [key: string]: any;
  };
  access_control?: {
    [key: string]: any;
  };
  is_active: boolean;
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
      'gpt-4-turbo': 'ChatGPT 4 (Razonamiento)',
      'gpt-4': 'GPT-4',
      'gpt-4-0125-preview': 'GPT-4 (0125) Preview',
      'gpt-4-1106-preview': 'GPT-4 (1106) Preview',
      'gpt-4-0613': 'GPT-4 (0613)',
      'gpt-3.5-turbo-0125': 'GPT-3.5 Turbo (0125)',
      'gpt-3.5-turbo-1106': 'GPT-3.5 Turbo (1106)',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
      'gpt-3.5-turbo-instruct': 'GPT-3.5 Turbo Instruct',
      'gpt-3.5-turbo-instruct-0914': 'GPT-3.5 Turbo Instruct (0914)',
      // Modelos anteriores para compatibilidad
      'gpt-4o': 'GPT-4 Omni',
      'gpt-4.1-mini': 'GPT-4 Mini',
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

  /**
   * Crea un nuevo agente
   */
  createAgent(agentData: CreateAgentRequest): Observable<Agent> {
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`,
      'Content-Type': 'application/json'
    });

    // Generar un ID único si no se proporciona
    if (!agentData.id) {
      agentData.id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    return this.http.post<Agent>(`${this.API_URL}create`, agentData, { headers }).pipe(
      tap(newAgent => {
        // Agregar el nuevo agente a la lista local
        const currentAgents = this.agents();
        this.agents.set([...currentAgents, newAgent]);
        this.agentsSubject.next([...currentAgents, newAgent]);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al crear agente:', error);
        let errorMessage = 'Error desconocido al crear el agente';
        
        if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado. Verifique la API Key.';
        } else if (error.status === 403) {
          errorMessage = 'Acceso denegado. Permisos insuficientes.';
        } else if (error.status === 422) {
          errorMessage = 'Datos de validación incorrectos. Verifique los campos requeridos.';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Intente más tarde.';
        } else if (error.error?.detail) {
          // Para errores de validación específicos
          const details = Array.isArray(error.error.detail) 
            ? error.error.detail.map((d: any) => d.msg).join(', ')
            : error.error.detail;
          errorMessage = `Error de validación: ${details}`;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Elimina un agente por ID
   */
  deleteAgent(agentId: string): Observable<boolean> {
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`,
      'Content-Type': 'application/json'
    });

    const params = {
      id: agentId
    };

    return this.http.delete<boolean>(`${this.API_URL}model/delete`, { headers, params }).pipe(
      tap(success => {
        if (success) {
          // Remover el agente eliminado de la lista local
          const currentAgents = this.agents();
          const updatedAgents = currentAgents.filter(agent => agent.id !== agentId);
          this.agents.set(updatedAgents);
          this.agentsSubject.next(updatedAgents);
        }
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al eliminar agente:', error);
        let errorMessage = 'Error desconocido al eliminar el agente';
        
        if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado. Verifique la API Key.';
        } else if (error.status === 403) {
          errorMessage = 'Acceso denegado. Permisos insuficientes.';
        } else if (error.status === 404) {
          errorMessage = 'Agente no encontrado.';
        } else if (error.status === 422) {
          errorMessage = 'Datos de validación incorrectos. ID de agente inválido.';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Intente más tarde.';
        } else if (error.error?.detail) {
          // Para errores de validación específicos
          const details = Array.isArray(error.error.detail) 
            ? error.error.detail.map((d: any) => d.msg).join(', ')
            : error.error.detail;
          errorMessage = `Error de validación: ${details}`;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Actualiza el estado activo/inactivo de un agente
   */
  updateAgentStatus(agentId: string, isActive: boolean): Observable<Agent> {
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`,
      'Content-Type': 'application/json'
    });

    // Encontrar el agente actual para mantener sus datos
    const currentAgent = this.agents().find(agent => agent.id === agentId);
    if (!currentAgent) {
      throw new Error('Agente no encontrado');
    }

    // Preparar los datos para la actualización
    const updateData = {
      id: agentId,
      base_model_id: currentAgent.base_model_id,
      name: currentAgent.name,
      meta: currentAgent.meta,
      params: currentAgent.params,
      access_control: currentAgent.access_control || {},
      is_active: isActive
    };

    const params = {
      id: agentId
    };

    return this.http.post<Agent>(`${this.API_URL}model/update`, updateData, { headers, params }).pipe(
      tap(updatedAgent => {
        // Actualizar el agente en la lista local, preservando la información del usuario original
        const currentAgents = this.agents();
        const updatedAgents = currentAgents.map(agent => {
          if (agent.id === agentId) {
            // Preservar la información del usuario original si no viene en la respuesta
            const agentWithUser = {
              ...updatedAgent,
              user: updatedAgent.user || currentAgent?.user
            };
            return agentWithUser;
          }
          return agent;
        });
        this.agents.set(updatedAgents);
        this.agentsSubject.next(updatedAgents);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al actualizar estado del agente:', error);
        let errorMessage = 'Error desconocido al actualizar el agente';
        
        if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado. Verifique la API Key.';
        } else if (error.status === 403) {
          errorMessage = 'Acceso denegado. Permisos insuficientes.';
        } else if (error.status === 404) {
          errorMessage = 'Agente no encontrado.';
        } else if (error.status === 422) {
          errorMessage = 'Datos de validación incorrectos.';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Intente más tarde.';
        } else if (error.error?.detail) {
          const details = Array.isArray(error.error.detail) 
            ? error.error.detail.map((d: any) => d.msg).join(', ')
            : error.error.detail;
          errorMessage = `Error de validación: ${details}`;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
        throw error;
      })
    );
  }
}
