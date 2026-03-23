<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SidebarProvider from "./components/ui/sidebar/SidebarProvider.vue";
import AppSidebar from "@/components/AppSidebar.vue";
import ResumeSidebar from "@/components/ResumeSidebar.vue";
import JobSidebar from "@/components/JobSidebar.vue";

const route = useRoute();
const sidebarOpen = ref(true);
const isDashboardRoute = computed(() => route.path === "/");

watch(
  isDashboardRoute,
  (isDashboard) => {
    if (isDashboard) {
      sidebarOpen.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <SidebarProvider
    v-model:open="sidebarOpen"
    :disabled="isDashboardRoute"
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <AppSidebar>
      <ResumeSidebar v-if="$route.path.startsWith('/resumes')" />
      <JobSidebar v-if="$route.path.startsWith('/jobs')" />
    </AppSidebar>
    <RouterView />
  </SidebarProvider>
</template>
