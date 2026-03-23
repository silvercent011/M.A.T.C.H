<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSidebar } from "./ui/sidebar";
import { FileText } from "lucide-vue-next";
import { useRouter } from "vue-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "./ui/button/Button.vue";

const resumes = ref<any[]>([]);
const activeResume = ref<any | null>(null);
const searchQuery = ref("");

const filteredResumes = computed(() => {
  if (!searchQuery.value) return resumes.value;
  return resumes.value.filter((r) =>
    r.resume_name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

const { setOpen } = useSidebar();

const router = useRouter();

async function fetchResumes() {
  try {
    const res = await fetch("/api/base_resumes");
    const data = await res.json();
    resumes.value = data.resumes || [];

    if (resumes.value.length > 0) {
      if (!activeResume.value || !resumes.value.find((r) => r.id === activeResume.value.id)) {
        selectResume(resumes.value[0]);
      } else {
        activeResume.value = resumes.value.find((r) => r.id === activeResume.value.id);
      }
    } else {
      activeResume.value = null;
    }
  } catch (error) {
    console.error("Failed to fetch resumes:", error);
  }
}

function selectResume(resume: any) {
  activeResume.value = resume;
  setOpen(true);
  router.push(`/resumes/${resume.id}`);
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const activeMenu = ref({
  title: "Currículos",
  icon: FileText,
  isActive: true,
});

onMounted(() => {
  fetchResumes();
});

defineExpose({
  refresh: fetchResumes,
  selectResume,
});

const openCreateDialog = ref(false);
const isCreating = ref(false);
const createForm = ref({
  resume_name: "",
  resume_text: "",
});

async function createResume() {
  if (!createForm.value.resume_name || !createForm.value.resume_text) return;

  isCreating.value = true;
  try {
    const res = await fetch("/api/base_resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm.value),
    });

    if (res.ok) {
      openCreateDialog.value = false;
      createForm.value = { resume_name: "", resume_text: "" };
      fetchResumes();
    }
  } catch (error) {
    console.error("Failed to create resume", error);
  } finally {
    isCreating.value = false;
  }
}
</script>

<template>
  <Sidebar collapsible="none" class="hidden flex-1 md:flex md:flex-col w-full">
    <SidebarHeader class="gap-3.5 border-b p-4">
      <div class="flex w-full items-center justify-between">
        <div class="text-base font-medium text-foreground">
          {{ activeMenu.title }}
        </div>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup class="px-0">
        <SidebarGroupContent>
          <!-- Create New button -->
          <button
            @click="openCreateDialog = true"
            class="w-full text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-center gap-2 border-b p-4 text-sm font-medium text-primary transition-colors"
          >
            + Novo Currículo Base
          </button>

          <div
            v-if="filteredResumes.length === 0"
            class="p-4 text-center text-sm text-muted-foreground"
          >
            Nenhum currículo encontrado.
          </div>

          <button
            v-for="resume in filteredResumes"
            :key="resume.id"
            @click="selectResume(resume)"
            class="w-full text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight transition-colors last:border-b-0"
            :class="
              activeResume?.id === resume.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : ''
            "
          >
            <div class="flex w-full items-center gap-2">
              <span class="font-medium truncate">{{ resume.resume_name }}</span>
              <span class="ml-auto text-xs text-muted-foreground whitespace-nowrap">{{
                formatDate(resume.updated_at)
              }}</span>
            </div>
            <span
              class="line-clamp-2 w-[260px] whitespace-break-spaces text-xs text-muted-foreground"
            >
              {{ resume.resume_text }}
            </span>
          </button>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>

  <Dialog v-model:open="openCreateDialog">
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Novo Currículo Base</DialogTitle>
        <DialogDescription>
          Crie um currículo base em Markdown. Ele será usado futuramente pelo agente ATS para gerar
          versões otimizadas.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="createResume">
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label htmlFor="name">Nome identificador</Label>
            <Input
              id="name"
              v-model="createForm.resume_name"
              required
              placeholder="Ex: Backend Pleno, Frontend Senior"
            />
          </div>
          <div class="grid gap-2">
            <Label htmlFor="content">Conteúdo (Markdown)</Label>
            <Textarea
              id="content"
              v-model="createForm.resume_text"
              required
              rows="15"
              class="font-mono text-sm resize-none"
              placeholder="# João Silva&#10;&#10;## Resumo&#10;Desenvolvedor..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="openCreateDialog = false"
            >Cancelar</Button
          >
          <Button type="submit" :disabled="isCreating">
            {{ isCreating ? "Criando..." : "Criar Currículo" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
