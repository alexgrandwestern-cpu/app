# Alex Solutions, Inc 🍷

**Creado por Alex Zavala.** Plataforma web para el negocio de licencias de licor y layout en Chicago:

- **Prospectos:** restaurantes y tiendas de Chicago que todavía no tienen licencia de licor, con puntaje y razones.
- **Marketplace de expertos:** modelo tipo Airbnb, con reservas, reseñas verificadas y comisión.
- **Inteligencia comercial:** radar de productos nuevos (TTB COLA), red de distribuidores de Illinois, mapa de conexiones y buscador de productos del mercado.
- **Asesoría de layout:** guía interactiva para tiendas de Fine Wine & Spirits.
- **Bilingüe:** español e inglés en todas las páginas.

Producción: https://licenciapro-chicago.onrender.com

## Funciones

| Área | Ruta | Acceso |
|---|---|---|
| Página principal | `/` | Pública |
| Guía de layout | `/asesoria-layout` | Pública |
| Marketplace (buscar, perfil, reservar, unirse) | `/expertos`, `/experto/:slug`, `/unete` | Pública |
| Seguimiento de reserva | `/reserva/:token` | Enlace privado del cliente |
| Panel del experto | `/experto-panel/:token` | Enlace privado del experto |
| Tarjeta de contacto y QR | `/contacto`, `/contacto.vcf`, `/qr` | Pública |
| Privacidad y términos | `/privacidad`, `/terminos` | Pública |
| Panel de Alex | `/app` | Usuario y contraseña |

**Pestañas del panel:** Resumen, Prospectos, Mapa, Pipeline, Marketplace, Productos, Radar de productos y Distribuidores, más el Copiloto IA.

**Fuentes de datos (se actualizan solas):**
- Ciudad de Chicago: licencias activas (`uupf-x98q`) e inspecciones (`4ijn-s7e5`), cada 24 h.
- TTB: listas de mayoristas e importadores con permiso federal y etiquetas aprobadas (COLA), cada 24 h. Los distribuidores se ubican en el mapa con el geocodificador del Censo de EE. UU.
- `certs/` incluye el certificado intermedio de Entrust que `ttbonline.gov` no envía. Se carga con `NODE_EXTRA_CA_CERTS`.

## Instalar y correr localmente

Requisitos: Node.js 20 o superior. Postgres es opcional; sin él, los datos se guardan en `data/`.

```bash
npm install
cp .env.example .env      # y edita los valores
node --env-file=.env server.js
# http://localhost:3000
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `ADMIN_USER` | No (por defecto `alex`) | Usuario del panel |
| `ADMIN_PASSWORD` | **Sí** | Contraseña del panel. Sin ella el acceso queda bloqueado |
| `SESSION_SECRET` | **Sí** | Secreto largo y aleatorio para firmar la sesión |
| `DATABASE_URL` | Recomendada | Postgres para marketplace, directorio, catálogo y radar |
| `ANTHROPIC_API_KEY` | No | Activa el Copiloto con IA y la investigación de distribuidores |
| `NODE_EXTRA_CA_CERTS` | Sí en producción | `certs/entrust-ov-tls-issuing-rsa-ca2.pem` |
| `NODE_ENV` | Sí en producción | `production` |
| `PLATFORM_FEE_PCT` | No (15) | Comisión del marketplace |
| `REFRESH_HOURS` | No (24) | Frecuencia de actualización de datos de Chicago |
| `CONTACT_*` | No | Datos de la tarjeta de contacto (`NAME`, `TITLE`, `COMPANY`, `PHONE`, `WHATSAPP`, `EMAIL`, `CITY`, `WEBSITE`, `INSTAGRAM`, `LINKEDIN`) |

Ninguna clave va en el código: todo se configura en Render → Environment, o en `.env` en local (`.env` está en `.gitignore`).

## Seguridad

- **Content Security Policy** estricta: sin scripts inline, solo scripts propios y de cdnjs. También HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y redirección a HTTPS.
- **Sin CORS:** solo el propio dominio puede llamar a la API desde un navegador.
- **Sesión:** cookie `HttpOnly`, `Secure` y `SameSite=Lax`, firmada con HMAC. Comparación de contraseña en tiempo constante.
- **Rate limiting por IP:**

  | Ruta | Límite |
  |---|---|
  | Login | 10 intentos / 15 min |
  | API general | 600 / 10 min |
  | Asistente | 30 / 10 min |
  | Investigación con IA | 20 / h |
  | Búsqueda de productos | 60 / 10 min |
  | Reservas | 10 / h |
  | Altas de expertos | 5 / h |

- **Validación en el servidor:** longitudes máximas en todos los campos, cuerpo JSON de 100 KB como máximo, parámetros de 200 caracteres como máximo y máximo de registros por consulta. No hay subida de archivos.
- **Base de datos:** solo consultas parametrizadas (`pg`).
- **Permisos:** panel y API internas exigen sesión. Expertos y clientes acceden solo a sus propios datos mediante enlaces privados aleatorios de 192 bits.
- **XSS:** todo texto dinámico se escapa antes de insertarse en la página.
- **Dependencias:** versiones fijadas. Cada build ejecuta `npm audit --omit=dev` y el resultado aparece en los logs de build de Render.

## Errores, logs y respaldos

- Página 404 propia y página 500 sin detalles técnicos. El error real se registra en los logs de Render con un número de referencia.
- **Logs:** Render → servicio → *Logs*.
- **Respaldo:** en el panel, pestaña Marketplace → **⬇ Respaldo de la base de datos**. Descarga un JSON con todas las colecciones. Contiene enlaces privados de expertos y clientes: guárdalo en un lugar seguro.
- **Importante:** la base de datos gratis de Render **no tiene respaldos automáticos y vence el 24/12/2026**. Pásala a un plan de pago antes de esa fecha (incluye respaldos diarios).

## Deploy

`render.yaml` define el servicio. Cada push a `main` vuelve a publicar automáticamente.

> Información orientativa. Los requisitos de licencias los fijan BACP (Chicago), ILCC (Illinois) y TTB.
