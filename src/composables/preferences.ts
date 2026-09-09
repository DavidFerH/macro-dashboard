import { ref, watch } from "vue";
export function preference<T extends string | number | boolean>(
  key: string,
  fallback: T,
  allowed: T[],
) {
  let initial = fallback;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (allowed.includes(stored as T)) initial = stored as T;
  } catch {
    /* Storage may be unavailable; preferences still work in memory. */
  }
  const state = ref<T>(initial);
  watch(state, (value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Optional persistence. */
    }
  });
  return state;
}
