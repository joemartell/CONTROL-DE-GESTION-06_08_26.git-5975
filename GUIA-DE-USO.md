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

### 7.1 Una plantilla distinta por FIRMA (LMD, MDCT, MAPG, SYOM, ACP)

Además de la plantilla general de cada regla, puedes cargar una plantilla **exclusiva
para una firma**. Así, dos registros con el mismo asunto imprimen formatos distintos
según quién firma.

Cómo hacerlo:

1. Entra a **Plantillas**.
2. Ubica la regla que te interesa (por ejemplo *Convocatoria*) y abre el acordeón
   **Por firma**.
3. En la casilla de la firma (LMD, MDCT, MAPG, SYOM o ACP) presiona **Asignar** y
   sube el `.docx` correspondiente. También puedes elegir la firma directamente en el
   selector al momento de subir la plantilla.
4. El contador (badge) junto a **Por firma** te indica cuántas firmas ya tienen
   plantilla propia en esa regla.

Cómo decide la app qué plantilla usar al presionar **Imprimir**:

1. Si existe una plantilla para **esa regla + esa firma**, usa esa.
   El diálogo muestra: *"Plantilla de la firma MDCT"*.
2. Si no existe, usa la **plantilla general de la regla**.
   El diálogo avisa: *"La firma LMD no tiene plantilla propia: se usa la general de la regla."*
3. Si tampoco hay plantilla general, la app te **pregunta en pantalla** cuál usar de
   entre las plantillas cargadas.

Notas:

- Cada pareja (regla + firma) admite **una sola** plantilla: si subes otra al mismo
  espacio, reemplaza la anterior.
- La firma se escribe con o sin acentos y en cualquier combinación de mayúsculas;
  la app la normaliza sola (`mdct` → `MDCT`).
- La plantilla sin firma es la **general** de la regla y sirve como respaldo para
  todas las firmas que no tengan la suya.

---

## Uso diario (resumen rápido)

Después de la primera instalación, para usar la app solo necesitas:

1. Abrir una terminal en la carpeta del proyecto.
2. Ejecutar `bun run dev`.
3. Abrir `http://localhost:4200` en el navegador
   (o ejecutar `bun run dev:desktop` en otra terminal para la ventana de escritorio).

---

## 8. Usar la app entre varios equipos de la misma red

Idea clave: **un solo equipo hace de servidor** (ahí vive la base de datos) y
los demás simplemente entran desde su navegador. Así todos ven y guardan en la
misma información en tiempo real. No hay que instalar nada en los otros equipos.

### En el equipo servidor (solo uno)

Elige la computadora que esté siempre encendida durante el horario de trabajo.
Ahí instala el proyecto (pasos 1 a 4) y luego:

**Windows (lo más fácil):** doble clic en `Iniciar-Servidor.bat`.

**Cualquier sistema, desde terminal:**

```bash
bun run servidor
```

Verás algo así:

```
==========================================================
  REGISTROS SCG — Servidor de red iniciado
==========================================================
  En este equipo:      http://localhost:4200
  Desde los otros equipos de la misma red:
      ->  http://192.168.1.45:4200
```

Esa dirección `http://192.168.1.45:4200` es la que usarán los demás.
**Deja esa ventana abierta**; si la cierras, se apaga el servidor para todos.

> `bun run servidor` compila la app antes de arrancar (tarda ~1 min).
> Si no cambiaste nada del código, puedes usar `bun run servidor:rapido`.

### Permitir el paso en el Firewall (solo la primera vez, en el servidor)

Windows bloquea las conexiones entrantes por defecto. Dos opciones:

- Clic derecho en `Abrir-Puerto-Firewall.bat` → **Ejecutar como administrador**.
- O bien, la primera vez que arranque el servidor, Windows mostrará un aviso:
  marca **Redes privadas** y pulsa **Permitir acceso**.

### En los demás equipos

Solo abren el navegador (Chrome, Edge, Firefox) y escriben la dirección del
servidor, por ejemplo:

```
http://192.168.1.45:4200
```

Listo. Pueden crear, editar, eliminar e imprimir; todo se guarda en la base del
servidor. La pantalla se actualiza sola cada 10 segundos, así que si un
compañero agrega un registro, aparece en las demás pantallas sin recargar.

**Truco:** en cada equipo, guarda esa dirección como favorito o crea un acceso
directo en el escritorio para no teclearla cada día.

### Cosas importantes de este modo

- **La base de datos vive solo en el equipo servidor**
  (`datos/base-de-datos/registros.db`). Los respaldos se hacen **ahí**.
- **Las plantillas también viven en el servidor.** Se suben una sola vez desde
  cualquier equipo en la pantalla "Plantillas" y quedan disponibles para todos.
- **Al imprimir**, el `.docx` se descarga en el equipo que apretó "Imprimir",
  como cualquier descarga del navegador.
- **La IP puede cambiar** si el servidor se reinicia. Si un día los demás
  equipos no entran, revisa la ventana del servidor: ahí sale la dirección
  actual. Para que nunca cambie, pídele a tu área de sistemas una **IP fija**
  para ese equipo.
- **Todos deben estar en la misma red** (mismo WiFi o mismo cableado). No
  funciona desde fuera de la oficina a menos que sistemas configure una VPN.
- La escritura simultánea está resuelta: la base usa modo WAL y varios equipos
  pueden guardar al mismo tiempo sin bloquearse ni perder registros.

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
- **Los otros equipos no abren la página del servidor** → En orden:
  1. Verifica que la ventana del servidor siga abierta en el equipo host.
  2. Comprueba que usan la IP que muestra esa ventana (no `localhost`).
  3. Ejecuta `Abrir-Puerto-Firewall.bat` como administrador en el servidor.
  4. Desde otro equipo prueba `ping 192.168.1.45` (con la IP real). Si no
     responde, no están en la misma red.
- **Un compañero no ve un registro nuevo** → Espera 10 segundos o recarga con
  F5. Si sigue sin verlo, probablemente esté entrando a su propia copia local
  (`localhost`) y no a la IP del servidor.
