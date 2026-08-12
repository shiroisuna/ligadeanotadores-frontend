# Frontend - Liga de Anotadores de Béisbol y Softbol

## Instalación

```bash
npm install
cp .env.example .env   # confirma que VITE_API_URL apunte a tu backend
npm run dev
```

Abre `http://localhost:5173`. Necesitas el backend corriendo en `http://localhost:4000`
al mismo tiempo (con CORS ya habilitado ahí, así que no hay que configurar nada extra).

## Qué ya funciona

- **Login** (`/login`) — contra `POST /api/auth/login`, guarda el token en `localStorage`
  y redirige según el rol (`administrador` → `/admin`, `jugador` → `/mi-estadistica`).
- **Posiciones** (`/posiciones`) — pública, con el selector de temporada/categoría
  (el "marcador") arriba. Muestra columnas básicas o avanzadas según
  `categoria.nivel_standings`.
- **Líderes** (`/lideres`) — pública, pestañas por estadística de bateo/pitcheo
  (pitcheo se oculta solo si `categoria.lleva_pitcheo` es falso).
- **Panel de administración** (`/admin`) — layout con barra lateral (`AdminShell`),
  resumen con conteos reales, y notificaciones tipo toast en vez de `alert()`
  del navegador (`useToast()` desde cualquier pantalla admin).
- **Equipos y roster** (`/admin/equipos`) — panel de dos columnas: equipos
  inscritos en la categoría a la izquierda, roster editable a la derecha.
  Los campos de número/posición/activo del roster se guardan solos al
  cambiarlos (sin botón "Guardar"), y los modales de "Inscribir equipo"
  / "Agregar jugador" dejan elegir entre el catálogo existente o crear uno
  nuevo en el momento.
- **Calendario y juegos** (`/admin/juegos`) — programa partidos entre equipos
  inscritos, y edita el resultado final (marcador, hits, errores, árbitros,
  anotador oficial) en un modal.
- **Box score** (`/admin/boxscore/:juegoId`, se accede desde cada juego en el
  calendario) — la pantalla más grande: una tabla editable con las 25 columnas
  de bateo y otra con las 17 de pitcheo (las mismas del Excel original),
  precargada con el roster de ambos equipos. Cada tabla tiene su propio botón
  "Guardar" independiente.
- Rutas protegidas por rol con `<RequireRole roles={['administrador']}>`.

## Piezas reutilizables para las pantallas admin que faltan

- `useTemporadaCategoria()` (`src/hooks/`) — ya trae temporadas + categorías activas
- `useToast()` (`src/components/Toast.jsx`) — `notificar('mensaje', 'exito'|'error'|'info')`
- `<Modal titulo="..." abierto={bool} onCerrar={fn}>` (`src/components/Modal.jsx`)
- `<TeamBadge nombre="..." tamano={32} />` (`src/components/TeamBadge.jsx`) — escudo con iniciales
- Clases CSS ya definidas en `src/styles/admin.css`: `.panel-doble`, `.tarjeta-lista`,
  `.item-lista`, `.tabla-editable`, `.campo`, `.boton` (variantes `--primario`,
  `--dorado`, `--fantasma`, `--peligro`)

## Qué falta (mismo patrón que las pantallas existentes)

Cada pantalla nueva es un archivo en `src/features/admin/<modulo>/`, agregado
como `<Route path="modulo" element={<...Page />} />` dentro del bloque `/admin`
de `App.jsx` (ya queda dentro de `AdminShell` automáticamente).

1. **Categorías** — CRUD simple sobre `/api/categorias`
2. **Control de lanzadores** — formulario corto, un registro por fecha, sobre
   `/api/control-lanzadores`

### Ejemplo de pantalla admin (categorías)

```jsx
import { useEffect, useState } from 'react';
import { api } from '../../../api/client';

export default function CategoriasAdminPage() {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    api.get('/categorias').then(setCategorias);
  }, []);

  async function crear(datos) {
    const nueva = await api.post('/categorias', datos);
    setCategorias((prev) => [...prev, nueva]);
  }

  async function eliminar(id) {
    await api.delete(`/categorias/${id}`);
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  }

  // ...JSX de la tabla + formulario, con las clases .tabla / .pestana
  // ya definidas en src/styles/global.css para mantener el mismo estilo.
}
```

## Sistema de diseño

Todo vive en `src/styles/tokens.css` (colores, tipografías, escala de espaciado)
y `src/styles/global.css` (clases reutilizables: `.tabla`, `.pestana`, `.marcador`,
`.vacio`, `.contenedor`). Si agregas una pantalla nueva, reutiliza esas clases en
vez de inventar estilos sueltos, para que todo el sitio se sienta parte del mismo
"marcador de estadio".
