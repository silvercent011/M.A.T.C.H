<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useRoute, useRouter } from "vue-router";
import { Download, FileDown } from "lucide-vue-next";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";

const router = useRouter();
const route = useRoute();

const job = ref<any | null>(null);
const isDeleting = ref(false);
const isRetrying = ref(false);
const activeTab = ref<"requirements" | "audit" | "resume" | "score" | "final" | "description">("resume");

let pollInterval: ReturnType<typeof setInterval> | null = null;

async function fetchJob() {
  const res = await fetch(`/api/jobs/${route.params.id}`);
  const data = await res.json();
  job.value = data.job;
}

function startPolling() {
  pollInterval = setInterval(async () => {
    await fetchJob();
    if (job.value?.status !== "processing") {
      stopPolling();
    }
  }, 3000);
}

function stopPolling() {
  if (pollInterval !== null) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function deleteJob() {
  if (!job.value) return;

  isDeleting.value = true;
  try {
    const res = await fetch(`/api/jobs/${job.value.id}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/jobs");
    }
  } catch (error) {
    console.error("Failed to delete job", error);
  } finally {
    isDeleting.value = false;
  }
}

async function retryJob() {
  if (!job.value) return;

  isRetrying.value = true;
  try {
    const res = await fetch(`/api/jobs/${job.value.id}/retry`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      job.value = data.job;
      startPolling();
    }
  } catch (error) {
    console.error("Failed to retry job", error);
  } finally {
    isRetrying.value = false;
  }
}

async function downloadMarkdown() {
  if (!job.value || !job.value.optimized_resume) return;

  const blob = new Blob([job.value.optimized_resume], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const sanitizedName = job.value.job_title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_ATS";
  a.download = `${sanitizedName}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

const isExportingPdf = ref(false);

async function exportPdf() {
  if (!job.value) return;

  isExportingPdf.value = true;
  try {
    const res = await fetch(`/api/jobs/${job.value.id}/pdf`);

    if (!res.ok) {
      throw new Error("Failed to generate PDF");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sanitizedName = job.value.job_title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_ATS";
    a.download = `${sanitizedName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export PDF", error);
    alert("Erro ao exportar PDF. Tente novamente.");
  } finally {
    isExportingPdf.value = false;
  }
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
    pending: "bg-muted text-muted-foreground",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse",
    done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    error: "bg-destructive/10 text-destructive",
  };
  return map[status] ?? "";
}

const scoreColor = computed(() => {
  const s = job.value?.score_total ?? 0;
  if (s >= 90) return "text-green-500";
  if (s >= 70) return "text-yellow-500";
  return "text-destructive";
});

onMounted(async () => {
  await fetchJob();
  if (job.value?.status === "processing") {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

watch(
  () => route.params.id,
  async () => {
    await fetchJob();
  },
);
</script>

<template>
  <SidebarInset>
    <header class="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem class="hidden md:block">
            <BreadcrumbLink href="#">M.A.T.C.H</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator class="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbLink href="/jobs">Vagas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{{ job ? job.job_title : "Carregando..." }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>

    <div class="flex flex-1 flex-col gap-4 p-4 h-[calc(100vh-73px)] overflow-hidden">
      <div v-if="job" class="flex flex-1 flex-col gap-4 min-h-0">
        <!-- Title + actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex flex-col gap-0.5 min-w-0">
              <h2 class="text-2xl font-bold tracking-tight truncate">
                {{ job.job_title }}
              </h2>
              <a
                v-if="job.job_url"
                :href="job.job_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-primary hover:underline inline-flex items-center gap-1 w-fit"
              >
                Ver vaga original ↗
              </a>
            </div>
            <span
              class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="statusClass(job.status)"
            >
              {{ statusLabel(job.status) }}
            </span>
          </div>
          <div class="flex gap-2 shrink-0">
            <Button variant="destructive" @click="deleteJob" :disabled="isDeleting">
              {{ isDeleting ? "Deletando..." : "Deletar" }}
            </Button>
          </div>
        </div>

        <!-- Score banner -->
        <div
          v-if="job.status === 'done' && job.score_total !== null"
          class="rounded-lg border bg-card p-4 flex items-center gap-4"
        >
          <div class="text-5xl font-bold" :class="scoreColor">{{ job.score_total }}%</div>
          <div>
            <p class="text-sm font-medium">Score de Compatibilidade ATS</p>
            <p class="text-xs text-muted-foreground">
              Baseado em palavras-chave, requisitos cobertos, métricas, formatação e conformidade ATS.
            </p>
          </div>
        </div>

        <!-- Processing placeholder -->
        <div
          v-if="job.status === 'processing'"
          class="rounded-lg border bg-card p-8 flex flex-col items-center gap-4 text-center"
        >
          <div
            class="size-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
          />
          <p class="font-medium">Agente ATS trabalhando...</p>
          <p class="text-sm text-muted-foreground">
            O pipeline está analisando a vaga e otimizando seu currículo. Isso pode levar de 1 a 3
            minutos.
          </p>
        </div>

        <!-- Error state -->
        <div
          v-if="job.status === 'error'"
          class="rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive flex flex-col gap-3"
        >
          <div>
            <p class="font-medium">O pipeline ATS encontrou um erro.</p>
            <p class="text-sm mt-1 opacity-80">O agente falhou ao processar esta vaga.</p>
          </div>
          <div>
            <Button variant="destructive" @click="retryJob" :disabled="isRetrying">
              {{ isRetrying ? "Tentando..." : "Tentar novamente" }}
            </Button>
          </div>
        </div>

        <!-- Tabs: done state -->
        <div v-if="job.status === 'done'" class="flex flex-1 flex-col gap-0 min-h-0">
          <!-- Tab buttons and Actions -->
          <div class="flex items-center justify-between border-b">
            <div class="flex gap-1">
              <button
                v-for="tab in [
                  { key: 'resume', label: 'Currículo Otimizado' },
                  { key: 'requirements', label: 'Mapa de Requisitos' },
                  { key: 'audit', label: 'Auditoria' },
                  { key: 'score', label: 'Score & Conformidade' },
                  { key: 'final', label: 'Resumo Final' },
                  { key: 'description', label: 'Descrição da Vaga' },
                ]"
                :key="tab.key"
                @click="activeTab = tab.key as any"
                class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
                :class="
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                "
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Export Actions (only visible when viewing optimized resume) -->
            <div v-show="activeTab === 'resume'" class="flex gap-2 pb-2">
              <Button
                size="sm"
                variant="outline"
                @click="downloadMarkdown"
                :disabled="isExportingPdf"
              >
                <FileDown class="w-4 h-4 mr-2" />
                Markdown
              </Button>
              <Button size="sm" variant="outline" @click="exportPdf" :disabled="isExportingPdf">
                <Download class="w-4 h-4 mr-2" />
                {{ isExportingPdf ? "Gerando..." : "PDF" }}
              </Button>
            </div>
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-auto mt-4 min-h-0">
            <MarkdownRenderer
              v-if="activeTab === 'resume'"
              :content="job.optimized_resume"
              class="bg-muted rounded-lg p-4"
            />
            <MarkdownRenderer
              v-else-if="activeTab === 'requirements'"
              :content="job.job_requirements_map"
              class="bg-muted rounded-lg p-4"
            />
            <MarkdownRenderer
              v-else-if="activeTab === 'audit'"
              :content="job.audit_report"
              class="bg-muted rounded-lg p-4"
            />
            <MarkdownRenderer
              v-else-if="activeTab === 'score'"
              :content="job.score_breakdown"
              class="bg-muted rounded-lg p-4"
            />
            <MarkdownRenderer
              v-else-if="activeTab === 'final'"
              :content="job.final_output"
              class="bg-muted rounded-lg p-4"
            />
            <pre
              v-else-if="activeTab === 'description'"
              class="whitespace-pre-wrap text-sm text-muted-foreground bg-muted rounded-lg p-4"
              >{{ job.job_description }}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </SidebarInset>
</template>
