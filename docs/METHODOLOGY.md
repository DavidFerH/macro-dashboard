# Metodología · versión 1

## Alcance

Implementación independiente del comportamiento observado en
[la referencia](https://jfpartners1.github.io/panel-etfs/macro.html).
No se ha obtenido el proceso privado de construcción ni su snapshot decodificado.
La paridad numérica exacta no está certificada. Las reglas de esta versión son
explícitas, comprobables y están implementadas en `src/domain/`.

## Fechas y transformaciones

- Se conserva el periodo de observación del proveedor, no se presenta como fecha
  de publicación. En series trimestrales FRED identifica el trimestre por su primer día.
- Cambio interanual: `100 × (x[t] / x[t−12 meses] − 1)`.
- Cambio mensual absoluto: `x[t] − x[t−1 mes]`.
- Ritmo de tres meses anualizado: `100 × ((x[t]/x[t−3])^4 − 1)`.
- Las comparaciones mensuales buscan el mes exacto; no desplazan índices ante huecos.
  Las medias mensuales requieren ventanas completas. Null no significa cero.
- Ventas reales: ventas minoristas nominales / IPC desestacionalizado. Esto difiere
  de la aproximación por resta de tasas observada en la referencia.
- Los ratios entre fuentes se calculan únicamente para meses coincidentes.
  No se adelantan publicaciones ni se imputan trimestres.
- El cursor muestra el punto más próximo de cada serie junto a su propia fecha.
  Las líneas pueden reducir puntos para dibujar; los cálculos mantienen el histórico.

## Diagnósticos

Las señales favorables valen +1, neutrales 0 y desfavorables −1.

### Crecimiento

Media de ocho señales, con mínimo seis disponibles. A diferencia de un promedio
sin umbral de cobertura, este mínimo evita clasificar con una sola fuente.

| Señal                                            | Favorable | Neutral    | Desfavorable |
| ------------------------------------------------ | --------- | ---------- | ------------ |
| PIB, media 2 trimestres                          | >2,5%     | 1–2,5%     | <1%          |
| Empleo, cambio medio 3 meses                     | >150 mil  | 50–150 mil | <50 mil      |
| Paro sobre mínimo de 12 observaciones anteriores | ≤0,1 pp   | ≤0,3 pp    | >0,3 pp      |
| Solicitudes, media 4 / media 52 semanas          | <0,95     | ≤1,10      | >1,10        |
| Producción industrial interanual                 | >1%       | ≥−1%       | <−1%         |
| Ventas reales interanuales                       | >1%       | ≥−1%       | <−1%         |
| Media NY / Filadelfia                            | >10       | ≥−5        | <−5          |
| CFNAI media 3 meses                              | >0,20     | ≥−0,35     | <−0,35       |

Media ≥0,6: fuerte; ≥0,2: sólido; >−0,2: tendencia; >−0,6: débil;
resto: contracción. Los periodos de distintas fuentes pueden no coincidir:
esta es una lectura de últimas observaciones, no un backtest en tiempo real.

### Inflación

La etiqueta depende del PCE subyacente interanual: <1,5%, por debajo;
<2,5%, en objetivo; <3,5%, por encima; <5%, alta; resto, muy alta.
No se obtiene promediando señales.

Los siete chips muestran PCE, IPC, cambios de PCE a 6 y 12 meses, precios ISM,
breakeven a 5 años y salarios. Las fronteras de sus colores están en
`diagnostics.ts`; no alteran la etiqueta principal. La señal ISM necesita
manufacturas y servicios, sin aproximación por otros índices.

### Empleo, condiciones financieras y recesión

Empleo combina creación de puestos, paro respecto al mínimo, solicitudes,
vacantes/desempleados y Sahm; mínimo 4 de 5 señales. Media ≥0,4: saludable;
≥0: enfriándose; >−0,5: deteriorándose; resto: débil. Sahm ≥0,50 tiene prioridad.

Condiciones financieras requiere HY, NFCI, VIX y TIPS 10 años. Media ≥0,5:
holgadas; ≥0: normales; >−0,5: tensas; resto: muy tensas. No se publica un
diagnóstico incompleto porque faltarían dos dimensiones importantes.

Recesión cuenta alarmas en Sahm, CFNAI, curva 10a−3m, empleo y solicitudes.
3 alarmas: muy elevado; 2: elevado; 1: moderado; ninguna: bajo, con aviso si
hay señales intermedias. Sahm ≥0,50 prima sobre el recuento.
**No son probabilidades, pronósticos ni recomendaciones de inversión.**

## Valoración

- Percentil = observaciones históricas estrictamente menores / observaciones.
  DY, ECY, Fed model, prima por plazo e IG invierten el percentil.
- Se requieren al menos 24 observaciones para cada percentil. La selección
  1881/1990 recorta el historial, no fabrica cobertura anterior al inicio de la serie.
- Agregado = media de 10 percentiles: CAPE, PER, DY, ECY, Fed model, regla del 20,
  Buffett, Q proxy, acciones de hogares y beneficios/PIB. Sin los diez no hay agregado.
  Prima por plazo e IG se muestran como contexto; TR CAPE solo en su gráfico.
- Bandas del agregado: <25 barata, <45 razonable, <65 exigente, <85 cara, resto muy cara.
- Buffett utiliza acciones de sociedades no financieras en millones de USD
  (`NCBEILQ027S`) y PIB en miles de millones: `NCBEILQ027S / GDP × 0,1`.
  No representa exactamente la capitalización de todo el mercado.
- Q proxy: `NCBEILQ027S / TNWMVBSNNCB`, ambas en millones. No incluye la
  deuda como la definición completa de Q de Tobin.
- Beneficios/PIB: `CPATAX / GDP × 100`, ambos anualizados en miles de millones.
- CAPE: dato importado cuando existe; alternativamente precio real / media móvil
  de 120 meses de beneficio real. PER: precio / beneficio. DY y EY se expresan en %.
- ECY = 100/CAPE − (bono histórico 10 años − inflación anualizada de los diez años
  anteriores). No se sustituye automáticamente por el rendimiento TIPS.
- Regresión: retorno real total anualizado de los siguientes 120 meses sobre
  `ln(CAPE)`, con más de 200 pares. Reinversión mensual aproximada de dividendo
  anual / 12. Se usa todo el historial, independientemente de la base de percentiles.
  Los retornos se solapan y la dispersión no es un intervalo predictivo calibrado.

Los indicadores trimestrales no se extrapolan con el S&P diario en esta versión.
La referencia sí muestra estimaciones actualizadas en algunos titulares. Aquí el
valor y la fecha corresponden a la misma observación, sin actualización artificial.

## Agenda

FRED aporta fechas para las publicaciones seleccionadas. El calendario oficial
de la Fed aporta el día final de reuniones FOMC, incluidos cruces de mes.
La ventana son 14 días desde hoy en Madrid. No se inventan horas; si el proveedor
no facilita un instante verificable, se indica expresamente.
