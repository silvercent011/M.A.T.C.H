import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatAnthropic({
  modelName: "claude-sonnet-4-5",
  temperature: 0.2,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const parser = new StringOutputParser();

const scoreStructuredModel = model.withStructuredOutput({
  type: "object",
  properties: {
    analysis: { type: "string", description: "Detailed ATS compatibility analysis in markdown" },
    score: { type: "integer", minimum: 0, maximum: 100, description: "ATS score 0 to 100" },
  },
  required: ["analysis", "score"],
});

const resumeStructuredModel = model.withStructuredOutput({
  type: "object",
  properties: {
    optimized_resume: {
      type: "string",
      description:
        "Complete ATS-optimized resume in markdown only. No analysis, no corrections summary, no score estimation.",
    },
  },
  required: ["optimized_resume"],
});

const SYSTEM_PROMPT = `Você é um especialista em recrutamento e sistemas ATS (Applicant Tracking System) com mais de 10 anos de experiência otimizando currículos para empresas Fortune 500. Seu objetivo é analisar descrições de vagas e reformatar currículos em markdown estruturado para garantir 100% de aderência aos critérios da vaga.

Regras invioláveis:
- Nunca invente experiências, cargos ou habilidades que o candidato não possua
- Sempre use as palavras-chave exatas da vaga (não sinônimos)
- Formate em markdown limpo e semântico
- Priorize métricas e resultados quantificáveis
- Mantenha tom profissional e objetivo`;

// Etapa 1
const jobAnalysisPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  [
    "human",
    `Analise a descrição de vaga abaixo e extraia um mapa estruturado de requisitos. Retorne APENAS em markdown com as seguintes seções:

## Cargo-alvo
[título exato da vaga]

## Empresa & Contexto
[empresa, setor, tamanho se mencionado, cultura]

## Requisitos OBRIGATÓRIOS
- Liste cada requisito explicitamente marcado como obrigatório

## Requisitos DESEJÁVEIS
- Liste diferenciais, preferências e "nice to have"

## Palavras-chave ATS (alta prioridade)
Liste as 15-20 palavras-chave e expressões técnicas mais críticas que um ATS irá rastrear. Inclua ferramentas, metodologias, certificações e soft skills mencionadas.

## Verbos de ação esperados
Liste os verbos de performance implícitos na vaga (ex: liderou, implementou, escalou, otimizou)

## Métricas valorizadas
Que tipos de resultados quantificáveis a vaga valoriza? (ex: redução de custos %, crescimento de receita, tempo, escala)

## Tom e linguagem da empresa
[formal/informal, técnico/generalista, startup/corporativo]

---
DESCRIÇÃO DA VAGA:
{job_description}`,
  ],
]);

// Etapa 2
const auditPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  [
    "human",
    `Com base no mapa de requisitos da vaga abaixo, audite o currículo do candidato e retorne uma análise de gaps em markdown:

## Compatibilidade Atual: [X]%

## Pontos fortes identificados
Liste as experiências e habilidades do candidato que JÁ atendem aos requisitos da vaga, com a palavra-chave correspondente da vaga.

## Gaps críticos (requisitos obrigatórios ausentes)
| Requisito da vaga | Status no currículo | Ação sugerida |
|---|---|---|
| [requisito] | Ausente / Presente / Parcial | [o que fazer] |

## Gaps secundários (requisitos desejáveis ausentes)
Liste itens desejáveis da vaga que não aparecem no currículo.

## Palavras-chave ATS faltantes
Liste as palavras-chave da vaga que NÃO aparecem em nenhuma forma no currículo atual.

## Seções mal otimizadas
Aponte seções do currículo que existem mas estão subaproveitadas ou mal formatadas para ATS.

## Experiências não destacadas
Identifique experiências no currículo que são relevantes mas estão enterradas, vagas ou sem métricas.

---
MAPA DE REQUISITOS DA VAGA:
{job_requirements_map}

CURRÍCULO ATUAL:
{current_resume}`,
  ],
]);

