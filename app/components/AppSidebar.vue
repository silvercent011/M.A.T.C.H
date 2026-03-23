<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar";
import { Briefcase, FileText } from "lucide-vue-next";
import { h } from "vue";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
});

// Navigation state
const navMain = [
  {
    title: "Currículos",
    path: "/resumes",
    icon: FileText,
    isActive: true,
  },
  {
    title: "Vagas",
    path: "/jobs",
    icon: Briefcase,
    isActive: false,
  },
];
</script>

<template>
  <Sidebar class="*:data-[sidebar=sidebar]:flex-row" v-bind="props">
    <!-- Coluna de ícones (Sidebar Primária) -->
    <Sidebar collapsible="none" class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child class="md:h-8 md:p-0">
              <a href="#">
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold"
                >
                  M
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">M.A.T.C.H</span>
                  <span class="truncate text-xs">ATS Handler</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navMain" :key="item.title">
                <SidebarMenuButton
                  :tooltip="h('div', { hidden: false }, item.title)"
                  :is-active="$route.path === item.path"
                  class="px-2.5 md:px-2"
                  @click="$router.push(item.path)"
                >
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <div class="flex flex-col w-full overflow-hidden" style="--sidebar-width: 100%">
      <slot />
    </div>
  </Sidebar>
</template>
