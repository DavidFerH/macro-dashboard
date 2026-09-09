import type { ChartSpec } from "../domain/types";
export const sections = [
  {
    id: "rates",
    title: "Tipos de interés",
    subtitle: "El precio del dinero y las expectativas del mercado.",
    number: "01",
  },
  {
    id: "inflation",
    title: "Inflación",
    subtitle: "Precios, salarios y presiones sobre el coste de vida.",
    number: "02",
  },
  {
    id: "activity",
    title: "Actividad económica",
    subtitle: "Producción, consumo y señales adelantadas del ciclo.",
    number: "03",
  },
  {
    id: "employment",
    title: "Mercado laboral",
    subtitle: "Creación de empleo, desempleo y demanda de trabajadores.",
    number: "04",
  },
  {
    id: "financial",
    title: "Condiciones financieras",
    subtitle: "Crédito, volatilidad, divisas y liquidez.",
    number: "05",
  },
  {
    id: "valuation",
    title: "Valoración del mercado",
    subtitle:
      "Perspectiva histórica para interpretar el precio de los activos.",
    number: "06",
  },
];
export const charts: ChartSpec[] = [
  {
    id: "policy",
    section: "rates",
    title: "Fed, Treasury y tipo real",
    subtitle: "Tipos nominales y rentabilidad real a diez años.",
    unit: "%",
    traces: [
      {
        id: "DFF",
      },
      {
        id: "DGS2",
      },
      {
        id: "DGS10",
      },
      {
        id: "DFII10",
      },
    ],
    learn: {
      what: "Tipos nominales y rentabilidad real a diez años.",
      read: "Compara el tipo oficial con los plazos del mercado.",
      caution: "El TIPS incorpora primas de liquidez y riesgo.",
    },
    years: 15,
  },
  {
    id: "yield-curve",
    section: "rates",
    title: "Curva del Tesoro",
    subtitle: "Rentabilidad por vencimiento, hoy y hace uno y dos años.",
    unit: "%",
    traces: [
      {
        id: "DGS3MO",
      },
      {
        id: "DGS2",
      },
      {
        id: "DGS10",
      },
      {
        id: "DGS30",
      },
    ],
    learn: {
      what: "Rentabilidad por vencimiento, hoy y hace uno y dos años.",
      read: "Una curva descendente indica inversión de plazos.",
      caution: "Se usa la última observación disponible anterior a cada fecha.",
    },
    kind: "curve",
  },
  {
    id: "slopes",
    section: "rates",
    title: "Pendientes de la curva",
    subtitle: "Diferencia entre el bono a diez años y los plazos cortos.",
    unit: "pp",
    traces: [
      {
        id: "T10Y3M",
      },
      {
        id: "T10Y2Y",
      },
    ],
    learn: {
      what: "Diferencia entre el bono a diez años y los plazos cortos.",
      read: "Por debajo de cero, la curva está invertida.",
      caution: "Una inversión no determina la fecha de una recesión.",
    },
    years: 25,
    baseline: 0,
  },
  {
    id: "mortgage",
    section: "rates",
    title: "Hipoteca fija a 30 años",
    subtitle: "Coste de financiación hipotecaria a largo plazo.",
    unit: "%",
    traces: [
      {
        id: "MORTGAGE30US",
      },
    ],
    learn: {
      what: "Coste de financiación hipotecaria a largo plazo.",
      read: "Tipos más altos reducen la accesibilidad a la vivienda.",
      caution: "Media de una encuesta; no representa una oferta individual.",
    },
  },
  {
    id: "consumer-prices",
    section: "inflation",
    title: "IPC y PCE subyacente",
    subtitle: "Variación interanual de los precios al consumidor.",
    unit: "%",
    traces: [
      {
        id: "CPIAUCNS",
        transform: "yoy",
        label: "IPC",
      },
      {
        id: "CPILFENS",
        transform: "yoy",
        label: "IPC subyacente",
      },
      {
        id: "PCEPILFE",
        transform: "yoy",
        label: "PCE subyacente",
      },
    ],
    learn: {
      what: "Variación interanual de los precios al consumidor.",
      read: "La persistencia de los componentes subyacentes importa.",
      caution: "IPC y PCE usan cestas y ponderaciones diferentes.",
    },
    baseline: 2,
  },
  {
    id: "pce-momentum",
    section: "inflation",
    title: "PCE: tendencia y ritmo reciente",
    subtitle: "Inflación subyacente a doce meses y ritmo de los últimos tres.",
    unit: "%",
    traces: [
      {
        id: "PCEPILFE",
        transform: "yoy",
        label: "Interanual",
      },
      {
        id: "PCEPILFE",
        transform: "annual3",
        label: "3 meses anualizado",
      },
    ],
    learn: {
      what: "Inflación subyacente a doce meses y ritmo de los últimos tres.",
      read: "La divergencia señala aceleración o moderación reciente.",
      caution: "Anualizar tres meses amplifica el ruido.",
    },
    baseline: 2,
  },
  {
    id: "expectations",
    section: "inflation",
    title: "Expectativas de inflación",
    subtitle: "Compensación por inflación y estimación de Cleveland.",
    unit: "%",
    traces: [
      {
        id: "T5YIE",
      },
      {
        id: "T10YIE",
      },
      {
        id: "EXPINF1YR",
      },
    ],
    learn: {
      what: "Compensación por inflación y estimación de Cleveland.",
      read: "Observa si las expectativas se alejan del entorno del 2%.",
      caution: "El breakeven incluye primas; no es una previsión pura.",
    },
    baseline: 2,
  },
  {
    id: "ism-prices",
    section: "inflation",
    title: "ISM · precios pagados",
    subtitle: "Encuestas de presión de precios en manufacturas y servicios.",
    unit: "índice",
    traces: [
      {
        id: "ISM_PRICES",
      },
      {
        id: "ISM_NMPRICES",
      },
    ],
    learn: {
      what: "Encuestas de presión de precios en manufacturas y servicios.",
      read: "Por encima de 50 predominan las subidas.",
      caution: "Índices de difusión, no tasas de inflación.",
    },
    baseline: 50,
  },
  {
    id: "wages-prices",
    section: "inflation",
    title: "Salarios, vivienda e IPC",
    subtitle: "Componentes persistentes de inflación y costes laborales.",
    unit: "%",
    traces: [
      {
        id: "CES0500000003",
        transform: "yoy",
        label: "Salarios",
      },
      {
        id: "CUSR0000SAH1",
        transform: "yoy",
        label: "Vivienda",
      },
      {
        id: "CPILFENS",
        transform: "yoy",
        label: "IPC subyacente",
      },
    ],
    learn: {
      what: "Componentes persistentes de inflación y costes laborales.",
      read: "Busca moderación sostenida, no un único mes.",
      caution:
        "Los salarios medios cambian también por composición del empleo.",
    },
  },
  {
    id: "producer-prices",
    section: "inflation",
    title: "Precios de producción y consumo",
    subtitle: "Inflación en producción y en la cesta de consumo.",
    unit: "%",
    traces: [
      {
        id: "PPIFIS",
        transform: "yoy",
        label: "IPP",
      },
      {
        id: "CPIAUCNS",
        transform: "yoy",
        label: "IPC",
      },
    ],
    learn: {
      what: "Inflación en producción y en la cesta de consumo.",
      read: "La presión aguas arriba puede trasladarse al consumidor.",
      caution: "El traslado depende de márgenes y estructura sectorial.",
    },
  },
  {
    id: "energy",
    section: "inflation",
    title: "Petróleo y gasolina",
    subtitle: "Precios energéticos en origen y al consumidor.",
    unit: "USD/barril",
    traces: [
      {
        id: "DCOILWTICO",
      },
      {
        id: "GASREGW",
        transform: "level",
        label: "Gasolina",
        axis: "right",
      },
    ],
    learn: {
      what: "Precios energéticos en origen y al consumidor.",
      read: "Compara los movimientos, teniendo en cuenta ambos ejes.",
      caution: "El precio final incorpora refino, distribución e impuestos.",
    },
    rightUnit: "USD/galón",
  },
  {
    id: "house-prices",
    section: "inflation",
    title: "Vivienda y financiación",
    subtitle: "Revalorización de vivienda y coste hipotecario.",
    unit: "%",
    traces: [
      {
        id: "CSUSHPINSA",
        transform: "yoy",
        label: "Case-Shiller",
      },
      {
        id: "MORTGAGE30US",
        transform: "level",
        label: "Hipoteca",
        axis: "right",
      },
    ],
    learn: {
      what: "Revalorización de vivienda y coste hipotecario.",
      read: "Los tipos afectan a la demanda con retardo.",
      caution: "La estadística de vivienda se publica con retraso.",
    },
    rightUnit: "%",
  },
  {
    id: "gdp",
    section: "activity",
    title: "PIB real",
    subtitle: "Crecimiento trimestral anualizado de Estados Unidos.",
    unit: "%",
    traces: [
      {
        id: "A191RL1Q225SBEA",
      },
    ],
    learn: {
      what: "Crecimiento trimestral anualizado de Estados Unidos.",
      read: "Compara varios trimestres para interpretar la tendencia.",
      caution: "Anualizado no significa crecimiento interanual.",
    },
    kind: "bar",
    years: 15,
    baseline: 0,
  },
  {
    id: "nowcast",
    section: "activity",
    title: "GDPNow y PIB observado",
    subtitle: "Estimación del trimestre en curso frente al PIB publicado.",
    unit: "%",
    traces: [
      {
        id: "GDPNOW",
      },
      {
        id: "A191RL1Q225SBEA",
      },
    ],
    learn: {
      what: "Estimación del trimestre en curso frente al PIB publicado.",
      read: "GDPNow cambia a medida que llegan nuevos datos.",
      caution: "Es una estimación de modelo, no un dato oficial del PIB.",
    },
    years: 15,
  },
  {
    id: "national-activity",
    section: "activity",
    title: "Actividad nacional · CFNAI",
    subtitle: "Actividad respecto a su crecimiento tendencial histórico.",
    unit: "índice",
    traces: [
      {
        id: "CFNAI",
      },
      {
        id: "CFNAIMA3",
      },
    ],
    learn: {
      what: "Actividad respecto a su crecimiento tendencial histórico.",
      read: "Cero representa tendencia; negativos, actividad inferior.",
      caution: "El indicador es revisable y sensible a shocks.",
    },
    years: 25,
    baseline: 0,
  },
  {
    id: "pmi",
    section: "activity",
    title: "ISM · actividad y pedidos",
    subtitle: "Encuestas de actividad empresarial y nuevos pedidos.",
    unit: "índice",
    traces: [
      {
        id: "ISM_PMI",
      },
      {
        id: "ISM_NMI",
      },
      {
        id: "ISM_NEWORD",
      },
    ],
    learn: {
      what: "Encuestas de actividad empresarial y nuevos pedidos.",
      read: "El umbral 50 separa expansión y contracción en la encuesta.",
      caution: "No mide directamente el crecimiento del PIB.",
    },
    baseline: 50,
  },
  {
    id: "production-retail",
    section: "activity",
    title: "Producción y consumo real",
    subtitle: "Evolución de producción y ventas minoristas deflactadas.",
    unit: "%",
    traces: [
      {
        id: "INDPRO",
        transform: "yoy",
        label: "Producción industrial",
      },
      {
        id: "REAL_RETAIL",
        transform: "yoy",
        label: "Ventas reales",
      },
    ],
    learn: {
      what: "Evolución de producción y ventas minoristas deflactadas.",
      read: "Una caída conjunta indica pérdida de impulso.",
      caution:
        "Ventas reales se calcula como ventas nominales divididas por IPC.",
    },
  },
  {
    id: "regional",
    section: "activity",
    title: "Encuestas regionales",
    subtitle: "Manufactura en Nueva York y Filadelfia.",
    unit: "índice",
    traces: [
      {
        id: "GACDISA066MSFRBNY",
      },
      {
        id: "GACDFSA066MSFRBPHI",
      },
    ],
    learn: {
      what: "Manufactura en Nueva York y Filadelfia.",
      read: "Compara dirección y persistencia entre regiones.",
      caution: "Su cobertura regional limita la extrapolación.",
    },
    baseline: 0,
  },
  {
    id: "construction",
    section: "activity",
    title: "Construcción residencial",
    subtitle: "Viviendas iniciadas y permisos, a ritmo anualizado.",
    unit: "miles",
    traces: [
      {
        id: "HOUST",
      },
      {
        id: "PERMIT",
      },
    ],
    learn: {
      what: "Viviendas iniciadas y permisos, a ritmo anualizado.",
      read: "Los permisos pueden anticipar actividad futura.",
      caution: "Series volátiles y sujetas a revisiones.",
    },
  },
  {
    id: "unemployment",
    section: "employment",
    title: "Desempleo y regla de Sahm",
    subtitle: "Tasa de paro y distancia de su media respecto al mínimo.",
    unit: "%",
    traces: [
      {
        id: "UNRATE",
      },
      {
        id: "SAHMREALTIME",
        transform: "level",
        label: "Sahm",
        axis: "right",
      },
    ],
    learn: {
      what: "Tasa de paro y distancia de su media respecto al mínimo.",
      read: "Sahm ≥ 0,50 puntos es una señal de deterioro.",
      caution: "Es una regla empírica, no una confirmación oficial.",
    },
    years: 25,
    rightUnit: "pp",
  },
  {
    id: "payroll",
    section: "employment",
    title: "Creación de empleo",
    subtitle: "Cambio mensual del empleo no agrícola.",
    unit: "mil",
    traces: [
      {
        id: "PAYEMS",
        transform: "change",
        label: "Mes",
      },
      {
        id: "PAYEMS",
        transform: "ma3change",
        label: "Media 3 meses",
      },
    ],
    learn: {
      what: "Cambio mensual del empleo no agrícola.",
      read: "La media de tres meses ayuda a identificar tendencia.",
      caution: "Las revisiones pueden modificar el diagnóstico.",
    },
    kind: "bar",
    baseline: 0,
  },
  {
    id: "vacancies",
    section: "employment",
    title: "Vacantes por desempleado",
    subtitle: "Relación entre puestos disponibles y personas desempleadas.",
    unit: "×",
    traces: [
      {
        id: "VACANCY_RATIO",
      },
    ],
    learn: {
      what: "Relación entre puestos disponibles y personas desempleadas.",
      read: "Una ratio alta sugiere mayor demanda laboral.",
      caution: "Vacantes y desempleados provienen de encuestas diferentes.",
    },
    baseline: 1,
  },
  {
    id: "claims",
    section: "employment",
    title: "Solicitudes de desempleo",
    subtitle: "Solicitudes iniciales y su media móvil de cuatro semanas.",
    unit: "personas",
    traces: [
      {
        id: "ICSA",
      },
      {
        id: "ICSA",
        transform: "ma4",
        label: "Media 4 semanas",
      },
    ],
    learn: {
      what: "Solicitudes iniciales y su media móvil de cuatro semanas.",
      read: "Una subida persistente indica menor fortaleza laboral.",
      caution: "Festivos y factores estacionales pueden generar saltos.",
    },
  },
  {
    id: "hours",
    section: "employment",
    title: "Horas trabajadas",
    subtitle: "Duración media de la semana laboral.",
    unit: "horas",
    traces: [
      {
        id: "AWHAETP",
      },
      {
        id: "AWHMAN",
      },
    ],
    learn: {
      what: "Duración media de la semana laboral.",
      read: "Las horas pueden ajustarse antes que el número de empleos.",
      caution: "Las diferencias sectoriales condicionan las medias.",
    },
  },
  {
    id: "wage-growth",
    section: "employment",
    title: "Crecimiento salarial",
    subtitle: "Variación de los salarios medios por hora.",
    unit: "%",
    traces: [
      {
        id: "CES0500000003",
        transform: "yoy",
        label: "Interanual",
      },
      {
        id: "CES0500000003",
        transform: "mom",
        label: "Mensual",
        axis: "right",
      },
    ],
    learn: {
      what: "Variación de los salarios medios por hora.",
      read: "Distingue el ritmo mensual de la tendencia interanual.",
      caution: "No equivale al crecimiento salarial de una misma persona.",
    },
    rightUnit: "%",
  },
  {
    id: "sectors",
    section: "employment",
    title: "Empleo por sector",
    subtitle: "Contribución de catorce sectores al empleo.",
    unit: "mil",
    traces: [
      {
        id: "USEHS",
      },
      {
        id: "USLAH",
      },
      {
        id: "USPBS",
      },
      {
        id: "USGOVT",
      },
      {
        id: "USTRADE",
      },
      {
        id: "MANEMP",
      },
      {
        id: "USCONS",
      },
      {
        id: "CES4300000001",
      },
      {
        id: "USFIRE",
      },
      {
        id: "USWTRADE",
      },
      {
        id: "USSERV",
      },
      {
        id: "USINFO",
      },
      {
        id: "CES4422000001",
      },
      {
        id: "USMINE",
      },
    ],
    learn: {
      what: "Contribución de catorce sectores al empleo.",
      read: "Alterna cambio mensual, media de tres meses y variación anual.",
      caution: "El porcentaje anual no es comparable con un cambio absoluto.",
    },
    kind: "sectors",
  },
  {
    id: "high-yield",
    section: "financial",
    title: "Diferencial high yield",
    subtitle: "Prima de crédito de emisores de menor calidad.",
    unit: "%",
    traces: [
      {
        id: "BAMLH0A0HYM2",
      },
    ],
    learn: {
      what: "Prima de crédito de emisores de menor calidad.",
      read: "Un aumento indica mayor compensación por riesgo.",
      caution: "Puede reflejar cambios en composición del índice.",
    },
  },
  {
    id: "nfci",
    section: "financial",
    title: "Condiciones financieras · NFCI",
    subtitle: "Condiciones financieras respecto a su media histórica.",
    unit: "índice",
    traces: [
      {
        id: "NFCI",
      },
    ],
    learn: {
      what: "Condiciones financieras respecto a su media histórica.",
      read: "Negativo indica condiciones relativamente holgadas.",
      caution: "Su construcción agrega indicadores con distinta frecuencia.",
    },
    years: 15,
    baseline: 0,
  },
  {
    id: "vix",
    section: "financial",
    title: "Volatilidad implícita · VIX",
    subtitle: "Volatilidad implícita del mercado de opciones.",
    unit: "puntos",
    traces: [
      {
        id: "VIXCLS",
      },
    ],
    learn: {
      what: "Volatilidad implícita del mercado de opciones.",
      read: "Picos elevados reflejan mayor incertidumbre esperada.",
      caution: "No indica la dirección futura de las cotizaciones.",
    },
  },
  {
    id: "currency",
    section: "financial",
    title: "Euro / dólar",
    subtitle: "Dólares necesarios para comprar un euro.",
    unit: "USD/EUR",
    traces: [
      {
        id: "DEXUSEU",
      },
    ],
    learn: {
      what: "Dólares necesarios para comprar un euro.",
      read: "Una subida significa apreciación del euro frente al dólar.",
      caution: "No es un índice del dólar frente a una cesta de divisas.",
    },
  },
  {
    id: "fed-balance",
    section: "financial",
    title: "Balance de la Reserva Federal",
    subtitle: "Tamaño de los activos de la Reserva Federal.",
    unit: "millones USD",
    traces: [
      {
        id: "WALCL",
      },
    ],
    learn: {
      what: "Tamaño de los activos de la Reserva Federal.",
      read: "Relaciona las variaciones con programas monetarios.",
      caution: "El balance no equivale por sí solo a liquidez bursátil.",
    },
  },
  {
    id: "cape",
    section: "valuation",
    title: "CAPE y TR CAPE",
    subtitle: "Precio respecto a beneficios reales suavizados.",
    unit: "×",
    traces: [
      {
        id: "SH_CAPE",
      },
      {
        id: "SH_TRCAPE",
      },
    ],
    learn: {
      what: "Precio respecto a beneficios reales suavizados.",
      read: "Compara valoración con su propia distribución histórica.",
      caution: "Los cambios contables y sectoriales afectan la comparación.",
    },
  },
  {
    id: "cape-return",
    section: "valuation",
    title: "CAPE y rentabilidad real a 10 años",
    subtitle:
      "Relación histórica entre valoración inicial y retorno posterior.",
    unit: "%",
    traces: [
      {
        id: "SH_CAPE",
      },
      {
        id: "RETURN10",
      },
    ],
    learn: {
      what: "Relación histórica entre valoración inicial y retorno posterior.",
      read: "La curva resume una regresión sobre el logaritmo del CAPE.",
      caution: "Retornos mensuales solapados; relación histórica, no promesa.",
    },
    kind: "scatter",
  },
  {
    id: "pe-dividend",
    section: "valuation",
    title: "PER y dividendo",
    subtitle: "Precio sobre beneficio y rentabilidad por dividendo.",
    unit: "×",
    traces: [
      {
        id: "PE",
      },
      {
        id: "DY",
        transform: "level",
        label: "Dividendo",
        axis: "right",
      },
    ],
    learn: {
      what: "Precio sobre beneficio y rentabilidad por dividendo.",
      read: "Un PER alto y dividendo bajo suelen indicar mayor precio.",
      caution: "Las recompras no se incluyen en el dividendo.",
    },
    rightUnit: "%",
  },
  {
    id: "real-earnings",
    section: "valuation",
    title: "Beneficios reales",
    subtitle: "Beneficios deflactados y media de diez años.",
    unit: "USD / IPC",
    traces: [
      {
        id: "REAL_EARNINGS",
      },
      {
        id: "REAL_EARNINGS10",
      },
    ],
    learn: {
      what: "Beneficios deflactados y media de diez años.",
      read: "La media reduce la influencia de un ciclo aislado.",
      caution: "Escala P/IPC sin rebase a dólares de una fecha concreta.",
    },
  },
  {
    id: "yields",
    section: "valuation",
    title: "Beneficios frente a bonos",
    subtitle: "Rentabilidades implícitas de beneficios y bono a diez años.",
    unit: "%",
    traces: [
      {
        id: "EY",
      },
      {
        id: "CAPE_YIELD",
      },
      {
        id: "SH_GS10",
      },
    ],
    learn: {
      what: "Rentabilidades implícitas de beneficios y bono a diez años.",
      read: "Compara compensación nominal entre clases de activo.",
      caution: "Los beneficios no son flujos garantizados.",
    },
  },
  {
    id: "premiums",
    section: "valuation",
    title: "ECY y Fed model",
    subtitle: "Diferenciales entre beneficios y renta fija.",
    unit: "pp",
    traces: [
      {
        id: "ECY",
      },
      {
        id: "FED_MODEL",
      },
    ],
    learn: {
      what: "Diferenciales entre beneficios y renta fija.",
      read: "Una prima reducida implica menor colchón relativo.",
      caution: "ECY estima inflación histórica; no utiliza directamente TIPS.",
    },
    baseline: 0,
  },
  {
    id: "rule20",
    section: "valuation",
    title: "Regla del 20",
    subtitle: "Suma del PER y la inflación interanual.",
    unit: "puntos",
    traces: [
      {
        id: "RULE20",
      },
    ],
    learn: {
      what: "Suma del PER y la inflación interanual.",
      read: "El nivel 20 es una referencia histórica orientativa.",
      caution: "Es una heurística, no un modelo de valor razonable.",
    },
    baseline: 20,
  },
  {
    id: "buffett",
    section: "valuation",
    title: "Capitalización / PIB · Buffett",
    subtitle: "Valor bursátil empresarial respecto al PIB nominal.",
    unit: "%",
    traces: [
      {
        id: "BUFFETT",
      },
    ],
    learn: {
      what: "Valor bursátil empresarial respecto al PIB nominal.",
      read: "Percentiles altos representan mayor valoración histórica.",
      caution: "Cobertura de sociedades no financieras; no es todo el mercado.",
    },
  },
  {
    id: "tobin",
    section: "valuation",
    title: "Q de Tobin · aproximación",
    subtitle: "Valor de acciones empresariales sobre patrimonio neto.",
    unit: "×",
    traces: [
      {
        id: "TOBIN",
      },
    ],
    learn: {
      what: "Valor de acciones empresariales sobre patrimonio neto.",
      read: "Compara la ratio con su historia.",
      caution: "Proxy de renta variable; no es la Q completa con deuda.",
    },
  },
  {
    id: "household-stocks",
    section: "valuation",
    title: "Acciones en activos de hogares",
    subtitle: "Participación de acciones en el balance de los hogares.",
    unit: "%",
    traces: [
      {
        id: "BOGZ1FL153064486Q",
      },
    ],
    learn: {
      what: "Participación de acciones en el balance de los hogares.",
      read: "Una exposición alta puede reflejar revalorización acumulada.",
      caution: "Los datos son trimestrales y no describen cada hogar.",
    },
  },
  {
    id: "profits",
    section: "valuation",
    title: "Beneficios / PIB",
    subtitle: "Beneficios después de impuestos sobre PIB nominal.",
    unit: "%",
    traces: [
      {
        id: "PROFIT_GDP",
      },
    ],
    learn: {
      what: "Beneficios después de impuestos sobre PIB nominal.",
      read: "Compara el peso agregado de los beneficios en la economía.",
      caution: "No representa el margen de beneficio de un índice bursátil.",
    },
  },
  {
    id: "credit",
    section: "valuation",
    title: "Diferenciales de crédito",
    subtitle: "Prima exigida a distintos niveles de calidad crediticia.",
    unit: "%",
    traces: [
      {
        id: "BAMLC0A0CM",
      },
      {
        id: "BAMLC0A4CBBB",
      },
      {
        id: "BAMLH0A0HYM2",
      },
    ],
    learn: {
      what: "Prima exigida a distintos niveles de calidad crediticia.",
      read: "Compara amplitud y cambios entre categorías.",
      caution: "La serie IG se muestra como contexto, fuera del agregado.",
    },
  },
  {
    id: "term-premium",
    section: "valuation",
    title: "Prima por plazo a 10 años",
    subtitle: "Compensación estimada por asumir duración a largo plazo.",
    unit: "%",
    traces: [
      {
        id: "THREEFYTP10",
      },
    ],
    learn: {
      what: "Compensación estimada por asumir duración a largo plazo.",
      read: "Valores negativos implican prima estimada reducida.",
      caution: "Es una estimación de modelo; fuera del agregado.",
    },
    baseline: 0,
  },
];
