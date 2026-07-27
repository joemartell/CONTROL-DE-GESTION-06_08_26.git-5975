# Registros SCG — Sistema de Diseño

Aplicación local de gestión de registros mensuales de oficialía de partes. Inspirada en las capturas del usuario: barra lateral guinda/vino con la lista de meses, área de contenido clara con tarjetas de registro.

## Marca / Tono
Institucional, sobrio, gubernamental. Legible, denso pero ordenado. Español (México).

## Color
- `--wine` #6B1229 (guinda institucional) — barra lateral, encabezados
- `--wine-700` #7E1A34 — hover barra lateral
- `--wine-900` #4E0B1D — texto sobre guinda profundo
- `--gold` #C9A227 — acento (activo, detalles)
- `--bg` #F4F1EE — fondo de la app (hueso cálido)
- `--surface` #FFFFFF — tarjetas y paneles
- `--border` #E4DED8 — bordes sutiles
- `--ink` #24201E — texto principal
- `--muted` #7A726C — texto secundario
- `--green` #2F7D4F / `--red` #B23A3A — estados Sí/No, eliminar
Accento se usa para el mes activo y acciones primarias, no como decoración.

## Tipografía
- Display/Encabezados: **Fraunces** (serif institucional, peso 600).
- Cuerpo/UI: **Inter Tight** (legible, compacta) — evitar Inter estándar.
- Jerarquía por tamaño/peso, interlineado generoso en formularios.

## Layout
- Barra lateral fija 240px guinda con logo/título arriba y lista de meses (Enero→Diciembre); mes activo resaltado con barra dorada.
- Encabezado de sección: nombre del mes + año + botón **Add** (primario guinda).
- Registros como tarjetas apiladas: consecutivo grande, asunto, ente, fecha; fila de acciones: **Ver** (desplegar vista completa), **Editar**, **Imprimir**, **Eliminar**.
- Formulario en modal/side-panel amplio, agrupado en secciones (Recepción, Oficio, Sesión, Folio).

## Componentes
- Combobox creable ("Escribe o selecciona…") con sugerencias de valores previos.
- Casillas Sí/No (segmented) para Carpeta de trabajo y Sesión virtual/presencial; "Sí" habilita un campo de texto contiguo.
- Selectores de fecha (calendario), hora (reloj) y fecha+hora combinados.
- Modal de impresión que elige plantilla por reglas o pregunta cuál usar.

## Motion
Entrada escalonada suave de tarjetas al cambiar de mes; transiciones de 150–200ms. Sobrio, sin exceso.

## Anti-patrones
Nada de degradados morados, ni tarjetas genéricas redondeadas sin jerarquía, ni Inter/Roboto por defecto.