// Etapa 3
const rewritePrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  [
    "human",
    `Com base na auditoria e no mapa de requisitos, reescreva o currículo completo do candidato em markdown otimizado para ATS. Siga estas regras rigorosamente:

REGRAS DE FORMATAÇÃO ATS:
- Use markdown puro e semântico (sem tabelas complexas, sem colunas, sem símbolos especiais)
- Cabeçalhos com ## e ###
- Bullets com - (hífen simples)
- Nenhuma imagem, ícone ou formatação gráfica
- Ordem: Resumo > Habilidades > Experiência > Formação > Certificações

REGRAS DE CONTEÚDO:
- Espelhe EXATAMENTE as palavras-chave da vaga (não sinônimos)
- Cada bullet de experiência: verbo de ação + contexto + resultado mensurável
  Formato: "Verbo [o que fez] resultando em [métrica] para [contexto]"
- Resumo profissional: 3-4 linhas com as 5 palavras-chave mais críticas da vaga
- Seção de habilidades: liste todas as keywords ATS relevantes que o candidato possui
- Priorize experiências dos últimos 5 anos

RETORNE O CURRÍCULO COMPLETO EM MARKDOWN:

# [Nome Completo]
[cidade, estado] · [email] · [telefone] · [LinkedIn]

## Resumo Profissional
[3-4 linhas com palavras-chave da vaga integradas naturalmente]

## Habilidades
**Técnicas:** [lista separada por · ]
**Ferramentas:** [lista separada por · ]
**Soft skills:** [lista separada por · ]

## Experiência Profissional

### [Cargo] · [Empresa] · [Período]
- [bullet com verbo + resultado]
- [bullet com verbo + resultado]

## Formação Acadêmica
### [Grau] em [Curso] · [Instituição] · [Ano]

## Certificações
- [Nome da certificação] · [Emissor] · [Ano]

---
MAPA DE REQUISITOS:
{job_requirements_map}

RELATÓRIO DE AUDITORIA:
{audit_report}

CURRÍCULO ORIGINAL:
{current_resume}`,
  ],
]);

// Etapa 4
const scorePrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  [
    "human",
    `Você é um avaliador ATS. Compare o currículo otimizado com os requisitos da vaga e retorne uma validação detalhada em markdown:

## Score de Compatibilidade ATS: [0-100]%

### Breakdown do Score
| Dimensão | Peso | Pontuação | Justificativa |
|---|---|---|---|
| Palavras-chave obrigatórias | 35% | X/35 | [razão] |
| Requisitos obrigatórios cobertos | 30% | X/30 | [razão] |
| Métricas e resultados | 15% | X/15 | [razão] |
| Formatação ATS-friendly | 10% | X/10 | [razão] |
| Requisitos desejáveis cobertos | 10% | X/10 | [razão] |

## Palavras-chave ATS encontradas no currículo
Liste cada keyword da vaga e marque: ✓ Presente | ⚠ Parcial | ✗ Ausente

## Pontos de melhoria restantes
Se o score for < 95%, liste o que ainda pode ser ajustado (sem inventar informações).

## Gaps reais (não solucionáveis sem novas experiências)
Liste keywords ou requisitos que o candidato genuinamente não possui e que não podem ser adicionados honestamente.

---
MAPA DE REQUISITOS:
{job_requirements_map}

CURRÍCULO OTIMIZADO:
{optimized_resume}`,
  ],
]);

// Loop - Score < 90
const refinementPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  [
    "human",
    `O score de compatibilidade ficou abaixo de 90%. Revise o currículo otimizado e corrija especificamente:

PROBLEMAS IDENTIFICADOS:
{score_gaps}

INSTRUÇÕES DE CORREÇÃO:
- Para cada palavra-chave ATS marcada como "Ausente", encontre no currículo original uma experiência onde ela poderia ser inserida de forma verdadeira e natural
- Reescreva apenas as seções com score baixo — mantenha o restante
- Não invente experiências. Se a keyword não pode ser inserida honestamente, marque como "gap real"
- Retorne o currículo COMPLETO revisado em markdown

CURRÍCULO ATUAL:
{optimized_resume}

MAPA DE REQUISITOS:
{job_requirements_map}

CURRÍCULO ORIGINAL (para referência de fatos reais):
{current_resume}`,
  ],
]);

// Etapa 5
const outputPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  [
    "human",
    `Apresente o resultado final ao candidato de forma clara e acionável. Retorne:

---

## Currículo ATS otimizado para {job_title}

**Score de compatibilidade: {score}%**

{optimized_resume}

---

## O que mudamos e por quê

### Resumo profissional
[Explique em 1-2 frases o que foi alterado e qual palavra-chave foi inserida]

### Habilidades
[Liste as keywords ATS adicionadas e de onde vieram na vaga]

### Experiência
[Aponte os bullets que foram reescritos com métricas ou linguagem espelhada]

## Próximos passos recomendados
1. [Ação concreta se houver gap — ex: obter certificação X]
2. [Dica para a carta de apresentação usando os mesmos keywords]
3. [Orientação para a entrevista com base nos requisitos identificados]

## Palavras-chave para usar no LinkedIn
[Liste 8-10 keywords da vaga para o candidato adicionar ao perfil]

---
RELATÓRIO DE SCORE:
{score_report}

MAPA DE REQUISITOS:
{job_requirements_map}`,
  ],
]);

