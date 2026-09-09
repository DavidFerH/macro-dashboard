<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue";
import { charts, sections } from "./catalog/charts";
import { preference } from "./composables/preferences";
import { buildDiagnostics } from "./domain/diagnostics";
import { dateLabel, madridDate, number } from "./domain/format";
import { createSeriesResolver, latest, transform } from "./domain/series";
import { parseSnapshot } from "./domain/validate";
import { valuation } from "./domain/valuation";
import type { ChartSpec, Snapshot, Transform } from "./domain/types";
import ChartCard from "./components/ChartCard.vue";
import ChartModal from "./components/ChartModal.vue";
import PeriodControl from "./components/PeriodControl.vue";
const snapshot = shallowRef<Snapshot | null>(null);
const error = ref(""),
  loading = ref(true);
const baseUrl = import.meta.env.BASE_URL;
const years = preference("macro.period", 5, [0, 3, 5, 10]);
const learn = preference("panel.learn", false, [false, true]);
const base = preference("panel.valbase", 1881, [1881, 1990]);
const expanded = shallowRef<ChartSpec | null>(null);
const now = ref(new Date());
const resolver = computed(() =>
  snapshot.value ? createSeriesResolver(snapshot.value) : () => [],
);
const diagnostics = computed(() => buildDiagnostics(resolver.value));
const valuations = computed(() => valuation(resolver.value, base.value));
const available = computed(
  () =>
    Object.values(snapshot.value?.series ?? {}).filter(
      (s) => s.observations.length,
    ).length,
);
const total = computed(() => Object.keys(snapshot.value?.series ?? {}).length);
const ageHours = computed(() =>
  snapshot.value
    ? (now.value.getTime() - Date.parse(snapshot.value.generatedAt)) / 3600000
    : 0,
);
const upcoming = computed(() => {
  const today = madridDate(now.value);
  const end = new Date(today + "T12:00:00Z");
  end.setUTCDate(end.getUTCDate() + 14);
  return (snapshot.value?.events ?? [])
    .filter((e) => e.date >= today && e.date < end.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));
});
const latestSpecs: [string, string, Transform, string][] = [
  ["DGS10", "Treasury 10 años", "level", "%"],
  ["ICSA", "Solicitudes iniciales", "level", "personas"],
  ["PAYEMS", "Empleo · cambio mensual", "change", "mil"],
  ["UNRATE", "Tasa de paro", "level", "%"],
  ["CPIAUCNS", "IPC interanual", "yoy", "%"],
  ["CPILFENS", "IPC subyacente", "yoy", "%"],
  ["PCEPILFE", "PCE subyacente", "yoy", "%"],
  ["RSAFS", "Ventas minoristas", "yoy", "%"],
  ["GDPNOW", "GDPNow", "level", "%"],
  ["A191RL1Q225SBEA", "PIB real anualizado", "level", "%"],
];
const releases = computed(() =>
  latestSpecs
    .map(([id, label, operation, unit]) => ({
      id,
      label,
      unit,
      current: latest(transform(resolver.value(id), operation)),
    }))
    .sort((a, b) =>
      (b.current?.date ?? "").localeCompare(a.current?.date ?? ""),
    ),
);
const cycleText = computed(() => {
  const growth = diagnostics.value[0],
    inflation = diagnostics.value[1];
  if (growth.score === null)
    return "Esperando cobertura suficiente para interpretar el ciclo.";
  return (
    "Crecimiento " +
    growth.label.toLowerCase() +
    " e inflación " +
    inflation.label.toLowerCase() +
    ". Interpreta las señales conjuntamente y comprueba sus fechas de observación."
  );
});
let controller: AbortController | undefined;
async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch(
      import.meta.env.BASE_URL + "data/snapshot.json",
      { signal: controller.signal, cache: "no-cache" },
    );
    if (!response.ok)
      throw new Error("No se ha podido cargar el archivo de datos.");
    snapshot.value = parseSnapshot(await response.json());
  } catch (cause) {
    if (!(cause instanceof DOMException && cause.name === "AbortError"))
      error.value =
        "No hay un snapshot válido disponible. Genera los datos con el proceso de actualización y vuelve a intentarlo.";
  } finally {
    loading.value = false;
  }
}
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void load();
  timer = setInterval(() => {
    now.value = new Date();
  }, 60000);
});
onUnmounted(() => {
  controller?.abort();
  clearInterval(timer);
});
</script>
<template>
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <header class="site-header">
    <div class="header-inner">
      <a :href="baseUrl" class="brand" aria-label="Macro dashboard, inicio"
        ><span class="brand-mark">M<span>↗</span></span
        ><strong>Macro dashboard</strong></a
      ><span class="header-divider"></span
      ><span class="header-section">Panel macro</span>
      <div class="header-status">
        <span v-if="snapshot" class="timestamp"
          >Actualizado {{ dateLabel(snapshot.generatedAt) }}</span
        ><span class="status-pill" :class="{ demo: snapshot?.mode === 'demo' }"
          ><i></i
          >{{
            snapshot?.mode === "demo"
              ? "DEMO"
              : snapshot
                ? "DATOS REALES"
                : "CARGANDO"
          }}</span
        >
      </div>
    </div>
  </header>
  <main id="main" class="wrap">
    <div class="page-heading">
      <div>
        <p class="eyebrow">ESTADOS UNIDOS · ECONOMÍA Y MERCADOS</p>
        <h1>El pulso de la economía</h1>
        <p class="intro">
          Tipos, inflación, actividad y valoración. Una lectura conjunta del
          ciclo.
        </p>
      </div>
      <div class="toolbar">
        <button
          class="learn-toggle"
          :aria-pressed="learn"
          :class="{ selected: learn }"
          @click="learn = !learn"
        >
          <span>ⓘ</span> Modo educativo</button
        ><PeriodControl v-model="years" />
      </div>
    </div>
    <nav class="section-nav" aria-label="Secciones">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="'#' + section.id"
        >{{ section.title }}</a
      ><a href="#sources">Fuentes</a>
    </nav>
    <div v-if="loading" class="message-panel" role="status">
      Cargando indicadores…
    </div>
    <div v-else-if="error" class="message-panel error" role="alert">
      <h2>No se pudieron cargar los datos</h2>
      <p>{{ error }}</p>
      <button class="primary-button" @click="load">Reintentar</button>
    </div>
    <template v-else-if="snapshot">
      <div v-if="snapshot.mode === 'demo'" class="banner warning">
        <b>Demostración.</b> Todos los valores son sintéticos. Esta vista sirve
        para probar la interfaz, no para analizar el mercado.
      </div>
      <div v-else-if="ageHours > 36" class="banner warning">
        Última descarga hace {{ number(ageHours / 24, 1) }} días. Comprueba las
        fechas antes de interpretar los indicadores.
      </div>
      <div class="summary-title">
        <h2>Lectura del ciclo</h2>
        <span class="meta">Señales orientativas · no son recomendaciones</span>
      </div>
      <div class="score-grid">
        <article
          v-for="card in diagnostics"
          :key="card.title"
          class="score-card"
          :class="card.tone"
        >
          <p class="score-title">{{ card.title }}</p>
          <h3><i></i>{{ card.label }}</h3>
          <div class="signal-list">
            <div
              v-for="signal in card.signals"
              :key="signal.label"
              class="signal"
            >
              <span
                class="signal-dot"
                :class="
                  signal.score === null
                    ? 'unknown'
                    : signal.score > 0
                      ? 'positive'
                      : signal.score < 0
                        ? 'negative'
                        : 'neutral'
                "
              ></span
              ><span>{{ signal.label }}</span
              ><b
                >{{ number(signal.value, signal.unit === "personas" ? 0 : 1)
                }}<small> {{ signal.unit }}</small></b
              >
            </div>
          </div>
          <p class="score-note">
            {{ card.signals.filter((s) => s.score !== null).length }}/{{
              card.signals.length
            }}
            señales disponibles
          </p>
          <p v-if="learn" class="score-explanation">{{ card.note }}</p>
        </article>
      </div>
      <div class="cycle-reading">
        <span class="eyebrow">EN PERSPECTIVA</span>
        <p>{{ cycleText }}</p>
      </div>
      <div class="summary-title">
        <h2>Últimas observaciones</h2>
        <span class="meta"
          >Ordenadas por periodo observado, no por publicación</span
        >
      </div>
      <div class="latest-grid">
        <article
          v-for="release in releases"
          :key="release.id"
          class="latest-tile"
        >
          <p>{{ release.label }}</p>
          <strong
            >{{
              number(
                release.current?.value,
                release.unit === "personas" ? 0 : 2,
              )
            }}<small> {{ release.unit }}</small></strong
          ><span>{{ dateLabel(release.current?.date) }}</span>
        </article>
      </div>
      <div class="summary-title">
        <h2>Agenda económica</h2>
        <span class="meta"
          >Próximos 14 días · horario de Madrid cuando está disponible</span
        >
      </div>
      <div v-if="upcoming.length" class="calendar">
        <a
          v-for="event in upcoming"
          :key="event.id"
          :href="event.url"
          target="_blank"
          rel="noopener noreferrer"
          class="event"
          :class="{ important: event.importance === 3 }"
          ><span>{{ dateLabel(event.date) }}</span
          ><strong>{{ event.title }}</strong
          ><small>{{
            event.time
              ? new Intl.DateTimeFormat("es-ES", {
                  timeZone: "Europe/Madrid",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(event.time))
              : "Hora no facilitada por la fuente"
          }}</small></a
        >
      </div>
      <div v-else class="calendar-empty">
        {{
          snapshot.calendarStatus === "ok"
            ? "No hay publicaciones de las series seguidas en esta ventana."
            : "Agenda no disponible. No se han generado eventos ficticios."
        }}
      </div>
      <p v-if="snapshot.calendarStatus === 'stale'" class="missing-note">
        La agenda conserva la última consulta válida; las fechas pueden haber
        cambiado.
      </p>
      <p v-if="snapshot.calendarStatus === 'partial'" class="missing-note">
        Cobertura parcial: no se ha podido consultar el calendario FOMC.
      </p>
      <section
        v-for="section in sections"
        :id="section.id"
        :key="section.id"
        class="dashboard-section"
      >
        <div class="section-heading">
          <span class="section-number">{{ section.number }}</span>
          <div>
            <h2>{{ section.title }}</h2>
            <p>{{ section.subtitle }}</p>
          </div>
          <span class="section-count"
            >{{
              charts.filter((c) => c.section === section.id).length
            }}
            gráficos</span
          >
        </div>
        <template v-if="section.id === 'valuation'">
          <div class="valuation-panel">
            <div class="valuation-heading">
              <div>
                <p class="eyebrow">TERMÓMETRO DE VALORACIÓN</p>
                <h3>{{ valuations.label }}</h3>
                <p>
                  {{ valuations.coverage }} de 10 componentes con histórico
                  suficiente
                </p>
              </div>
              <div
                class="segmented"
                role="group"
                aria-label="Base histórica de valoración"
              >
                <button
                  :aria-pressed="base === 1881"
                  :class="{ active: base === 1881 }"
                  @click="base = 1881"
                >
                  Desde 1881</button
                ><button
                  :aria-pressed="base === 1990"
                  :class="{ active: base === 1990 }"
                  @click="base = 1990"
                >
                  Desde 1990
                </button>
              </div>
            </div>
            <div
              class="gauge-track"
              role="img"
              :aria-label="
                valuations.score === null
                  ? 'Valoración agregada no disponible'
                  : 'Percentil agregado ' + number(valuations.score, 0)
              "
            >
              <span
                v-if="valuations.score !== null"
                class="gauge-marker"
                :style="{ left: valuations.score + '%' }"
              ></span>
            </div>
            <div class="gauge-labels">
              <span>Barata</span><span>Razonable</span><span>Exigente</span
              ><span>Cara</span><span>Muy cara</span>
            </div>
            <p class="meta">
              Percentiles históricos, no precios objetivo. Sin agregado hasta
              disponer de los diez componentes.
            </p>
          </div>
          <div class="valuation-grid">
            <article
              v-for="tile in valuations.tiles"
              :key="tile.id"
              class="valuation-tile"
            >
              <p>
                {{ tile.name }}<small v-if="tile.excluded"> · contexto</small>
              </p>
              <strong
                >{{ number(tile.current?.value)
                }}<small> {{ tile.unit }}</small></strong
              >
              <div class="percentile-line">
                <span
                  :style="{
                    width: (tile.rank ?? 0) + '%',
                    background:
                      tile.rank === null
                        ? '#ECE9E9'
                        : tile.rank > 80
                          ? '#E04444'
                          : tile.rank > 60
                            ? '#C0892E'
                            : '#0E9BA8',
                  }"
                ></span>
              </div>
              <span class="meta"
                >{{
                  tile.rank === null
                    ? "Histórico insuficiente"
                    : "Percentil " + number(tile.rank, 0)
                }}
                · {{ dateLabel(tile.current?.date) }}</span
              >
            </article>
          </div>
        </template>
        <div class="chart-grid" :class="{ two: section.id === 'rates' }">
          <ChartCard
            v-for="spec in charts.filter((c) => c.section === section.id)"
            :key="spec.id"
            :spec="spec"
            :snapshot="snapshot"
            :resolve="resolver"
            :years="years"
            :learn="learn"
            @expand="expanded = $event"
          />
        </div>
      </section>
      <section id="sources" class="sources-section">
        <div class="summary-title">
          <h2>Fuentes y cobertura</h2>
          <span class="meta"
            >{{ available }}/{{ total }} series con observaciones</span
          >
        </div>
        <p>
          Datos consultados directamente a sus proveedores. Una observación
          antigua puede corresponder a la frecuencia normal de publicación. Los
          datos ausentes no se sustituyen por cero.
        </p>
        <details>
          <summary>
            Ver disponibilidad, procedencia y fechas de cada serie
          </summary>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Serie</th>
                  <th>Fuente</th>
                  <th>Estado</th>
                  <th>Última observación</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="series in snapshot.series" :key="series.id">
                  <td>
                    {{ series.name }}<code>{{ series.id }}</code>
                  </td>
                  <td>
                    <a
                      :href="series.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ series.provider }} ↗</a
                    >
                  </td>
                  <td>
                    {{
                      {
                        ok: "Descargada",
                        stale: "Conservada",
                        unavailable: "Pendiente",
                        demo: "Sintética",
                      }[series.status]
                    }}
                  </td>
                  <td>{{ dateLabel(latest(series.observations)?.date) }}</td>
                  <td>
                    {{
                      series.reason ??
                      "Descargada " + dateLabel(series.fetchedAt ?? undefined)
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </template>
    <footer>
      <span class="footer-brand">Macro dashboard</span>
      <p>
        Uso informativo personal. Los datos pueden revisarse. Las relaciones
        históricas no garantizan resultados futuros.
      </p>
      <a
        href="https://github.com/DavidFerH/macro-dashboard"
        target="_blank"
        rel="noopener noreferrer"
        >Código y metodología ↗</a
      >
    </footer>
  </main>
  <ChartModal
    v-if="expanded && snapshot"
    :spec="expanded"
    :snapshot="snapshot"
    :resolve="resolver"
    @close="expanded = null"
  />
</template>
