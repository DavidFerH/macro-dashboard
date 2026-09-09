<script setup lang="ts">
defineProps<{ modelValue: number; label?: string }>();
defineEmits<{ "update:modelValue": [value: number] }>();
const periods = [
  { label: "3A", value: 3 },
  { label: "5A", value: 5 },
  { label: "10A", value: 10 },
  { label: "Todo", value: 0 },
];
</script>
<template>
  <div
    class="segmented"
    role="group"
    :aria-label="label ?? 'Periodo histórico'"
  >
    <button
      v-for="period in periods"
      :key="period.value"
      :aria-pressed="modelValue === period.value"
      :class="{ active: modelValue === period.value }"
      @click="$emit('update:modelValue', period.value)"
    >
      {{ period.label }}
    </button>
  </div>
</template>
