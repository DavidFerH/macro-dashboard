<script setup lang="ts">
import { computed, ref } from "vue";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";
import { capeRegression } from "../domain/valuation";
import { latest, transform, valid, windowed } from "../domain/series";
import { dateLabel, number } from "../domain/format";
import type { ChartSpec, Point, Snapshot, Trace } from "../domain/types";
const props = defineProps<{
  spec: ChartSpec;
  snapshot: Snapshot;
  resolve: (id: string) => Point[];
  years: number;
  expanded?: boolean;
  sectorMode?: "change" | "ma3change" | "yoy";
}>();
const colors = ["#030942", "#7257D8", "#0E9BA8", "#C0892E", "#74BDFF"];
const width = 720,
  left = 62,
  right = 656,
  top = 22,
  bottom = 230;
const hovered = ref<number | null>(null);
const horizon = computed(() =>
  props.expanded ? props.years : (props.spec.years ?? props.years),
);
const traces = computed<Trace[]>(() =>
  props.spec.traces.map((spec, i) => ({
    id: spec.id + i,
    label: spec.label ?? props.snapshot.series[spec.id]?.name ?? spec.id,
    unit:
      spec.axis === "right"
        ? (props.spec.rightUnit ?? props.spec.unit)
        : props.spec.unit,
    axis: spec.axis,
    color: spec.color ?? colors[i % colors.length],
    points: windowed(
      transform(props.resolve(spec.id), spec.transform),
      horizon.value,
      props.snapshot.generatedAt,
    ),
  })),
);
const timePoints = computed(() => traces.value.flatMap((t) => valid(t.points)));
const special = computed(
  () =>
    props.spec.kind === "curve" ||
    props.spec.kind === "sectors" ||
    props.spec.kind === "scatter",
);
const empty = computed(() =>
  props.spec.kind === "scatter"
    ? !scatter.value.points.length
    : props.spec.kind === "sectors"
      ? !sectors.value.length
      : props.spec.kind === "curve"
        ? !curves.value.some((c) => c.points.length)
        : !timePoints.value.length,
);
const x = computed(() => {
  const dates = timePoints.value.map((p) => Date.parse(p.date));
  const min = dates.length ? Math.min(...dates) : Date.now() - 86400000;
  const max = dates.length ? Math.max(...dates) : Date.now();
  return scaleTime()
    .domain([new Date(min), new Date(max === min ? max + 86400000 : max)])
    .range([left, right]);
});
function yScale(axis?: "right") {
  const values = traces.value
    .filter((t) => t.axis === axis)
    .flatMap((t) => valid(t.points).map((p) => p.value));
  if (props.spec.baseline !== undefined && !axis)
    values.push(props.spec.baseline);
  if (props.spec.kind === "bar" && !axis) values.push(0);
  let min = values.length ? Math.min(...values) : 0,
    max = values.length ? Math.max(...values) : 1;
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return scaleLinear()
    .domain([min - pad, max + pad])
    .nice()
    .range([bottom, top]);
}
const y = computed(() => yScale()),
  yr = computed(() => yScale("right"));
