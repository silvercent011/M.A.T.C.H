<script setup lang="ts">
import { onMounted, ref } from "vue";
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
import { Textarea } from "~~/app/components/ui/textarea";
import { Download, FileDown } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();

const activeResume = ref<any | null>(null);

const editForm = ref({
  resume_text: "",
});
const isSaving = ref(false);
const isDeleting = ref(false);

async function fetchResume() {
  const res = await fetch(`/api/base_resumes/${route.params.id}`);
  const data = await res.json();
  activeResume.value = data.resume;
  editForm.value.resume_text = data.resume.resume_text;
}

async function saveResume() {
  if (!activeResume.value) return;

  isSaving.value = true;
  try {
    const res = await fetch(`/api/base_resumes/${activeResume.value.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: editForm.value.resume_text }),
    });

    if (res.ok) {
      fetchResume();
    }
  } catch (error) {
    console.error("Failed to update resume", error);
  } finally {
    isSaving.value = false;
  }
}

async function deleteResume() {
  console.log(activeResume.value);
  if (!activeResume.value) return;

  isDeleting.value = true;
  try {
    const res = await fetch(`/api/base_resumes/${activeResume.value.id}`, {
      method: "DELETE",
    });
    console.log(res.ok);
    if (res.ok) {
      router.replace("/resumes");
    }
  } catch (error) {
    console.error("Failed to delete resume", error);
  } finally {
    isDeleting.value = false;
  }
}

async function downloadMarkdown() {
  if (!activeResume.value) return;

  const blob = new Blob([editForm.value.resume_text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${activeResume.value.resume_name}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

const isExportingPdf = ref(false);

async function exportPdf() {
  if (!activeResume.value) return;

  isExportingPdf.value = true;
  try {
    const res = await fetch(`/api/base_resumes/${activeResume.value.id}/pdf`);

    if (!res.ok) {
      throw new Error("Failed to generate PDF");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeResume.value.resume_name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export PDF", error);
    alert("Erro ao exportar PDF. Tente novamente.");
  } finally {
    isExportingPdf.value = false;
  }
}

onMounted(async () => {
  await fetchResume();
});
</script>

<template>
  <SidebarInset>
    <header class="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem class="hidden md:block">
            <BreadcrumbLink href="#"> M.A.T.C.H </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator class="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{{
              activeResume ? activeResume.resume_name : "Início"
            }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>

    <div class="flex flex-1 flex-col gap-4 p-4 h-[calc(100vh-73px)]">
      <!-- Editor View -->
      <div v-if="activeResume" class="flex flex-1 flex-col h-full gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-2xl font-bold tracking-tight truncate">
            {{ activeResume.resume_name }}
          </h2>
          <div class="flex gap-2 shrink-0">
            <Button
              variant="outline"
              @click="downloadMarkdown"
              :disabled="isSaving || isDeleting || isExportingPdf"
            >
              <FileDown class="w-4 h-4 mr-2" />
              Markdown
            </Button>
            <Button
              variant="outline"
              @click="exportPdf"
              :disabled="isSaving || isDeleting || isExportingPdf"
            >
              <Download class="w-4 h-4 mr-2" />
              {{ isExportingPdf ? "Gerando..." : "PDF" }}
            </Button>
            <Button
              variant="outline"
              @click="saveResume"
              :disabled="isSaving || isDeleting || isExportingPdf"
            >
              {{ isSaving ? "Salvando..." : "Salvar Alterações" }}
            </Button>
            <Button
              variant="destructive"
              @click="deleteResume"
              :disabled="isSaving || isDeleting || isExportingPdf"
            >
              Deletar
            </Button>
          </div>
        </div>
        <Textarea
          class="flex-1 font-mono text-sm resize-none p-4 w-full h-full min-h-[400px]"
          v-model="editForm.resume_text"
          placeholder="Cole seu currículo em markdown aqui..."
        />
      </div>
    </div>
  </SidebarInset>
</template>
