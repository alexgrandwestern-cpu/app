# LicenciaPro Chicago 🍷

**Creado por Alex Zavala.** Plataforma web para encontrar restaurantes y negocios de comida en Chicago que **todavía no tienen licencia de licor**: los clientes potenciales del servicio de gestión de licencias de Alex.

## Qué hace

- **Descarga automática** (al arrancar y cada 24 h) de todas las licencias activas de la Ciudad de Chicago (~53,000 registros, dataset `uupf-x98q`) y de las inspecciones sanitarias de los últimos 3 años (`4ijn-s7e5`).
- **Detección de prospectos**: agrupa las licencias por cuenta + sitio. Un prospecto es un negocio con *Retail Food Establishment* sin ninguna licencia de licor (Incidental Activity, Tavern, Package Goods, Caterer's Liquor, Late Hour, Special Event) en la misma cuenta/sitio ni en la misma dirección.
- **Enriquecimiento**: segmento (comedor, café, panadería/deli, para llevar, tienda), tipo de cocina por nombre, cadenas e instituciones marcadas, patio y entretenimiento, antigüedad, última inspección y densidad de licor en el área comunitaria.
- **Puntaje 0–100** con niveles A/B/C y razones explicadas, más la licencia recomendada.
- **Panel**: KPIs, segmentos, cocinas, mejores zonas, tabla con filtros (área, ZIP, ward, segmento, cocina, puntaje, nuevos, patio), mapa interactivo, ficha con guion de llamada, pipeline (en el navegador) y exportación a CSV.
- **Copiloto IA**: con `ANTHROPIC_API_KEY` usa Claude con herramientas sobre los datos reales; sin clave, responde con un motor local.
- **Landing page** de marketing y **login** protegido.

## Alex Solutions, Inc: otros servicios

- **`/asesoria-layout`**: guía interactiva de layout para tiendas de Fine Wine & Spirits (plano de 10 zonas, estantería por niveles, calculadora de espacio vs. ventas, autodiagnóstico, plan de acción y solicitud de asesoría). Viene de la sesión anterior (`vinos-licores.html`).
- **`/contacto`**: tarjeta de contacto con botones de llamar, WhatsApp y correo, QR al enlace, QR vCard y descarga `.vcf` (`/contacto.vcf`). Los datos se configuran con variables de entorno.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `ADMIN_USER` | Usuario de acceso (por defecto `alex`) |
| `ADMIN_PASSWORD` | Contraseña de acceso |
| `SESSION_SECRET` | Secreto para firmar la sesión |
| `ANTHROPIC_API_KEY` | (Opcional) activa el asistente con Claude |
| `REFRESH_HOURS` | Cada cuántas horas se vuelven a descargar los datos (24) |
| `CONTACT_NAME`, `CONTACT_TITLE`, `CONTACT_COMPANY` | Tarjeta de contacto (por defecto Alex Zavala · Alex Solutions, Inc) |
| `CONTACT_PHONE`, `CONTACT_WHATSAPP`, `CONTACT_EMAIL` | Teléfono, WhatsApp (solo dígitos con código de país) y correo |
| `CONTACT_CITY`, `CONTACT_WEBSITE`, `CONTACT_INSTAGRAM`, `CONTACT_LINKEDIN` | Opcionales |

## Correr localmente

```bash
npm install
ADMIN_PASSWORD=mi-clave npm start
# http://localhost:3000
```

## Deploy en Render

El archivo `render.yaml` define el servicio web (Node). Cada push a `main` vuelve a publicar.

> Los datos provienen del [Portal de Datos de Chicago](https://data.cityofchicago.org). La información sobre trámites es orientativa: confirma los requisitos vigentes con BACP.