// Limit drawing cost only: calculations and cursor lookup retain every observation.
function reducePoints(points: Point[]) {
  if (points.length <= 900) return points;
  const result: Point[] = [],
    size = Math.ceil(points.length / 225);
  for (let i = 0; i < points.length; i += size) {
    const group = points.slice(i, i + size);
    const values = valid(group);
    const selected = [group[0], group.at(-1)!];
    if (values.length)
      selected.push(
        values.reduce((a, b) => (a.value < b.value ? a : b)),
        values.reduce((a, b) => (a.value > b.value ? a : b)),
      );
    const gap = group.find((p) => p.value === null);
    if (gap) selected.push(gap);
    result.push(
      ...[...new Set(selected)].sort((a, b) => a.date.localeCompare(b.date)),
    );
  }
  return result;
}
function path(trace: Trace) {
  return (
    line<Point>()
      .defined((p) => p.value !== null)
      .x((p) => x.value(new Date(p.date)))
      .y((p) => (trace.axis ? yr.value : y.value)(p.value!))(
      reducePoints(trace.points),
    ) ?? ""
  );
}
function move(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect();
  hovered.value = Math.max(
    left,
    Math.min(right, ((event.clientX - box.left) / box.width) * width),
  );
}
const cursor = computed(() => {
  if (hovered.value === null) return [];
  const day = x.value.invert(hovered.value).getTime();
  return traces.value.flatMap((trace) => {
    const points = valid(trace.points);
    if (!points.length) return [];
    let lo = 0,
      hi = points.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (Date.parse(points[mid].date) < day) lo = mid + 1;
      else hi = mid;
    }
    const before = points[Math.max(0, lo - 1)],
      after = points[lo];
    const point =
      Math.abs(Date.parse(before.date) - day) <=
      Math.abs(Date.parse(after.date) - day)
        ? before
        : after;
    return [{ ...trace, point }];
  });
});
const sectors = computed(() =>
  props.spec.traces
    .flatMap((spec) => {
      const current = latest(
        transform(props.resolve(spec.id), props.sectorMode ?? "change"),
      );
      return current
        ? [
            {
              name: props.snapshot.series[spec.id]?.name ?? spec.id,
              ...current,
            },
          ]
        : [];
    })
    .sort((a, b) => b.value - a.value),
);
const sx = computed(() =>
  scaleLinear()
    .domain([
      Math.min(0, ...sectors.value.map((s) => s.value)),
      Math.max(1, ...sectors.value.map((s) => s.value)),
    ])
    .nice()
    .range([205, 650]),
);
const curves = computed(() =>
  [0, 1, 2].map((years, index) => {
    const cutoff = new Date(props.snapshot.generatedAt);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
    const until = cutoff.toISOString().slice(0, 10);
    return {
      name:
        years === 0
          ? "Último dato"
          : "Hace " + years + " año" + (years > 1 ? "s" : ""),
      color: colors[index],
      points: props.spec.traces.flatMap((s, i) => {
        const p = latest(props.resolve(s.id).filter((p) => p.date <= until));
        return p && (Date.parse(until) - Date.parse(p.date)) / 86400000 <= 10
          ? [{ ...p, maturity: [0.25, 2, 10, 30][i] }]
          : [];
      }),
    };
  }),
);
const cx = scaleLinear().domain([0, 30]).range([left, right]);
const cy = computed(() =>
  scaleLinear()
    .domain([
      0,
      Math.max(
        1,
        ...curves.value.flatMap((c) => c.points.map((p) => p.value)),
      ) * 1.1,
    ])
    .nice()
    .range([bottom, top]),
);
function curvePath(points: { maturity: number; value: number }[]) {
  return (
    line<{ maturity: number; value: number }>()
      .x((p) => cx(p.maturity))
      .y((p) => cy.value(p.value))(points) ?? ""
  );
}
const scatter = computed(() =>
  props.spec.kind === "scatter"
    ? capeRegression(props.resolve)
    : { points: [], model: null, estimate: null },
);
const scatterX = computed(() =>
  scaleLinear()
    .domain([0, Math.max(40, ...scatter.value.points.map((p) => p.x)) * 1.05])
    .range([left, right]),
);
const scatterY = computed(() =>
  scaleLinear()
    .domain([
      Math.min(-5, ...scatter.value.points.map((p) => p.y)),
      Math.max(15, ...scatter.value.points.map((p) => p.y)),
    ])
    .nice()
    .range([bottom, top]),
);
const regressionPath = computed(() => {
  const model = scatter.value.model;
  if (!model) return "";
  const xs = scatter.value.points.map((p) => p.x),
    min = Math.min(...xs),
    max = Math.max(...xs);
  return (
    line<number>()
      .x((v) => scatterX.value(v))
      .y((v) => scatterY.value(model.intercept + model.slope * Math.log(v)))(
      Array.from({ length: 80 }, (_, i) => min + ((max - min) * i) / 79),
    ) ?? ""
  );
});
</script>
<template>
  <div v-if="empty" class="chart-empty">
    <span class="empty-symbol">—</span>
    <strong>Datos no disponibles</strong>
    <span>Esta serie requiere una fuente habilitada o más histórico.</span>
  </div>
  <div v-else class="plot-container">
    <svg
      v-if="spec.kind === 'sectors'"
      :viewBox="'0 0 720 ' + Math.max(300, sectors.length * 30 + 20)"
      role="img"
      :aria-label="spec.title"
    >
      <line
        :x1="sx(0)"
        :x2="sx(0)"
        y1="5"
        :y2="sectors.length * 30 + 10"
        class="axis-line"
      />
      <g v-for="(sector, i) in sectors" :key="sector.name">
        <text x="195" :y="i * 30 + 24" text-anchor="end">
          {{ sector.name }}
        </text>
        <rect
          :x="sx(Math.min(0, sector.value))"
          :y="i * 30 + 8"
          :width="Math.max(1, Math.abs(sx(sector.value) - sx(0)))"
          height="20"
          rx="3"
          :fill="sector.value >= 0 ? '#0E9BA8' : '#E04444'"
        >
          <title>
            {{ sector.name }}: {{ number(sector.value) }}
            {{ sectorMode === "yoy" ? "%" : "mil" }} ·
            {{ dateLabel(sector.date) }}
          </title>
        </rect>
        <text x="665" :y="i * 30 + 24">{{ number(sector.value, 1) }}</text>
      </g>
    </svg>
    <svg
      v-else-if="spec.kind === 'curve'"
      viewBox="0 0 720 285"
      role="img"
      :aria-label="spec.title"
    >
      <g v-for="tick in cy.ticks(5)" :key="tick">
        <line
          :x1="left"
          :x2="right"
          :y1="cy(tick)"
          :y2="cy(tick)"
          class="grid-line"
        />
        <text :x="left - 12" :y="cy(tick) + 4" text-anchor="end">
          {{ number(tick, 1) }}
        </text>
      </g>
      <g v-for="curve in curves" :key="curve.name">
        <path
          :d="curvePath(curve.points)"
          :stroke="curve.color"
          class="series-line"
        />
        <circle
          v-for="point in curve.points"
          :key="point.maturity"
          :cx="cx(point.maturity)"
          :cy="cy(point.value)"
          r="4"
          :fill="curve.color"
        >
          <title>
            {{ curve.name }} · {{ point.maturity }} años:
            {{ number(point.value) }}% · {{ dateLabel(point.date) }}
          </title>
        </circle>
      </g>
      <text
        v-for="(m, i) in [0.25, 2, 10, 30]"
        :key="m"
        :x="cx(m)"
        y="254"
        text-anchor="middle"
      >
        {{ ["3m", "2a", "10a", "30a"][i] }}
      </text>
    </svg>
    <svg
      v-else-if="spec.kind === 'scatter'"
      viewBox="0 0 720 285"
      role="img"
      :aria-label="spec.title"
    >
      <g v-for="tick in scatterY.ticks(5)" :key="tick">
        <line
          :x1="left"
          :x2="right"
          :y1="scatterY(tick)"
          :y2="scatterY(tick)"
          class="grid-line"
        />
        <text :x="left - 10" :y="scatterY(tick) + 4" text-anchor="end">
          {{ number(tick, 0) }}%
        </text>
      </g>
      <circle
        v-for="p in scatter.points"
        :key="p.date"
        :cx="scatterX(p.x)"
        :cy="scatterY(p.y)"
        r="2.4"
        fill="#7257D8"
        opacity=".3"
      >
        <title>
          {{ dateLabel(p.date) }} · CAPE {{ number(p.x) }} · retorno
          {{ number(p.y) }}%
        </title>
      </circle>
      <path :d="regressionPath" class="series-line" stroke="#030942" />
      <text
        v-for="tick in scatterX.ticks(6)"
        :key="tick"
        :x="scatterX(tick)"
        y="254"
        text-anchor="middle"
      >
        {{ tick }}
      </text>
      <text x="360" y="279" text-anchor="middle">CAPE inicial</text>
    </svg>
    <svg
      v-else
      viewBox="0 0 720 285"
      role="img"
      :aria-label="spec.title"
      @pointermove="move"
      @pointerleave="hovered = null"
    >
      <defs>
        <clipPath :id="'clip-' + spec.id + (expanded ? '-expanded' : '')">
          <rect
            :x="left"
            :y="top"
            :width="right - left"
            :height="bottom - top"
          />
        </clipPath>
      </defs>
      <g v-for="tick in y.ticks(5)" :key="tick">
        <line
          :x1="left"
          :x2="right"
          :y1="y(tick)"
          :y2="y(tick)"
          class="grid-line"
        />
        <text :x="left - 10" :y="y(tick) + 4" text-anchor="end">
          {{ number(tick, Math.abs(tick) < 10 ? 1 : 0) }}
        </text>
      </g>
      <g v-if="spec.rightUnit">
        <text
          v-for="tick in yr.ticks(5)"
          :key="tick"
          :x="right + 9"
          :y="yr(tick) + 4"
        >
          {{ number(tick, 1) }}
        </text>
      </g>
      <line
        v-if="spec.baseline !== undefined"
        :x1="left"
        :x2="right"
        :y1="y(spec.baseline)"
        :y2="y(spec.baseline)"
        stroke="#C0892E"
        stroke-dasharray="5 4"
      />
      <g
        :clip-path="
          'url(#clip-' + spec.id + (expanded ? '-expanded' : '') + ')'
        "
      >
        <template v-for="(trace, i) in traces" :key="trace.id">
          <g v-if="spec.kind === 'bar' && i === 0">
            <rect
              v-for="point in valid(trace.points)"
              :key="point.date"
              :x="x(new Date(point.date)) - 2"
              :y="Math.min(y(0), y(point.value))"
              :width="
                Math.max(
                  2,
                  ((right - left) / Math.max(trace.points.length, 1)) * 0.65,
                )
              "
              :height="Math.max(1, Math.abs(y(point.value) - y(0)))"
              :fill="point.value >= 0 ? '#74BDFF' : '#E04444'"
            />
          </g>
          <path
            v-else
            :d="path(trace)"
            :stroke="trace.color"
            class="series-line"
          />
        </template>
      </g>
      <g v-for="tick in x.ticks(5)" :key="tick.toISOString()">
        <text :x="x(tick)" y="256" text-anchor="middle">
          {{ tick.toISOString().slice(0, 7) }}
        </text>
      </g>
      <g v-if="hovered !== null">
        <line
          :x1="hovered"
          :x2="hovered"
          :y1="top"
          :y2="bottom"
          stroke="#8C9099"
          stroke-dasharray="3 3"
        />
        <circle
          v-for="entry in cursor"
          :key="entry.id"
          :cx="x(new Date(entry.point.date))"
          :cy="(entry.axis ? yr : y)(entry.point.value)"
          r="4"
          :fill="entry.color"
          stroke="white"
        />
      </g>
    </svg>
    <div
      v-if="cursor.length && !special"
      class="chart-tooltip"
      aria-live="polite"
    >
      <div v-for="entry in cursor" :key="entry.id">
        <i :style="{ background: entry.color }"></i>{{ entry.label }}
        <b>{{ number(entry.point.value) }} {{ entry.unit }}</b
        ><small>{{ dateLabel(entry.point.date) }}</small>
      </div>
    </div>
    <label v-if="!special && expanded" class="cursor-control"
      >Explorar fechas con teclado
      <input
        type="range"
        min="0"
        max="100"
        value="100"
        @input="
          hovered =
            left +
            (Number(($event.target as HTMLInputElement).value) / 100) *
              (right - left)
        "
      />
    </label>
    <div v-if="spec.kind === 'curve'" class="legend">
      <span v-for="curve in curves" :key="curve.name"
        ><i :style="{ background: curve.color }"></i>{{ curve.name }}</span
      >
    </div>
    <div v-else-if="spec.kind === 'scatter'" class="chart-stat">
      {{
        scatter.model
          ? "R² " +
            number(scatter.model.r2) +
            " · " +
            scatter.model.count +
            " observaciones · histórico completo"
          : "Se requieren más de 200 pares para ajustar la regresión."
      }}
    </div>
    <div v-else-if="spec.kind !== 'sectors'" class="legend">
      <span v-for="trace in traces" :key="trace.id"
        ><i :style="{ background: trace.color }"></i>{{ trace.label }}
        <b>{{ number(latest(trace.points)?.value) }}</b></span
      >
    </div>
  </div>
</template>
