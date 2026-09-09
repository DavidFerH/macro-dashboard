# Fuentes y permisos

El registro ejecutable es `contracts/sources.json`. Las series descargadas conservan
su identificador, frecuencia, URL y fecha de adquisición. La tabla al pie del panel
permite consultar su procedencia. No se descarga ningún dato desde la web de JFPartners.

| Grupo                                           | Integración                         | Estado inicial                               |
| ----------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| Tipos, Treasury, balances, cuentas financieras  | FRED / Federal Reserve              | Habilitado                                   |
| Empleo, desempleo, salarios, IPC                | FRED / BLS                          | Habilitado                                   |
| PIB, beneficios, PCE                            | FRED / BEA                          | Habilitado                                   |
| Vivienda, permisos y ventas                     | FRED / Census Bureau                | Habilitado                                   |
| Energía                                         | FRED / EIA                          | Habilitado                                   |
| Hipotecas                                       | FRED / Freddie Mac                  | Habilitado; conservar atribución             |
| Encuestas regionales, NFCI, CFNAI, expectativas | FRED / bancos de la Reserva Federal | Habilitado                                   |
| GDPNow                                          | FRED / Atlanta Fed                  | Habilitado                                   |
| ISM manufacturas, servicios, pedidos y precios  | ISM                                 | No habilitado                                |
| VIX, S&P 500, Case-Shiller                      | Proveedores de índices, vía FRED    | Pendiente de revisión de derechos            |
| Crédito HY, IG, BBB                             | ICE, vía FRED                       | No habilitado para redistribución automática |
| P, D, E, CPI, CAPE, TR CAPE, bono histórico     | Robert Shiller                      | Importación explícita de archivo autorizado  |
| Agenda de estadísticas                          | API de calendario FRED              | Habilitado                                   |
| Reuniones FOMC                                  | Federal Reserve, calendario oficial | Habilitado                                   |

Acceso gratuito no equivale automáticamente a permiso para redistribuir todo un
histórico en una web pública. Antes de habilitar una serie restringida, documenta
las condiciones, atribución y URL del proveedor. No contrates servicios desde el
workflow y no sustituyas un índice por un proxy sin cambiar su etiqueta y metodología.

Referencias oficiales:

- [Observaciones FRED](https://fred.stlouisfed.org/docs/api/fred/series_observations.html)
- [Agenda FRED](https://fred.stlouisfed.org/docs/api/fred/releases_dates.html)
- [Condiciones y categorías de uso FRED](https://fred.stlouisfed.org/legal/)
- [Calendario FOMC](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm)
- [Datos de Robert Shiller](https://www.econ.yale.edu/~shiller/data.htm)

## Archivo Shiller opcional

`SHILLER_FILE` apunta a un archivo local .xls o .xlsx que tienes autorización para
utilizar. El importador acepta una hoja Data (o primera hoja) con una fila que
contenga Date, P y CPI. Reconoce también D, E, GS10, CAPE y TR_CAPE. Las fechas
numéricas usan YYYY.MM, por ejemplo 2024.10 para octubre.

El lector rechaza diseños desconocidos y no asume posiciones de columnas.
Es posible que un workbook original con encabezados multinivel necesite
normalización antes de importarlo. No copies manualmente datos inventados para
completar columnas. El archivo nunca se sube a Git.

El despliegue automático actual usa FRED y el calendario de la Fed. No incorpora
un archivo Shiller local: antes de publicarlo habría que añadir su suministro
autorizado al workflow. La aplicación y el motor están preparados para recibirlo.