const jobAnalysisChain = jobAnalysisPrompt.pipe(model).pipe(parser);
const auditChain = auditPrompt.pipe(model).pipe(parser);
const rewriteChain = rewritePrompt.pipe(resumeStructuredModel);
const scoreChain = scorePrompt.pipe(scoreStructuredModel);
const refinementChain = refinementPrompt.pipe(resumeStructuredModel);
const outputChain = outputPrompt.pipe(model).pipe(parser);

async function runATSPipeline({
  jobDescription = "",
  currentResume = "",
  jobTitle = "Vaga",
  scoreThreshold = 90,
  maxRefinements = 2,
  onStep,
}: {
  jobDescription: string;
  currentResume: string;
  jobTitle?: string;
  scoreThreshold?: number;
  maxRefinements?: number;
  onStep?: (step: string, data: any) => void;
}) {
  const log = (step: string, data: any) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  ETAPA: ${step}`);
    console.log("=".repeat(60));
    if (onStep) onStep(step, data);
  };

  // ── Etapa 1: Análise da vaga ──────────────────────────────
  console.log("1/5 — Analisando descrição da vaga...");
  const jobRequirementsMap = await jobAnalysisChain.invoke({ job_description: jobDescription });
  log("1/5 — Mapa de requisitos gerado ✓", jobRequirementsMap);

  // ── Etapa 2: Auditoria do currículo ───────────────────────
  console.log("2/5 — Auditando currículo atual...");
  const auditReport = await auditChain.invoke({
    job_requirements_map: jobRequirementsMap,
    current_resume: currentResume,
  });
  log("2/5 — Auditoria concluída ✓", auditReport);

  // ── Etapa 3: Reescrita ATS ────────────────────────────────
  console.log("3/5 — Reescrevendo currículo em formato ATS...");
  let { optimized_resume: optimizedResume } = await rewriteChain.invoke({
    job_requirements_map: jobRequirementsMap,
    audit_report: auditReport,
    current_resume: currentResume,
  });
  console.log("3/5 — Currículo reescrito ✓");

  // ── Etapa 4: Validação com score + loop de refinamento ────
  let scoreReport = "";
  let finalScore = 0;
  let refinementCount = 0;

  for (let attempt = 0; attempt <= maxRefinements; attempt++) {
    console.log(`4/5 — Validando score (tentativa ${attempt + 1})...`);

    const scoreResult = await scoreChain.invoke({
      job_requirements_map: jobRequirementsMap,
      optimized_resume: optimizedResume,
    });

    scoreReport = scoreResult.analysis;
    finalScore = scoreResult.score;
    log(`4/5 — Score: ${finalScore}%`, scoreReport);

    if (finalScore >= scoreThreshold || attempt === maxRefinements) {
      if (finalScore < scoreThreshold) {
        console.log(
          `\n⚠️  Score ${finalScore}% abaixo de ${scoreThreshold}% após ${maxRefinements} refinamentos.`,
        );
        console.log(
          "   Gaps restantes são provavelmente experiências reais não presentes no currículo.",
        );
      }
      break;
    }

    // Score abaixo do threshold — refina
    refinementCount++;
    console.log(
      `🔄 Score ${finalScore}% < ${scoreThreshold}%. Iniciando refinamento ${refinementCount}...`,
    );

    ({ optimized_resume: optimizedResume } = await refinementChain.invoke({
      score_gaps: scoreReport,
      optimized_resume: optimizedResume,
      job_requirements_map: jobRequirementsMap,
      current_resume: currentResume,
    }));

    console.log(`4/5 — Refinamento ${refinementCount} concluído ✓`);
  }

  // ── Etapa 5: Output final ─────────────────────────────────
  console.log("5/5 — Gerando apresentação final...");
  const finalOutput = await outputChain.invoke({
    job_title: jobTitle,
    score: finalScore,
    optimized_resume: optimizedResume,
    score_report: scoreReport,
    job_requirements_map: jobRequirementsMap,
  });
  console.log("5/5 — Output final gerado ✓");

  return {
    finalOutput,
    optimizedResume,
    jobRequirementsMap,
    auditReport,
    scoreReport,
    finalScore,
    refinements: refinementCount,
  };
}

export {
  runATSPipeline,
  jobAnalysisChain,
  auditChain,
  rewriteChain,
  scoreChain,
  refinementChain,
  outputChain,
};
