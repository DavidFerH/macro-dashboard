# Operaciones

## Actualización y fallos

El proceso consulta FRED con un máximo de tres peticiones concurrentes y tres
intentos por petición ante errores transitorios. Usa timeout de 30 segundos.
La clave solo se carga en Python; los errores omiten URLs y cuerpos que podrían
contenerla.

Cada ejecución vuelve a descargar el histórico publicado, por lo que recoge las
revisiones del proveedor. No constituye una base de vintages para backtesting.
La escritura del snapshot es atómica: archivo temporal, validación y reemplazo.

Si una fuente falla, solo se reutiliza una serie de un snapshot real previamente
validado. Se conserva su fecha original de adquisición y se marca stale.
Nunca se mezclan fixtures de prueba con datos reales.

Sin Treasury 10 años, PCE subyacente, desempleo, empleo no agrícola, solicitudes
o PIB no se publica. Tampoco se publica si ninguna fuente se ha actualizado.
La web anterior permanece disponible cuando falla el workflow.

La web advierte si la descarga supera 36 horas. Un dato trimestral de hace meses
no implica por sí solo un fallo de adquisición. Consulta la tabla de cobertura.
Los workflows fallidos aparecen en Actions; activa sus notificaciones en tu cuenta.

## Recuperación

Cada publicación conserva `validated-release` (dist completo, incluido snapshot)
durante 90 días, sujeto a las políticas de retención del repositorio.

Para revertir, ejecuta `Restore validated release` indicando el run ID de una
publicación anterior válida de este mismo repositorio. El workflow comprueba su
procedencia, recupera el artefacto y lo publica sin volver a consultar proveedores.

El fallback ordinario descarga el snapshot del último sitio publicado. Si este
no existe o no cumple el contrato, la ejecución necesita descargar todas las
series críticas. No se utiliza la caché de dependencias como backup de datos.

La retención limitada no es un archivo histórico permanente. Para conservar una
publicación más tiempo, descarga su artefacto antes de que expire.

## Secretos

`.env` y sus variantes están excluidos de Git, salvo `.env.example`.
GitHub Actions usa el secreto de repositorio `FRED_API_KEY`; no hace falta un PAT
para Pages. La autorización del job de publicación usa `pages: write` y
`id-token: write`. Las PR no reciben claves de adquisición.

Si una clave se expone, revócala en FRED, reemplázala en el archivo local y en
GitHub Secrets y ejecuta una actualización manual. No publiques una clave en
un commit aunque pretendas borrarla después.

## Cambios de metodología

Modifica fórmulas exclusivamente en `src/domain`, añade casos de frontera y
actualiza METHODOLOGY.md. Para cambios incompatibles del contrato, incrementa
schemaVersion y adapta ambos validadores antes del despliegue.
