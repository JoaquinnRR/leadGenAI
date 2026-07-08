# Manual de Git para Agentes de IA en Browns Studio

> **[SYSTEM INSTRUCTION]**
> Eres un Agente de IA operando en un repositorio de Browns Studio. Debes seguir estrictamente este flujo de trabajo de Git. Cualquier desviación puede causar graves problemas en el proyecto.

## 1. Reglas Generales del Repositorio

1.  **Entornos Restringidos:**
    *   NUNCA hagas un commit directo ni un push a las ramas `main` o `staging`.
    *   `main` es el entorno de producción.
    *   `staging` es el entorno de integración y pruebas.
2.  **Contexto de Trabajo:**
    *   Solo puedes escribir código dentro de ramas de funcionalidades temporales (ej. `feature/*`, `fix/*`).
    *   Asegúrate siempre de saber en qué rama estás mediante comandos antes de crear, editar o eliminar archivos.

## 2. Flujo de Trabajo a Ejecutar

Cuando el programador humano (tu supervisor) te asigne una tarea y te pida ejecutar comandos Git, tu ciclo de trabajo debe ser:

### Paso 1: Sincronización y Creación de Rama
Antes de escribir una sola línea de código, debes crear un entorno aislado basado en la última versión de pruebas.
1. Cambia a la rama de integración y actualízala:
   `git checkout staging`
   `git pull origin staging`
2. Crea tu nueva rama de trabajo y cámbiate a ella:
   `git checkout -b feature/<nombre_descriptivo_del_issue>`

### Paso 2: Desarrollo Iterativo
A medida que avanzas en los requerimientos del usuario, realiza commits granulares y descriptivos.
`git add <archivos_modificados>`
`git commit -m "<tipo>: <descripcion corta y clara de lo que hace el agente>"`
*(Tipos recomendados: feat, fix, chore, refactor, docs)*

### Paso 3: Sincronización Remota
Sube tu nueva rama (con tus commits) al repositorio remoto.
`git push -u origin <nombre_de_la_rama>`

### Paso 4: Creación del Pull Request (PR)
Cuando la funcionalidad esté completa y el humano lo solicite, ayuda a preparar el código para revisión:
*   El Pull Request debe apuntar **SIEMPRE hacia la rama `staging`** (nunca hacia `main`).
*   Genera un resumen técnico claro de los cambios que introdujiste para que el líder de Browns Studio pueda leerlo en la descripción del PR.

## 3. Resolución de Conflictos
Si durante el desarrollo debes integrar cambios de `staging` y te encuentras con conflictos de *merge*:
1.  Usa herramientas de terminal o edita los archivos manualmente con extrema precaución.
2.  Asegúrate de no borrar código generado por otros agentes humanos o de IA a menos que tu supervisor humano te lo autorice explícitamente.
3.  Una vez resueltos, realiza el commit correspondiente (`git commit`).
