<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { ChartSpec, Point, Snapshot } from "../domain/types";
import ChartPlot from "./ChartPlot.vue";
import PeriodControl from "./PeriodControl.vue";
defineProps<{
  spec: ChartSpec;
  snapshot: Snapshot;
  resolve: (id: string) => Point[];
}>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>(),
  years = ref(0);
const sectorMode = ref<"change" | "ma3change" | "yoy">("change");
const sectorModes = [
  { value: "change" as const, label: "Mes" },
  { value: "ma3change" as const, label: "3m" },
  { value: "yoy" as const, label: "12m %" },
];
let previousFocus: HTMLElement | null = null,
  overflow = "";
onMounted(() => {
  previousFocus = document.activeElement as HTMLElement;
  overflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  dialog.value?.showModal();
});
onUnmounted(() => {
  document.body.style.overflow = overflow;
  previousFocus?.focus();
});
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return;
  const box = dialog.value!.getBoundingClientRect();
  if (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
    emit("close");
}
</script>
<template>
  <dialog
    ref="dialog"
    class="chart-modal"
    aria-labelledby="modal-title"
    @cancel.prevent="$emit('close')"
    @click="backdrop"
  >
    <div class="modal-heading">
      <div>
        <p class="eyebrow">Vista ampliada</p>
        <h2 id="modal-title">{{ spec.title }}</h2>
      </div>
      <button
        class="close-button"
        aria-label="Cerrar gráfico"
        autofocus
        @click="$emit('close')"
      >
        ×
      </button>
    </div>
    <PeriodControl
      v-if="!['curve', 'scatter', 'sectors'].includes(spec.kind ?? '')"
      v-model="years"
      label="Periodo del gráfico ampliado"
    />
    <div
      v-if="spec.kind === 'sectors'"
      class="segmented"
      role="group"
      aria-label="Medida sectorial ampliada"
    >
      <button
        v-for="mode in sectorModes"
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
      expanded
    />
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
    <div class="learn-note">
      <p><b>Qué mide.</b> {{ spec.learn.what }}</p>
      <p><b>Cómo leerlo.</b> {{ spec.learn.read }}</p>
      <p><b>Ten en cuenta.</b> {{ spec.learn.caution }}</p>
    </div>
  </dialog>
</template>
