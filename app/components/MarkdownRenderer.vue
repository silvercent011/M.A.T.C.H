<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";

const props = defineProps<{ content: string | null; class?: string }>();
const html = computed(() => (props.content ? (marked.parse(props.content) as string) : ""));
</script>

<template>
  <div
    class="prose prose-sm dark:prose-invert max-w-none overflow-auto"
    :class="props.class"
    v-html="html"
  />
</template>
