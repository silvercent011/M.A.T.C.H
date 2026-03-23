<script setup lang="ts">
import SidebarProvider from "./components/ui/sidebar/SidebarProvider.vue";
import AppSidebar from "@/components/AppSidebar.vue";
import ResumeSidebar from "@/components/ResumeSidebar.vue";
import JobSidebar from "@/components/JobSidebar.vue";
</script>

<template>
  <SidebarProvider
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
