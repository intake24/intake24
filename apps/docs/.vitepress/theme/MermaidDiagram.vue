<script setup lang="ts">
import mermaid from 'mermaid';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
  graph: string;
}>();

const svg = ref('');
const error = ref('');
const source = ref('');
const id = `mermaid-${Math.random().toString(36).slice(2)}`;

mermaid.initialize({
  securityLevel: 'loose',
  startOnLoad: false,
});

async function renderDiagram() {
  source.value = decodeURIComponent(props.graph);
  error.value = '';

  try {
    const rendered = await mermaid.render(id, source.value);
    svg.value = rendered.svg;
  }
  catch (err) {
    svg.value = '';
    error.value = err instanceof Error ? err.message : String(err);
  }
}

onMounted(renderDiagram);
watch(() => props.graph, renderDiagram);
</script>

<template>
  <figure class="mermaid-diagram">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="svg" class="mermaid-diagram__svg" v-html="svg" />
    <pre v-else class="mermaid-diagram__fallback"><code>{{ error || source }}</code></pre>
  </figure>
</template>
