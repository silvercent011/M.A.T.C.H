<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ArrowRight, Briefcase, FileText } from "lucide-vue-next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";

interface BaseResume {
  id: number;
  resume_name: string;
  resume_text: string;
}

interface Job {
  id: number;
  job_title: string;
  job_description: string;
  status: "pending" | "processing" | "done" | "error";
  score_total: number | null;
}

const resumes = ref<BaseResume[]>([]);
const jobs = ref<Job[]>([]);
const isLoading = ref(true);

const stats = computed(() => {
  const completedJobs = jobs.value.filter((job) => job.status === "done").length;
  const averageScore = jobs.value
    .filter((job) => typeof job.score_total === "number")
    .reduce((sum, job, _, list) => sum + Number(job.score_total) / list.length, 0);

  return {
    totalResumes: resumes.value.length,
    totalJobs: jobs.value.length,
    completedJobs,
    averageScore,
  };
});

const recentJobs = computed(() => jobs.value.slice(0, 4));
const recentResumes = computed(() => resumes.value.slice(0, 3));

function statusLabel(status: Job["status"]) {
  const labels = {
    pending: "Pendente",
    processing: "Processando",
    done: "Concluído",
    error: "Erro",
  };

  return labels[status];
}

function statusClass(status: Job["status"]) {
  const classes = {
    pending: "bg-zinc-100 text-zinc-700",
    processing: "bg-sky-100 text-sky-700",
    done: "bg-emerald-100 text-emerald-700",
    error: "bg-rose-100 text-rose-700",
  };

  return classes[status];
}

async function fetchDashboardData() {
  isLoading.value = true;

  try {
    const [resumesResponse, jobsResponse] = await Promise.all([
      fetch("/api/base_resumes"),
      fetch("/api/jobs"),
    ]);

    const [resumesData, jobsData] = await Promise.all([
      resumesResponse.json(),
      jobsResponse.json(),
    ]);

    resumes.value = resumesData.resumes || [];
    jobs.value = jobsData.jobs || [];
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <SidebarInset>
    <header class="bg-background sticky top-0 z-10 flex shrink-0 items-center border-b px-4 py-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>

    <div class="flex flex-1 flex-col">
      <section class="border-b px-6 py-8 lg:px-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-2">
            <h1 class="text-3xl font-semibold tracking-tight">Visão geral do M.A.T.C.H</h1>
            <p class="max-w-xl text-sm text-muted-foreground">
              Acompanhe currículos base, vagas cadastradas e o próximo passo.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <Button as="a" href="/resumes">
              Currículos
              <ArrowRight />
            </Button>
            <Button as="a" href="/jobs" variant="outline">
              Vagas
              <ArrowRight />
            </Button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4 lg:px-8">
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Currículos base</CardDescription>
            <CardTitle class="text-2xl">{{ stats.totalResumes }}</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">Prontos para uso.</CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Vagas</CardDescription>
            <CardTitle class="text-2xl">{{ stats.totalJobs }}</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">Já cadastradas.</CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Concluídas</CardDescription>
            <CardTitle class="text-2xl">{{ stats.completedJobs }}</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">Finalizadas com sucesso.</CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Score médio</CardDescription>
            <CardTitle class="text-2xl">
              {{ stats.averageScore ? `${stats.averageScore.toFixed(1)}/10` : "--" }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">Das vagas avaliadas.</CardContent>
        </Card>
      </section>

      <section class="grid gap-6 px-6 pb-6 lg:grid-cols-2 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Vagas recentes</CardTitle>
            <CardDescription>Últimos envios.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-if="isLoading"
              class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
            >
              Carregando vagas...
            </div>
            <div
              v-else-if="recentJobs.length === 0"
              class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
            >
              Nenhuma vaga cadastrada ainda.
            </div>
            <a
              v-for="job in recentJobs"
              v-else
              :key="job.id"
              :href="`/jobs/${job.id}`"
              class="block rounded-lg border p-4 transition-colors hover:bg-accent/40"
            >
              <div class="mb-2 flex items-center gap-2">
                <Briefcase class="size-4 text-muted-foreground" />
                <h3 class="truncate text-sm font-medium">{{ job.job_title }}</h3>
              </div>
              <div class="mb-2">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="statusClass(job.status)"
                >
                  {{ statusLabel(job.status) }}
                </span>
              </div>
              <p class="line-clamp-2 text-sm text-muted-foreground">{{ job.job_description }}</p>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currículos recentes</CardTitle>
            <CardDescription>Base disponível para novas otimizações.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-if="isLoading"
              class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
            >
              Carregando currículos...
            </div>
            <div
              v-else-if="recentResumes.length === 0"
              class="rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
            >
              Nenhum currículo base cadastrado ainda.
            </div>
            <a
              v-for="resume in recentResumes"
              v-else
              :key="resume.id"
              :href="`/resumes/${resume.id}`"
              class="block rounded-lg border p-4 transition-colors hover:bg-accent/40"
            >
              <div class="mb-2 flex items-center gap-2">
                <FileText class="size-4 text-muted-foreground" />
                <p class="truncate text-sm font-medium">{{ resume.resume_name }}</p>
              </div>
              <p class="line-clamp-3 whitespace-break-spaces text-sm text-muted-foreground">
                {{ resume.resume_text }}
              </p>
            </a>
          </CardContent>
        </Card>
      </section>

      <section class="px-6 pb-8 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Próxima ação</CardTitle>
            <CardDescription>
              {{
                stats.totalResumes === 0
                  ? "Crie um currículo base para começar."
                  : "Abra vagas ou revise os currículos cadastrados."
              }}
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-3 sm:flex-row">
            <Button as="a" :href="stats.totalResumes === 0 ? '/resumes' : '/jobs'">
              {{ stats.totalResumes === 0 ? "Abrir currículos" : "Abrir vagas" }}
              <ArrowRight />
            </Button>
            <Button as="a" href="/resumes" variant="outline">Ver currículos</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  </SidebarInset>
</template>
