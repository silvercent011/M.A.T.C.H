<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useSidebar } from "./ui/sidebar";
import { useRoute, useRouter } from "vue-router";
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

const jobs = ref<any[]>([]);
const activeJob = ref<any | null>(null);
const searchQuery = ref("");

const filteredJobs = computed(() => {
  if (!searchQuery.value) return jobs.value;
  return jobs.value.filter((j) =>
    j.job_title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

const { setOpen } = useSidebar();
const router = useRouter();

async function fetchJobs() {
  try {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    jobs.value = data.jobs || [];

    if (jobs.value.length > 0) {
      if (!activeJob.value || !jobs.value.find((j) => j.id === activeJob.value.id)) {
        // don't auto-select; just update list
      } else {
        activeJob.value = jobs.value.find((j) => j.id === activeJob.value.id);
      }
    } else {
      activeJob.value = null;
    }
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
  }
}

function selectJob(job: any) {
  router.push(`/jobs/${job.id}`);
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

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pendente",
    processing: "Processando...",
    done: "Concluído",
    error: "Erro",
  };
  return map[status] ?? status;
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: "text-muted-foreground",
    processing: "text-blue-500 animate-pulse",
    done: "text-green-500",
    error: "text-destructive",
  };
  return map[status] ?? "";
}

onMounted(() => {
  fetchJobs();
});

const openCreateDialog = ref(false);
const isCreating = ref(false);
const baseResumes = ref<any[]>([]);

const createForm = ref({
  job_title: "",
  job_description: "",
  base_resume_id: "",
  job_url: "",
});

async function fetchBaseResumes() {
  try {
    const res = await fetch("/api/base_resumes");
    const data = await res.json();
    baseResumes.value = data.resumes || [];
  } catch (error) {
    console.error("Failed to fetch base resumes:", error);
  }
}

async function openDialog() {
  await fetchBaseResumes();
  openCreateDialog.value = true;
}

async function createJob() {
  if (
    !createForm.value.job_title ||
    !createForm.value.job_description ||
    !createForm.value.base_resume_id
  )
    return;

  isCreating.value = true;
  try {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm.value),
    });

    if (res.ok) {
      const data = await res.json();
      openCreateDialog.value = false;
      createForm.value = { job_title: "", job_description: "", base_resume_id: "", job_url: "" };
      await fetchJobs();
      selectJob(data.job);
    }
  } catch (error) {
    console.error("Failed to create job:", error);
  } finally {
    isCreating.value = false;
  }
}
</script>

<template>
  <Sidebar collapsible="none" class="hidden flex-1 md:flex md:flex-col w-full">
    <SidebarHeader class="gap-3.5 border-b p-4">
      <div class="flex w-full items-center justify-between">
        <div class="text-base font-medium text-foreground flex items-center gap-2">Vagas</div>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup class="px-0">
        <SidebarGroupContent>
          <!-- Create New button -->
          <button
            @click="openDialog"
            class="w-full text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-center gap-2 border-b p-4 text-sm font-medium text-primary transition-colors"
          >
            + Nova Vaga
          </button>

          <div
            v-if="filteredJobs.length === 0"
            class="p-4 text-center text-sm text-muted-foreground"
          >
            Nenhuma vaga encontrada.
          </div>

          <button
            v-for="job in filteredJobs"
            :key="job.id"
            @click="selectJob(job)"
            class="w-full text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight transition-colors last:border-b-0"
            :class="
              activeJob?.id === job.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            "
          >
            <div class="flex w-full items-center gap-2">
              <span class="font-medium truncate">{{ job.job_title }}</span>
              <span class="ml-auto text-xs whitespace-nowrap" :class="statusClass(job.status)">
                {{ statusLabel(job.status) }}
              </span>
            </div>
            <div class="flex w-full items-center gap-2">
              <span
                class="line-clamp-1 w-[200px] whitespace-break-spaces text-xs text-muted-foreground"
              >
                {{ job.job_description }}
              </span>
              <span class="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                {{ formatDate(job.updated_at) }}
              </span>
            </div>
          </button>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>

  <Dialog v-model:open="openCreateDialog">
    <DialogContent class="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nova Vaga</DialogTitle>
        <DialogDescription>
          Cole a descrição da vaga e selecione o currículo base. O agente ATS irá otimizar
          automaticamente.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="createJob">
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label htmlFor="job-title">Título da Vaga</Label>
            <Input
              id="job-title"
              v-model="createForm.job_title"
              required
              placeholder="Ex: Engenheiro de Software Sênior — TechCorp"
            />
          </div>
          <div class="grid gap-2">
            <Label htmlFor="job-url">Link da Vaga <span class="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
            <Input
              id="job-url"
              v-model="createForm.job_url"
              type="url"
              placeholder="https://linkedin.com/jobs/..."
            />
          </div>
          <div class="grid gap-2">
            <Label htmlFor="base-resume">Currículo Base</Label>
            <select
              id="base-resume"
              v-model="createForm.base_resume_id"
              required
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" disabled>Selecione um currículo base</option>
              <option v-for="r in baseResumes" :key="r.id" :value="String(r.id)">
                {{ r.resume_name }}
              </option>
            </select>
          </div>
          <div class="grid gap-2">
            <Label htmlFor="job-description">Descrição da Vaga</Label>
            <Textarea
              id="job-description"
              v-model="createForm.job_description"
              required
              rows="12"
              class="font-mono text-sm resize-none"
              placeholder="Cole aqui a descrição completa da vaga..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="openCreateDialog = false"
            >Cancelar</Button
          >
          <Button type="submit" :disabled="isCreating">
            {{ isCreating ? "Criando..." : "Criar Vaga" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
