# CONTROL DE GESTIÓN

Monorepo con Bun workspaces + Turborepo para la aplicación de Control de Gestión.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` / `dev:desktop` / `dev:mobile` | Inicia el entorno de desarrollo por plataforma |
| `bun run build` | Compila todos los paquetes |
| `bun run build:web` | Compila la aplicación web |
| `bun run start` | Inicia o reinicia el servidor de producción con pm2 |
| `bun run stop` | Detiene el servidor |
| `bun run lint` | Ejecuta convenciones y lint |
| `bun run typecheck` | Verifica tipos en todos los paquetes |
| `bun run db:generate` / `db:migrate` / `db:push` | Flujos de base de datos |

El servidor usa `$PORT` (por defecto `4200`), el endpoint de salud es `/api/health` y los secretos viven en el archivo `.env` de la raíz.

## Project Structure

```text
.env                         Variables y secretos locales
packages/
  web/                       API + frontend web
    vite.config.ts           Configuración de Vite
    index.html               Entrada HTML
    vite/__plugins/
      hono-dev-plugin.ts     Integra /api/* durante desarrollo
      asset-optimizer-plugin.ts
    src/
      api/
        __core/
          app.ts             Base oRPC + montaje Hono
        routes/              Rutas por funcionalidad
        index.ts             Composición del router
        database/
          __client.ts        Cliente de base de datos
          index.ts           Reexporta db
          schema.ts          Esquema Drizzle
        lib/
          records.ts         Reglas de registros y datos para plantillas DOCX
          docx.ts            Render de plantillas DOCX
      web/
        __main.tsx           Bootstrap React
        main.tsx             Entrada web
        app.tsx              Rutas de la aplicación
        pages/               Páginas
        queries/             Consultas y mutaciones
        components/          Componentes de interfaz
        hooks/               Hooks
        lib/
          api.ts             Cliente API tipado
          desktop.ts         Tipos de la API Electron
          utils.ts           Utilidades
        styles.css           Estilos
  mobile/                    Aplicación Expo / React Native
    app/                     Navegación basada en archivos
    constants/               Tema
    hooks/                   Hooks móviles
    queries/                 Consultas de datos
    lib/
      api.ts                 Cliente API móvil
  desktop/                   Contenedor Electron
    electron/
      main.ts                Proceso principal y ciclo de vida
      ipc.ts                 IPC para diálogos, archivos, shell, notificaciones y ventana
      preload.ts             API expuesta mediante contextBridge
    vite.config.ts           Configuración de Vite para Electron

datos/
  base-de-datos/             Base SQLite local
  plantillas/                Plantillas DOCX cargadas
```

## Environment Variables

Los secretos y credenciales se guardan en `.env` en la raíz. Vite carga ese archivo desde `packages/web/vite.config.ts`. En el código del API se accede mediante `process.env`. En navegador solo deben exponerse variables con prefijo `VITE_`.

## Desktop UI

La aplicación de escritorio carga la misma interfaz web desde `packages/web`. El paquete `packages/desktop` contiene la ventana Electron, IPC, APIs nativas y empaquetado.

## Database

```sh
cd packages/web
bun run db:push
bun run db:generate
bun run db:migrate
```

Después de añadir o modificar columnas en `schema.ts`, ejecuta `bun run db:push` para sincronizar la base local.
