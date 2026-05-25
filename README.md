# arellan-mobile-app

Aplicación gerencial móvil de la Clínica Automotriz Arellan Hnos. PWA (Progressive Web App) para que Edgar, Juan y Ana aprueben gastos, reciban alertas críticas y monitoreen el taller en tiempo real desde cualquier lugar.

## Descripción

`arellan-mobile-app` es la herramienta de control ejecutivo en movilidad. Su función principal es **recibir notificaciones push de alta prioridad y ejecutar aprobaciones** sin necesidad de estar en la oficina. MFA obligatorio para todos los usuarios de este módulo.

## Audiencia

| Rol | Usuario | Función principal |
|-----|---------|------------------|
| `owner` | Edgar, Juan | Aprobaciones de gastos >S/.100, alertas de vehículos, monitoreo general |
| `admin` | Ana | Alertas operativas, seguimiento de OTs activas |

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ PWA con TypeScript |
| PWA Plugin | `next-pwa` + Workbox (service worker, cache offline) |
| Push Notifications | Web Push API vía VAPID |
| Estilos | Tailwind CSS + `@arellan/ui` |
| Estado | Zustand |
| Fetching | TanStack Query v5 |
| Auth | Supabase Auth con MFA obligatorio |
| Testing | Vitest + React Testing Library |

> **Nota MVP:** Se inicia como PWA para evitar costos y tiempos de publicación en App Store / Play Store. Si la experiencia PWA no satisface la UX gerencial, se migra a React Native con Expo en Fase 3.

## Estructura de Carpetas

```
src/
├── app/
│   ├── dashboard/              # KPIs del día (ingresos, OTs activas, alertas)
│   ├── approvals/              # Panel de aprobaciones pendientes
│   ├── alerts/                 # Alertas críticas recibidas
│   ├── vehicles/               # Registro de uso de vehículos del taller
│   └── auth/                   # Login con MFA
├── screens/
│   ├── kpis/                   # Resumen ejecutivo en tiempo real
│   ├── approvals/              # Aprobar/rechazar con PIN biométrico
│   └── alerts/                 # Historial y gestión de alertas
├── offline-sync/               # Queue local de acciones offline
├── notifications/              # Web Push, FCM, handlers
└── auth/                       # MFA, sesión, refresh tokens
```

## Funcionalidades MVP

- **Resumen ejecutivo del día** — ingresos totales, OTs activas, alertas pendientes
- **Aprobaciones push** — gastos >S/.100, salidas de personal, solicitudes de repuestos de alto valor
- **Alertas en tiempo real** — vehículo fuera del perímetro, descuadre de caja, acceso fuera de horario
- **Estado de OTs** — qué vehículos están en taller en este momento
- **Control de vehículos del taller** — quién tiene qué vehículo y desde cuándo
- **Logout forzoso remoto** — los owners pueden cerrar sesión de cualquier usuario

## Funcionalidades Fase 2

- Chat interno seguro entre owners/admin y personal administrativo
- Vista de inventario crítico (piezas bajo stock mínimo)
- Registro de incidencias desde el móvil
- Stream de cámaras CCTV del taller (si `arellan-hardware-iot` lo soporta)

## Flujo de Aprobación de Gastos

```
[Mechanic solicita repuesto en arellan-mechanic-ui]
           ↓
[Backend crea expense_authorization con status=PENDING]
           ↓
[Push notification → arellan-mobile-app de Edgar/Juan]
           ↓
[Owner ingresa PIN biométrico del celular]
           ↓
[Aprueba o rechaza con justificación]
           ↓
[Backend actualiza status → APPROVED / REJECTED]
           ↓
[Finance ve el gasto liberado en arellan-frontend-web]
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=https://api.arellan.pe
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
NEXT_PUBLIC_APP_URL=https://mobile.arellan.pe
```

## Scripts de Desarrollo

```bash
npm install
npm run dev          # localhost:3001
npm run build
npm run start
npm run test
```

## Dominio

`mobile.arellan.pe` — Requiere autenticación MFA. Sin acceso público.

## Repos Relacionados

- `arellan-platform` — API que consume (especialmente módulos `finance`, `vehicles`, `audit`)
- `arellan-frontend-web` — Complemento de escritorio para gestión completa

## Licencia

Privado — © 2026 Arellan Hnos. Todos los derechos reservados.
