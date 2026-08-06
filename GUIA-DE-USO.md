# Registros SCG — Guía para poner todo a funcionar

Esta guía te lleva paso a paso, desde una computadora nueva hasta la aplicación
corriendo (versión web y versión de escritorio), y te explica dónde se guardan
tus datos y plantillas.

---

## 1. Requisitos (instalar una sola vez)

Necesitas **Bun** (motor que ejecuta todo el proyecto). Es lo único indispensable.

### Windows
1. Abre **PowerShell**.
2. Pega y ejecuta:
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```
3. Cierra y vuelve a abrir PowerShell para que reconozca el comando.
4. Verifica con:
   ```powershell
   bun --version
   ```
   Si muestra un número (ej. `1.x.x`), quedó instalado.

### macOS / Linux
1. Abre la **Terminal**.
2. Pega y ejecuta:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
3. Cierra y vuelve a abrir la Terminal.
4. Verifica con:
   ```bash
   bun --version
   ```

---

## 2. Poner el proyecto en tu computadora

Copia la carpeta completa del proyecto (`registros-scg`) a donde quieras tenerla,
por ejemplo en `Documentos`. **Copia la carpeta entera**, incluyendo la subcarpeta
`datos/` (ahí vive tu base de datos y tus plantillas).

Luego, abre una terminal **dentro de esa carpeta**:

- **Windows:** abre la carpeta en el Explorador → clic derecho → "Abrir en Terminal".
- **macOS:** clic derecho en la carpeta → "Nuevo terminal en la carpeta".

Para confirmar que estás en el lugar correcto, ejecuta `ls` (o `dir` en Windows):
deberías ver carpetas como `packages`, `datos` y el archivo `package.json`.

---

## 3. Instalar las dependencias (una sola vez)

Dentro de la carpeta del proyecto, ejecuta:

```bash
bun install
```

Esto descarga todo lo que la aplicación necesita. Puede tardar un par de minutos
la primera vez.

---

## 4. Preparar la base de datos local (una sola vez)

La aplicación guarda todo en un archivo local. Para crearlo/actualizarlo, ejecuta:

```bash
cd packages/web
bun run db:push
cd ../..
```

Cuando termine, verás el archivo en:

```
datos/base-de-datos/registros.db
```

> Ese archivo **es tu base de datos**. Si haces una copia de seguridad, copia
> toda la carpeta `datos/`.

---

## 5. Iniciar la aplicación web

Desde la carpeta del proyecto:

```bash
bun run dev
```

Cuando veas el mensaje `VITE ready`, abre tu navegador en:

```
http://localhost:4200
```

Ya puedes usar la aplicación: crear registros por mes, editarlos, imprimirlos, etc.

> **Deja esa terminal abierta** mientras uses la app. Para detenerla, presiona
> `Ctrl + C`.

---

## 6. (Opcional) Iniciar la versión de escritorio

La versión de escritorio (ventana propia, tipo programa instalado) **necesita que
la web del paso 5 siga corriendo**.

1. Deja abierta la terminal del paso 5 (con `bun run dev` corriendo).
2. Abre una **segunda** terminal en la misma carpeta del proyecto.
3. Ejecuta:
   ```bash
   bun run dev:desktop
   ```
4. Se abrirá una ventana de escritorio con la aplicación.

> La ventana de escritorio muestra exactamente la misma app y usa la misma base de
> datos local.

---

## 7. Cargar tus plantillas de impresión (.docx)

1. Con la app abierta, entra a la sección **Plantillas** (menú lateral).
2. Presiona **Subir plantilla**, elige tu archivo `.docx` y asígnale la regla que
   corresponda (Convocatoria, Extemporáneo, o la combinación de Carpeta/Sesión virtual).
3. Listo: al presionar **Imprimir** en un registro, la app rellena esa plantilla con
   los datos y descarga el `.docx` ya completado.

Cómo preparar tu propia plantilla `.docx` (qué etiquetas escribir dentro del Word):
consulta la sección **Ayuda** dentro de la aplicación, que trae la tabla de reglas
y la lista completa de etiquetas disponibles.

Las plantillas subidas se guardan en:

```
datos/plantillas/
```

Y los archivos generados al imprimir salen en:

```
datos/impresiones/
```

---

## Uso diario (resumen rápido)

Después de la primera instalación, para usar la app solo necesitas:

1. Abrir una terminal en la carpeta del proyecto.
2. Ejecutar `bun run dev`.
3. Abrir `http://localhost:4200` en el navegador
   (o ejecutar `bun run dev:desktop` en otra terminal para la ventana de escritorio).

---

## Dónde vive tu información

| Carpeta | Contenido |
|---|---|
| `datos/base-de-datos/registros.db` | Tu base de datos (todos los registros) |
| `datos/plantillas/` | Tus plantillas `.docx` |
| `datos/impresiones/` | Archivos `.docx` generados al imprimir |

**Copia de seguridad:** copia la carpeta `datos/` completa a un lugar seguro
(USB, nube, etc.). Con eso respaldas todo.

---

## Problemas comunes

- **"bun no se reconoce como comando"** → Cierra y vuelve a abrir la terminal
  después de instalar Bun (paso 1). Si sigue, reinicia la computadora.
- **La página no abre en el navegador** → Asegúrate de que la terminal del paso 5
  siga abierta y muestre `VITE ready`. Usa exactamente `http://localhost:4200`.
- **El puerto 4200 está ocupado** → Cierra otras terminales que tengan la app
  corriendo, o reinicia la computadora, y vuelve a ejecutar `bun run dev`.
- **La ventana de escritorio sale en blanco** → Primero inicia la web (paso 5) y
  espera a que diga `VITE ready`; luego ejecuta `bun run dev:desktop`.
