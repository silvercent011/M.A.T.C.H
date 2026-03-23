<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Briefcase, FileText, LayoutDashboard } from "lucide-vue-next";
import { h } from "vue";

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
});

// Navigation state
const navMain = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    isActive: false,
  },
  {
    title: "Currículos",
    path: "/resumes",
    icon: FileText,
    isActive: false,
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
    <Sidebar
      collapsible="none"
      class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navMain" :key="item.title">
                <SidebarMenuButton
                  :tooltip="h('div', { hidden: false }, item.title)"
                  :is-active="
                    item.path === '/'
                      ? $route.path === '/'
                      : $route.path.startsWith(item.path)
                  "
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
    <div
      class="flex flex-col w-full overflow-hidden"
      style="--sidebar-width: 100%"
    >
      <slot />
    </div>
  </Sidebar>
</template>
