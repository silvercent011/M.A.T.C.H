<script setup lang="ts">
import {
  defaultDocument,
  useEventListener,
  useMediaQuery,
  useVModel,
} from "@vueuse/core";
import { TooltipProvider } from "reka-ui";
import type { HTMLAttributes, Ref } from "vue";
import { computed, ref, watch } from "vue";
import { cn } from "~/lib/utils";
import {
  provideSidebarContext,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
} from "./utils";

const props = withDefaults(
  defineProps<{
    defaultOpen?: boolean;
    open?: boolean;
    disabled?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  {
    defaultOpen: !defaultDocument?.cookie.includes(
      `${SIDEBAR_COOKIE_NAME}=false`,
    ),
    open: undefined,
    disabled: false,
  },
);

const emits = defineEmits<{
  "update:open": [open: boolean];
}>();

const isMobile = useMediaQuery("(max-width: 768px)");
const openMobile = ref(false);

const open = useVModel(props, "open", emits, {
  defaultValue: props.defaultOpen ?? false,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>;

function setOpen(value: boolean) {
  if (props.disabled) {
    open.value = false;
    return;
  }

  open.value = value;

  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open.value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
}

function setOpenMobile(value: boolean) {
  if (props.disabled) {
    openMobile.value = false;
    return;
  }

  openMobile.value = value;
}

// Helper to toggle the sidebar.
function toggleSidebar() {
  if (props.disabled) {
    setOpen(false);
    setOpenMobile(false);
    return;
  }

  return isMobile.value
    ? setOpenMobile(!openMobile.value)
    : setOpen(!open.value);
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      open.value = false;
      openMobile.value = false;
    }
  },
  { immediate: true },
);

useEventListener("keydown", (event: KeyboardEvent) => {
  if (
    event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
    (event.metaKey || event.ctrlKey)
  ) {
    event.preventDefault();
    toggleSidebar();
  }
});

const state = computed(() => (open.value ? "expanded" : "collapsed"));

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
});
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      data-slot="sidebar-wrapper"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH,
        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
      }"
      :class="
        cn(
          'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
          props.class,
        )
      "
      v-bind="$attrs"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>
