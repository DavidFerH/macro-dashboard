# Fuentes y permisos

El registro ejecutable es `contracts/sources.json`. La adquisición conserva
identificador, frecuencia, URL, atribución y fecha de descarga. No se obtiene
ningún dato desde JFPartners ni se sustituyen índices por aproximaciones silenciosas.

## Revisión del 10 de septiembre de 2026

| Grupo | Estado público | Motivo / evidencia |
| --- | --- | --- |
| 63 series macroeconómicas ya integradas | Habilitadas vía FRED | Sin cambios en esta revisión |
| VIX (`VIXCLS`) | Habilitado; atribución CBOE vía FRED | [Ficha: Citation Required](https://fred.stlouisfed.org/series/VIXCLS), [categorías FRED](https://fred.stlouisfed.org/legal/) |
| Case-Shiller vivienda (`CSUSHPINSA`) | Requiere autorización | [Ficha: Pre-Approval Required](https://fred.stlouisfed.org/series/CSUSHPINSA) |
| S&P 500 (`SP500`) | Requiere autorización | [Notas de S&P en FRED](https://fred.stlouisfed.org/series/SP500) |
| Crédito HY, IG y BBB | Requieren autorización de ICE | [HY](https://fred.stlouisfed.org/series/BAMLH0A0HYM2), [IG](https://fred.stlouisfed.org/series/BAMLC0A0CM), [BBB](https://fred.stlouisfed.org/series/BAMLC0A4CBBB) restringen publicación y distribución; histórico FRED limitado a tres años desde abril de 2026 |
| Cinco índices ISM | Requieren autorización; adaptador pendiente | [Aviso oficial ISM](https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/pmi/august/) |
| Siete series Shiller | Integración completa; permiso por confirmar | [Archivo del editor](https://shillerdata.com/); disponibilidad de descarga no acredita por sí sola redistribución pública |
| Agenda FRED y FOMC | Habilitada | Sin cambios |

La configuración predeterminada obtiene **64 de 81 series**. Las 17 restantes no
son errores de red: 10 requieren autorización y 7 esperan confirmar el permiso
Shiller. Esta revisión no certifica de nuevo las condiciones de las 63 series
preexistentes ni constituye asesoramiento jurídico.

No basta con esperar otra actualización, configurar otra clave FRED o cambiar
`enabled` indiscriminadamente. No se contratan servicios ni se solicitan permisos
a terceros automáticamente. Si se elige otro indicador, debe aprobarse y
documentarse el cambio de nombre y metodología.

## Integración Shiller

El adaptador descubre el enlace `ie_data.xls` o `ie_data.xlsx` en
https://shillerdata.com/; no fija un identificador de descarga que pueda caducar.
Solo acepta HTTPS, el dominio del editor y su CDN `img1.wsimg.com`, sin
redirecciones, con timeout, tamaño máximo y reintentos acotados.

Reconoce los encabezados multinivel originales, `Rate GS10`, `TR CAPE`,
fechas YYYY.MM (incluido octubre), vacíos y NA. No interpreta NA como cero.
Conserva las notas del proveedor sobre estimaciones; algunas observaciones
recientes son provisionales. No inventa observaciones anteriores al inicio de CAPE.

Para habilitar la actualización pública:

1. Obtener y conservar evidencia de permiso para el uso previsto. Revisar si
   cubre publicación del histórico, cálculos derivados y actualización periódica.
2. Documentar el alcance y la atribución acordados; no subir correspondencia
   privada ni datos de contacto personales al repositorio público.
3. Configurar la **variable de repositorio** de Actions
   `SHILLER_PUBLICATION_APPROVED=true` y ejecutar `Update data and publish`.
   Esta variable registra una decisión del responsable, no concede derechos.
4. Comprobar siete series descargadas, su última observación y la cobertura de
   valoración. No se exige ninguna clave o suscripción adicional para la descarga.

En local, la misma variable puede definirse en `.env`. `SHILLER_FILE` permite
un archivo local alternativo, pero no evita la comprobación de autorización.
Sin aprobación no se descarga, importa ni reutiliza un histórico previo.

Si el archivo autorizado falla o cambia de formato, solo se conservan datos
reales previamente validados, con fecha original y aviso de fallo. Una descarga
parcial no reemplaza el conjunto anterior. El archivo Excel no se publica ni
se sube a Git; los datos normalizados solo se publican tras habilitar su uso.

## Estados visibles

- **Descargada**: adquisición correcta; no implica que el período sea hoy.
- **Conservada · falló actualización**: última descarga válida, sin rejuvenecer su fecha.
- **Requiere autorización**: no se realiza una solicitud al proveedor.
- **Permiso por confirmar**: integración preparada, sin habilitación pública.
- **Integración pendiente**: falta implementar el acceso.
- **Error de descarga**: solicitud o validación fallida y sin histórico conservable.
- **Sintética**: datos de prueba, nunca mezclados con una publicación real.

La tabla muestra meses y trimestres como períodos (p. ej. `T1 2026`), separados
de la fecha de adquisición. Los códigos de motivo son opcionales para mantener
compatibilidad con snapshots anteriores; un estado antiguo sin código se muestra
como «Sin datos», no como una falsa descarga en curso.
