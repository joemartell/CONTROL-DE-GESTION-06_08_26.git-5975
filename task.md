# Registros SCG — progreso

## Hecho
- app_init, DB local SQLite en datos/base-de-datos/registros.db
- schema: records, options, templates + db:push OK
- lib: storage, records (reglas + template data), docx
- API: routes/records, routes/options, routes/templates + plain HTTP upload/print en index.ts
- styles: paleta guinda + fuentes Fraunces/Inter Tight

## Pendiente
- queries: records, options, templates
- components: layout(sidebar meses), combobox creable, campos fecha/hora, record form, record card, ver modal, print modal
- pages: index (meses + registros), plantillas, ayuda/guia
- app.tsx rutas + provider
- build + run dev 4200 + verificar
- desktop 4400 (Electron) verificar
- README/guía de instalación local + etiquetas .docx
- deliver

## Reglas de plantilla
- asunto=Convocatoria -> convocatoria
- asunto=Extemporáneo -> extemporaneo
- Carpeta=No & Virtual=Sí -> no_carpeta_si_virtual
- Carpeta=Sí & Virtual=No -> si_carpeta_no_virtual
- Carpeta=No & Virtual=No -> ambos_no
- si no aplica / slot vacío -> preguntar en pantalla

## Etiquetas .docx (sintaxis {etiqueta})
consecutivo, mes, anio, fecha_recepcion_oficialia, hora_recepcion, fecha_hora_recepcion_dcc,
volante_oficialia, numero_oficio_ente, signado_por, cargo_puesto, asunto, ente, organo_colegiado,
fecha_hora_sesion, tipo_sesion, carpeta_trabajo, sesion_virtual_presencial, sesion_virtual_detalle,
consecutivo_folio, persona_contralora, fecha_impresion

## Verificación final (completada)
- DB limpia: records=0, options=0, templates=0 (datos de prueba eliminados).
- `bun run build` (web): PASA (tsc + vite). `tsc --noEmit`: PASA.
- konsistent: 1 error preexistente en packages/mobile (plantilla base, paquete no entregado). oxlint: crash de binario en sandbox (bug de entorno, no del código).
- Web UI verificada en navegador: inicio (vista por meses), formulario (todos los campos, comboboxes creables, toggles Sí/No, Folio), alta de registro round-trip OK, tarjeta con 4 acciones (ver/editar/imprimir/eliminar), página Plantillas (5 slots por regla), página Ayuda (tabla de reglas + guía .docx).
- Botón "Add" -> "Agregar" (español).
- Escritorio Electron: binario descargado manualmente (v30.5.1), arranca estable (6 procs) cargando la web desde localhost:4200. Añadido switch main.ts gated por ELECTRON_DISABLE_GPU=1 (solo headless; producción intacta).
- Servidores activos al entregar: web tmux `dev` :4200, escritorio tmux `desktop` (vite :5173 + electron).
