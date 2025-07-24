# SDI AI LOVERS - Sistema de Gestión de Agentes IA

Una aplicación web moderna desarrollada con Angular 20+ para la gestión y administración de agentes de inteligencia artificial, construida específicamente para el hackathon de SDI Lab.

## 🚀 Características Principales

- **Gestión Completa de Agentes IA**: Visualización, creación, edición, activación/desactivación y eliminación de agentes
- **Interfaz Moderna**: UI responsiva desarrollada con Tailwind CSS y componentes standalone de Angular
- **Búsqueda Avanzada**: Filtros por nombre, descripción, modelo y usuario con filtros de estado (activo/inactivo)
- **Paginación**: Sistema de paginación con 6 elementos por página
- **Estados Reactivos**: Implementado con Angular Signals para máximo rendimiento
- **Integración API Completa**: Conexión segura con la API de SDI Lab usando autenticación Bearer
- **Creación de Agentes**: Formulario completo con validaciones, selección de modelo base y carga de archivos
- **Gestión de Estados**: Activar/desactivar agentes con confirmación modal
- **Eliminación Segura**: Confirmación modal para eliminación de agentes
- **Notificaciones Toast**: Sistema de alertas para feedback de acciones del usuario

## 🛠️ Stack Tecnológico

- **Framework**: Angular 20.1.0 (última versión)
- **Lenguaje**: TypeScript 5.8.2
- **Estilos**: Tailwind CSS 3.4.17
- **HTTP Client**: Angular HttpClient con interceptores
- **Estado**: Angular Signals y Computed Properties
- **Arquitectura**: Standalone Components con OnPush Change Detection

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/             
│   │   ├── agents-list/       ----> Lista de agentes con paginación, filtros y gestión de estado
│   │   ├── create-agent/      ----> Formulario de creación de agentes con validaciones
│   │   ├── sidebar-menu/      ----> Menú lateral de navegación
│   │   ├── confirm-modal/     ----> Modal de confirmación reutilizable
│   │   └── alert/             ----> Sistema de notificaciones toast
│   ├── pages/
│   │   └── home/              ----> Página principal con layout y manejo de eventos
│   ├── services/
│   │   └── agents.service.ts  ----> Servicio completo de gestión de agentes (CRUD)
│   ├── app.config.ts           
│   ├── app.routes.ts          ----> Configuración de rutas
│   └── app.ts                  
├── index.html                  
├── main.ts                     
└── styles.css                  
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Angular CLI 20+

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/dmendezSDi/SDiAiLOVERS.git
   cd SDI-AILOVERS
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar API Key:**
   Antes de ejecutar la aplicación, debes configurar tu API Key:
   
   - Abre el archivo `src/app/services/agents.service.ts`
   - Busca la línea: `private readonly API_KEY = '';`
   - Reemplaza el string vacío con tu API Key de SDI Lab:
     ```typescript
     private readonly API_KEY = 'tu-api-key-aqui';
     ```
   
   > **Nota**: Por seguridad, la API Key no está incluida en el repositorio. Contacta al equipo de SDI Lab para obtener las credenciales necesarias.

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm start
   # o
   ng serve
   ```

5. **Abrir en el navegador**
   Navegar a `http://localhost:4200/`


## 🤝 Contribución


Este proyecto fue desarrollado para el hackathon de SDI Lab.

---
