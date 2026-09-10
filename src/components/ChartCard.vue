<script setup lang="ts">
import { computed, ref } from "vue";
import type { ChartSpec, Point, Snapshot } from "../domain/types";
import ChartPlot from "./ChartPlot.vue";
import { dateLabel } from "../domain/format";
import { latest } from "../domain/series";
import { sourceStatus } from "../domain/source-status";
const props = defineProps<{
  spec: ChartSpec;
  snapshot: Snapshot;
  resolve: (id: string) => Point[];
  years: number;
  learn: boolean;
}>();
defineEmits<{ expand: [spec: ChartSpec] }>();
const sectorMode = ref<"change" | "ma3change" | "yoy">("change");
const modes = [
  { value: "change" as const, label: "Mes" },
  { value: "ma3change" as const, label: "3m" },
  { value: "yoy" as const, label: "12m %" },
];
const dates = computed(() =>
  props.spec.traces
    .map((t) => latest(props.resolve(t.id))?.date)
    .filter((d): d is string => !!d)
    .sort(),
);
const missing = computed(() =>
  props.spec.traces.filter(
    (t) => !props.resolve(t.id).some((p) => p.value !== null),
  ),
);
</script>
<template>
  <article class="chart-card" :data-chart="spec.id">
    <div class="card-heading">
      <div>
        <h3>{{ spec.title }}</h3>
        <p>
          {{ spec.unit
          }}<template v-if="spec.rightUnit">
            · eje derecho: {{ spec.rightUnit }}</template
          >
        </p>
      </div>
      <button
        class="expand-button"
        :aria-label="'Ampliar ' + spec.title"
        @click="$emit('expand', spec)"
      >
        ↗
      </button>
    </div>
    <div
      v-if="spec.kind === 'sectors'"
      class="segmented compact"
      role="group"
      aria-label="Medida sectorial"
    >
      <button
        v-for="mode in modes"
        :key="mode.value"
        :aria-pressed="sectorMode === mode.value"
        :class="{ active: sectorMode === mode.value }"
        @click="sectorMode = mode.value"
      >
        {{ mode.label }}
      </button>
    </div>
    <ChartPlot
      :spec="spec"
      :snapshot="snapshot"
      :resolve="resolve"
      :years="years"
      :sector-mode="sectorMode"
    />
    <div class="chart-meta">
      <span>{{ dateLabel(dates.at(-1)) }}</span
      ><span v-if="spec.years">Ventana fija · {{ spec.years }} años</span>
    </div>
    <p v-if="missing.length" class="missing-note">
      Sin cobertura:
      {{
        missing
          .map((t) => {
            const source = snapshot.series[t.id];
            return source
              ? `${source.name} (${sourceStatus(source)})`
              : (t.label ?? t.id);
          })
          .join(", ")
      }}.
      <a href="#sources">Ver causas y fuentes</a>
    </p>
    <p
      v-for="trace in spec.traces.filter(
        (t) => snapshot.series[t.id]?.attribution,
      )"
      :key="trace.id"
      class="meta"
    >
      <a
        :href="snapshot.series[trace.id].url"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ snapshot.series[trace.id].attribution }}
      </a>
    </p>
    <div v-if="learn" class="learn-note">
      <p><b>Qué mide.</b> {{ spec.learn.what }}</p>
      <p><b>Cómo leerlo.</b> {{ spec.learn.read }}</p>
      <p><b>Ten en cuenta.</b> {{ spec.learn.caution }}</p>
    </div>
  </article>
</template>
