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
    analysis: {
      type: "string",
      description:
        "Detailed ATS compatibility analysis in markdown. Must include the ATS Conformance Checklist with pass/fail for each item, and keyword density check per critical keyword.",
    },
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
        "Complete ATS-optimized resume in markdown only. Must include: exact job title as ## below candidate name, full abbreviation expansion on first mention, keywords in at least 2 sections each, consistent date format throughout. No analysis, no corrections summary, no score estimation.",
    },
  },
  required: ["optimized_resume"],
});

const SYSTEM_PROMPT = `Você é um especialista em recrutamento e sistemas ATS (Applicant Tracking System) com mais de 10 anos de experiência otimizando currículos para empresas Fortune 500. Seu objetivo é analisar descrições de vagas e reformatar currículos em markdown estruturado para garantir 100% de aderência aos critérios da vaga.

Regras invioláveis:
- Nunca invente experiências, cargos ou habilidades que o candidato não possua
- Priorize as palavras-chave EXATAS da vaga; para ATS modernos com NLP/PLN, sinônimos podem ser listados como complemento (ex: "Excel / MS Excel") apenas quando ambas as formas aparecem na descrição da vaga ou são amplamente reconhecidas
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

## Siglas e Abreviações críticas
Para cada sigla técnica identificada na vaga, forneça:
- [SIGLA] → [Forma extensa] ([SIGLA])
Exemplos: CRM → Customer Relationship Management (CRM) | SPED → Sistema Público de Escrituração Digital (SPED) | SEO → Otimização para Motores de Busca (SEO)
Se não houver siglas relevantes, escreva: "Nenhuma sigla crítica identificada."

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
- Sem cabeçalhos de página e rodapés (ATS não processa essas regiões)
- Use o MESMO formato de data em todo o documento — escolha UM: MM/AAAA ou Mês/AAAA, não misture
- Ordem: Resumo > Habilidades > Experiência > Formação > Projetos (se houver) > Certificações

REGRAS DE CONTEÚDO:
- Espelhe EXATAMENTE as palavras-chave da vaga (não sinônimos)
- Cada bullet de experiência: verbo de ação + contexto + resultado mensurável
  Formato: "Verbo [o que fez] resultando em [métrica] para [contexto]"
- Resumo profissional: 3-4 linhas com as 5 palavras-chave mais críticas da vaga
- Título do currículo (## logo abaixo do nome): use EXATAMENTE o título do "Cargo-alvo" extraído do mapa de requisitos
- Siglas e abreviações: na PRIMEIRA menção de cada sigla, escreva por extenso seguido da sigla entre parênteses — ex: "Gestão de Relacionamento com o Cliente (CRM)". Nas menções seguintes, use a sigla sozinha. Consulte a seção "Siglas e Abreviações críticas" do mapa de requisitos
- Densidade de keywords: cada keyword crítica deve aparecer em pelo menos 2 seções distintas (ex: seção Habilidades E dentro de um bullet de Experiência) para maximizar o score de matching
- Seção de habilidades: liste todas as keywords ATS relevantes que o candidato possui
- Priorize experiências dos últimos 5 anos

RETORNE O CURRÍCULO COMPLETO EM MARKDOWN:

# [Nome Completo]
## [Título exato da vaga — extraído de "Cargo-alvo" no mapa de requisitos]
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

## Projetos Relevantes
*(Inclua APENAS se o candidato tiver projetos no currículo original ou for iniciante/recém-formado com projetos acadêmicos/pessoais relevantes para a vaga. Omita completamente se não houver projetos reais.)*

### [Nome do Projeto] · [Tecnologias utilizadas] · [Ano]
- [O que foi construído e resultado/impacto mensurável]

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
| Métricas e resultados | 10% | X/10 | [razão] |
| Formatação e conformidade ATS | 20% | X/20 | [razão] |
| Requisitos desejáveis cobertos | 5% | X/5 | [razão] |

### Checklist de Conformidade ATS (impacta "Formatação e conformidade ATS")
- [ ] Título do currículo = título exato da vaga (cargo-alvo)
- [ ] Siglas críticas escritas por extenso na primeira menção
- [ ] Cada keyword crítica aparece em pelo menos 2 seções distintas (densidade ≥ 2)
- [ ] Formato de data consistente ao longo de todo o documento
- [ ] Sem cabeçalhos ou rodapés de página presentes

Para cada item marcado como FALHOU: desconte pontos proporcionalmente na dimensão "Formatação e conformidade ATS" e liste a falha em "Pontos de melhoria restantes".

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

QUICK WINS (corrija primeiro — alta pontuação, baixo esforço):
1. Título: a linha imediatamente abaixo do nome é o cargo-alvo exato? Se não, corrija agora.
2. Siglas: alguma sigla crítica aparece sem a forma extensa na primeira menção? Corrija todas usando a lista de siglas do mapa de requisitos.
3. Densidade: alguma keyword crítica aparece em apenas 1 seção? Insira também na seção Habilidades ou em um bullet de experiência real — sem inventar contexto.
4. Datas: há mistura de formatos (ex: "01/2020" e "Janeiro/2020" no mesmo documento)? Normalize para o formato predominante no currículo.
5. Projetos: o candidato tem projetos no currículo original que foram omitidos? Adicione a seção ## Projetos Relevantes.

INSTRUÇÕES DE CORREÇÃO:
- Corrija os quick wins ANTES de abordar gaps de keywords mais complexos
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
