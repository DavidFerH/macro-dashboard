# Macro dashboard

Panel público de indicadores macroeconómicos de Estados Unidos. Vue 3 + TypeScript + Vite,
gráficos SVG con D3, adquisición Python y publicación estática en GitHub Pages.

## Desarrollo local

Requisitos: Node.js 24, pnpm 11.19.0 y Python 3.13.

```powershell
pnpm install --frozen-lockfile
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Crea `.env` a partir de `.env.example` **solo si aún no existe**. Introduce tu clave
FRED en `FRED_API_KEY` sin comillas. No la pegues en issues, commits, capturas o chats.
La aplicación web no lee esa clave. Para generar datos reales:

```powershell
.\.venv\Scripts\python.exe -m pipeline.build
pnpm data:validate
pnpm dev
```

Abre http://127.0.0.1:5173/macro-dashboard/macro.html. La raíz también carga el panel.
En Linux/macOS usa `.venv/bin/python` en lugar de `.venv\Scripts\python.exe`.

Sin clave puedes generar un snapshot **sintético** con
`python -m pipeline.build --demo`. Este comando sustituye el snapshot local y
activa un aviso DEMO. Nunca se utiliza como fallback en producción.

## Validación

```powershell
pnpm lint
pnpm typecheck
pnpm test
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m pipeline.build --demo --output .local/demo.json
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm preview
```

Las pruebas de interfaz usan datos sintéticos deterministas interceptados en la red,
sin modificar el snapshot real. El smoke test adicional usa el snapshot real si existe.
Se generan capturas de escritorio y móvil en `test-results/`, excluido de Git.

## Publicación

Repositorio: https://github.com/DavidFerH/macro-dashboard

Dirección prevista: https://davidferh.github.io/macro-dashboard/macro.html

1. Configura **Settings → Pages → Source: GitHub Actions**.
2. Crea el secreto de Actions `FRED_API_KEY`.
3. El workflow `Update data and publish` se ejecuta al subir a `main`, manualmente
   y a las 12:17, 16:17 y 22:17 UTC. GitHub puede retrasar ejecuciones programadas.
4. Solo se publica tras superar pruebas, validación de datos y compilación.
   El proceso rechaza snapshots DEMO para producción.

No subas `.env`, `.venv`, datos descargados ni `dist` al repositorio.
Los datos se generan durante el workflow y se publican dentro del artefacto estático.
La publicación de cualquier serie debe respetar las condiciones de su proveedor.

## Cobertura y límites

El catálogo contiene 44 gráficos. Una tarjeta existente no implica que su fuente
esté habilitada: la tabla de cobertura muestra el estado de las 81 series.
La configuración predeterminada obtiene 64 series de FRED, incluido VIX con
atribución CBOE. Diez series requieren autorización; las siete de Shiller tienen
importador automático preparado y esperan confirmar el permiso de publicación.
Los estados distinguen esas causas de errores de descarga. No se sustituyen
datos por aproximaciones silenciosas. Consulta [fuentes](docs/SOURCES.md).

Las fórmulas y diferencias respecto a la referencia se explican en
[metodología](docs/METHODOLOGY.md). La aplicación es una implementación independiente,
no una copia del código, marca o paquete de datos de JFPartners.

Consulta [operaciones](docs/OPERATIONS.md) para fallos, recuperación y secretos,
y [contribución](CONTRIBUTING.md) para trabajar en el repositorio.
