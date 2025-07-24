import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AgentsService, CreateAgentRequest } from '../../services/agents.service';

@Component({
  selector: 'app-create-agent',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-agent.html',
  styleUrl: './create-agent.css'
})
export class CreateAgent {
  navigate = output<'agents'>();
  agentCreated = output<void>();
  
  // FormGroup principal
  agentForm: FormGroup;
  
  // Estados del drag & drop
  dragState: 'idle' | 'dragover' | 'dropping' = 'idle';
  
  // Estado de creación
  isCreating = false;
  createError = '';
  
  // Configuración de archivos permitidos
  private readonly allowedTypes = ['pdf', 'doc', 'docx', 'txt'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  
  // Mensajes de error para archivos
  fileErrorMessage = '';

  // Opciones de tipos de agente
  agentTypes = [
    { value: 'Conversacional', label: 'Conversacional', icon: '💬' },
    { value: 'Analítico', label: 'Analítico', icon: '📊' },
    { value: 'Productividad', label: 'Productividad', icon: '⚡' },
    { value: 'Creativo', label: 'Creativo', icon: '💡' }
  ];

  // Opciones de modelos base disponibles (desde API /models/base)
  baseModels = [
    { id: 'gpt-4-turbo', name: 'ChatGPT 4 (Razonamiento)' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-0125-preview', name: 'GPT-4 (0125) Preview' },
    { id: 'gpt-4-1106-preview', name: 'GPT-4 (1106) Preview' },
    { id: 'gpt-4-0613', name: 'GPT-4 (0613)' },
    { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo (0125)' },
    { id: 'gpt-3.5-turbo-1106', name: 'GPT-3.5 Turbo (1106)' },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' },
    { id: 'gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo Instruct' },
    { id: 'gpt-3.5-turbo-instruct-0914', name: 'GPT-3.5 Turbo Instruct (0914)' }
  ];

  constructor(
    private fb: FormBuilder,
    private agentsService: AgentsService
  ) {
    this.agentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      type: ['Conversacional', [Validators.required]],
      baseModel: ['gpt-4o', [Validators.required]],
      files: this.fb.array([]) // Sin archivos de ejemplo
    });
  }

  // Getters para acceso fácil a los controles
  get name() { return this.agentForm.get('name'); }
  get description() { return this.agentForm.get('description'); }
  get type() { return this.agentForm.get('type'); }
  get baseModel() { return this.agentForm.get('baseModel'); }
  get files() { return this.agentForm.get('files') as FormArray; }

  // Getter para obtener la lista de archivos como array
  get uploadedFiles(): string[] {
    return this.files.value;
  }

  onGoBack() {
    this.navigate.emit('agents');
  }

  onSelectType(type: string) {
    this.type?.setValue(type);
  }

  // Métodos para manejo de archivos en FormArray
  private addFile(fileName: string): void {
    this.files.push(this.fb.control(fileName));
  }

  private removeFileAt(index: number): void {
    this.files.removeAt(index);
  }

  // Validación robusta de archivos
  private validateFile(file: File): { valid: boolean; error?: string } {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !this.allowedTypes.includes(extension)) {
      return { valid: false, error: `Tipo de archivo no permitido. Solo se permiten: ${this.allowedTypes.join(', ')}` };
    }
    
    if (file.size > this.maxFileSize) {
      return { valid: false, error: 'El archivo es demasiado grande. Máximo 10MB.' };
    }
    
    if (this.uploadedFiles.includes(file.name)) {
      return { valid: false, error: 'Este archivo ya ha sido agregado.' };
    }
    
    return { valid: true };
  }

  // Procesamiento unificado de archivos
  private processFiles(files: FileList | File[]): void {
    this.fileErrorMessage = '';
    const filesToAdd: string[] = [];
    const errors: string[] = [];

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const validation = this.validateFile(file);
      
      if (validation.valid) {
        filesToAdd.push(file.name);
      } else {
        errors.push(validation.error!);
      }
    }

    // Actualizar FormArray con nuevos archivos
    filesToAdd.forEach(fileName => this.addFile(fileName));

    // Mostrar errores si los hay
    if (errors.length > 0) {
      this.fileErrorMessage = errors[0]; // Mostrar solo el primer error
      setTimeout(() => this.fileErrorMessage = '', 5000); // Limpiar después de 5s
    }
  }

  // Event handlers mejorados
  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(input.files);
      input.value = ''; // Limpiar input
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragState = 'dragover';
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragState = 'dragover';
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Solo cambiar estado si realmente salimos del área
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.dragState = 'idle';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.dragState = 'dropping';
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(files);
    }
    
    setTimeout(() => this.dragState = 'idle', 300); // Feedback visual
  }

  onRemoveFile(fileName: string): void {
    const index = this.uploadedFiles.findIndex(file => file === fileName);
    if (index > -1) {
      this.removeFileAt(index);
    }
  }

  onCreateAgent(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.agentForm.markAllAsTouched();

    if (this.agentForm.valid && !this.isCreating) {
      this.isCreating = true;
      this.createError = '';

      const formValue = this.agentForm.value;

      // Preparar los datos según la estructura esperada por la API
      const agentData: CreateAgentRequest = {
        name: formValue.name,
        base_model_id: formValue.baseModel,
        meta: {
          description: formValue.description,
          profile_image_url: "/static/favicon.png", // Valor por defecto
          capabilities: {
            vision: false,
            file_upload: true,
            web_search: false,
            image_generation: false,
            code_interpreter: false,
            citations: true,
            usage: true
          },
          tags: [formValue.type] // Usar el tipo como tag
        },
        params: {
          system: `Eres un agente IA especializado en ${formValue.type.toLowerCase()}. ${formValue.description}`
        },
        access_control: {},
        is_active: true
      };

      // Llamar al servicio para crear el agente
      this.agentsService.createAgent(agentData).subscribe({
        next: (createdAgent) => {
          console.log('Agente creado exitosamente:', createdAgent);
          this.isCreating = false;
          // Emitir evento de agente creado
          this.agentCreated.emit();
          // Navegar de vuelta a la lista de agentes
          this.navigate.emit('agents');
        },
        error: (error) => {
          console.error('Error al crear agente:', error);
          this.createError = this.agentsService.error() || 'Error desconocido al crear el agente';
          this.isCreating = false;
        }
      });
    } else if (!this.agentForm.valid) {
      console.log('Formulario inválido:', this.agentForm.errors);
      // Encontrar el primer campo con error y mostrarlo
      Object.keys(this.agentForm.controls).forEach(key => {
        const control = this.agentForm.get(key);
        if (control && control.invalid) {
          console.log(`Campo ${key} inválido:`, control.errors);
        }
      });
    }
  }

  // Métodos auxiliares para validaciones en el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.agentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.agentForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['minlength']) return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${fieldName} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    return '';
  }

  // Getters para el template
  get isDragOver(): boolean {
    return this.dragState === 'dragover';
  }

  get isDropping(): boolean {
    return this.dragState === 'dropping';
  }
}
