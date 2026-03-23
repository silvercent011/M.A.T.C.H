<script setup lang="ts">
import SidebarProvider from "./components/ui/sidebar/SidebarProvider.vue";
import AppSidebar from "@/components/AppSidebar.vue";
import ResumeSidebar from "@/components/ResumeSidebar.vue";
</script>

<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <AppSidebar ref="sidebarRef">
      <ResumeSidebar v-if="$route.path.startsWith('/resumes')" />
    </AppSidebar>
    <RouterView />
  </SidebarProvider>
</template>
