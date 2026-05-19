// =============================================================
// AI Service — chamadas à API de IA + fallback local
// =============================================================
//
// Suporta múltiplos provedores via variável VITE_AI_PROVIDER.
// Sem chave configurada, usa mock local automaticamente.
//
// =============================================================

import type {
  ProjetoCompleto,
  SugestaoEstrutura,
  SugestaoMetas,
  ResultadoValidacao,
  IdeiaInicial,
  ChecklistItem
} from '../types/project'

// ---------- Configuração ----------
type Provider = 'openrouter' | 'groq' | 'google' | 'together' | 'mock'

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER || 'mock') as Provider
const API_KEY = import.meta.env.VITE_AI_API_KEY || ''
const MODEL = import.meta.env.VITE_AI_MODEL || 'deepseek/deepseek-chat-v3.1:free'

function isConfigured(): boolean {
  return PROVIDER !== 'mock' && API_KEY.trim() !== ''
}

export function getAIStatus(): { configured: boolean; provider: string; model: string } {
  return {
    configured: isConfigured(),
    provider: PROVIDER,
    model: MODEL
  }
}

// ---------- Prompt-base do sistema ----------
const SYSTEM_PROMPT = `Você é um assistente técnico especializado em estruturação preliminar de projetos esportivos para a Lei de Incentivo ao Esporte (Lei nº 11.438/2006). Sua função é analisar se o projeto contém os elementos mínimos necessários para seguir para uma validação técnica preliminar.

REGRAS OBRIGATÓRIAS:
- Não aprove projetos incompletos.
- Não invente dados ausentes.
- Se faltar informação, informe a pendência de forma objetiva.
- Avalie clareza, completude e coerência entre objetivo, metodologia, metas, público-alvo, local de execução e orçamento.
- Retorne SEMPRE em JSON válido, sem texto fora do JSON.
- Escreva em português do Brasil, com linguagem clara e técnica.`

// ---------- Roteador de provedores ----------
async function callAI(userPrompt: string): Promise<string> {
  if (!isConfigured()) {
    throw new Error('AI_NOT_CONFIGURED')
  }

  switch (PROVIDER) {
    case 'openrouter':
      return callOpenRouter(userPrompt)
    case 'groq':
      return callGroq(userPrompt)
    case 'google':
      return callGoogle(userPrompt)
    case 'together':
      return callTogether(userPrompt)
    default:
      throw new Error(`Provedor de IA não suportado: ${PROVIDER}`)
  }
}

// ---------- OpenRouter (padrão recomendado) ----------
async function callOpenRouter(userPrompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'INCENTIVA Modulo A'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ---------- Groq ----------
async function callGroq(userPrompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4
    })
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ---------- Google AI Studio (Gemini) ----------
async function callGoogle(userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    })
  })
  if (!res.ok) throw new Error(`Google AI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ---------- Together AI ----------
async function callTogether(userPrompt: string): Promise<string> {
  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4
    })
  })
  if (!res.ok) throw new Error(`Together ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ---------- Parser JSON tolerante ----------
function parseJsonResponse<T>(raw: string): T {
  // Remove cercas markdown se houver
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  // Tenta extrair JSON entre primeira { e última }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }
  return JSON.parse(text) as T
}

// =============================================================
// FUNÇÕES PÚBLICAS
// =============================================================

/**
 * Gera sugestões de estrutura (objetivo, justificativa, metodologia, etc.)
 * a partir da ideia inicial.
 */
export async function generateProjectStructure(
  ideia: IdeiaInicial
): Promise<SugestaoEstrutura> {
  const prompt = `A partir da ideia inicial de um projeto esportivo abaixo, gere sugestões de texto para os campos solicitados. Mantenha tom técnico, redação clara e adequado à Lei de Incentivo ao Esporte.

IDEIA INICIAL:
- Nome: ${ideia.nome}
- Descrição: ${ideia.descricao}
- Modalidade: ${ideia.modalidade}
- Tipo: ${ideia.tipoProjeto}
- Público-alvo: ${ideia.publicoAlvo}
- Local previsto: ${ideia.localPrevisto}
- Duração: ${ideia.duracaoEstimada}

Retorne JSON no formato:
{
  "objetivoGeral": "...",
  "justificativa": "...",
  "metodologia": "...",
  "resultadosEsperados": "...",
  "metasPreliminares": ["meta 1", "meta 2", "meta 3"]
}`

  try {
    const raw = await callAI(prompt)
    return parseJsonResponse<SugestaoEstrutura>(raw)
  } catch (err) {
    if (err instanceof Error && err.message === 'AI_NOT_CONFIGURED') {
      return mockStructure(ideia)
    }
    throw err
  }
}

/**
 * Gera sugestões de metas com indicador e verificador.
 */
export async function generateGoals(projeto: ProjetoCompleto): Promise<SugestaoMetas> {
  const prompt = `Considerando o projeto esportivo abaixo, gere de 3 a 5 metas SMART (com indicador mensurável e forma de verificação). Misture metas quantitativas e qualitativas.

PROJETO:
- Nome: ${projeto.ideia.nome}
- Modalidade: ${projeto.ideia.modalidade}
- Tipo: ${projeto.ideia.tipoProjeto}
- Público-alvo: ${projeto.ideia.publicoAlvo}
- Local: ${projeto.ideia.localPrevisto}
- Objetivo geral: ${projeto.estrutura.objetivoGeral || '(não preenchido)'}
- Justificativa: ${projeto.estrutura.justificativa || '(não preenchida)'}
- Metodologia: ${projeto.estrutura.metodologia || '(não preenchida)'}
- Quantidade de beneficiários: ${projeto.estrutura.quantidadeBeneficiarios || '(não informada)'}

Retorne JSON no formato:
{
  "metas": [
    {
      "descricao": "...",
      "tipo": "Quantitativa" | "Qualitativa",
      "indicador": "...",
      "verificador": "...",
      "prazo": "..."
    }
  ]
}`

  try {
    const raw = await callAI(prompt)
    return parseJsonResponse<SugestaoMetas>(raw)
  } catch (err) {
    if (err instanceof Error && err.message === 'AI_NOT_CONFIGURED') {
      return mockGoals(projeto)
    }
    throw err
  }
}

/**
 * Valida o projeto completo. Retorna checklist, pendências, sugestões.
 */
export async function validateProject(
  projeto: ProjetoCompleto
): Promise<ResultadoValidacao> {
  const prompt = `Analise o projeto esportivo abaixo, preparado para submissão preliminar à Lei de Incentivo ao Esporte. Avalie completude, clareza, coerência e qualidade da estruturação. NÃO aprove se faltar informação essencial. Aponte pendências, sugestões de melhoria e riscos de inconsistência.

DADOS DO PROJETO:
${JSON.stringify(
  {
    ideia: projeto.ideia,
    proponente: projeto.proponente,
    estrutura: projeto.estrutura,
    metas: projeto.metas.filter(m => m.descricao.trim()),
    orcamento: projeto.orcamento.filter(i => i.descricao.trim()),
    totalOrcamento: projeto.orcamento.reduce(
      (s, i) => s + i.quantidade * i.valorUnitario,
      0
    )
  },
  null,
  2
)}

Retorne JSON exatamente neste formato:
{
  "status": "Completo para análise preliminar" | "Parcialmente completo" | "Incompleto",
  "score": número de 0 a 100,
  "checklist": [
    { "item": "Nome do projeto", "status": "ok" | "pendente" | "atencao", "comentario": "..." },
    { "item": "Objeto", "status": "...", "comentario": "..." },
    { "item": "Objetivo geral", "status": "...", "comentario": "..." },
    { "item": "Justificativa", "status": "...", "comentario": "..." },
    { "item": "Metodologia", "status": "...", "comentario": "..." },
    { "item": "Público beneficiário", "status": "...", "comentario": "..." },
    { "item": "Local de execução", "status": "...", "comentario": "..." },
    { "item": "Quantidade de beneficiários", "status": "...", "comentario": "..." },
    { "item": "Pelo menos 2 metas cadastradas", "status": "...", "comentario": "..." },
    { "item": "Cada meta possui indicador", "status": "...", "comentario": "..." },
    { "item": "Cada meta possui verificador", "status": "...", "comentario": "..." },
    { "item": "Orçamento inicial preenchido", "status": "...", "comentario": "..." },
    { "item": "Dados do proponente preenchidos", "status": "...", "comentario": "..." }
  ],
  "pendencias": ["..."],
  "sugestoes": ["..."],
  "riscos": ["..."],
  "proximosPassos": ["..."]
}`

  try {
    const raw = await callAI(prompt)
    return parseJsonResponse<ResultadoValidacao>(raw)
  } catch (err) {
    if (err instanceof Error && err.message === 'AI_NOT_CONFIGURED') {
      return mockValidation(projeto)
    }
    throw err
  }
}

// =============================================================
// FALLBACKS LOCAIS (mock) — usados sem chave configurada
// =============================================================

function mockStructure(ideia: IdeiaInicial): SugestaoEstrutura {
  const nome = ideia.nome || 'o projeto'
  const mod = ideia.modalidade || 'a modalidade esportiva'
  const pub = ideia.publicoAlvo || 'o público-alvo definido'
  const local = ideia.localPrevisto || 'o local de execução'

  return {
    objetivoGeral: `Promover o acesso à prática de ${mod} para ${pub} em ${local}, contribuindo para o desenvolvimento esportivo, social e educacional dos beneficiários por meio de ${nome}.`,
    justificativa: `${nome} se justifica pela demanda crescente de ${pub} por atividades esportivas estruturadas em ${local}, considerando a importância do esporte como ferramenta de inclusão social, formação cidadã e melhoria da qualidade de vida. A Lei de Incentivo ao Esporte oferece o instrumento adequado para viabilizar essa iniciativa.`,
    metodologia: `O projeto será executado por meio de aulas regulares de ${mod}, com profissionais qualificados, em horários acessíveis a ${pub}. Serão realizadas avaliações periódicas dos beneficiários, encontros pedagógicos com famílias e responsáveis, e o registro sistemático das atividades para acompanhamento dos resultados.`,
    resultadosEsperados: `Espera-se ampliar o acesso de ${pub} à prática de ${mod}, fortalecer vínculos comunitários, melhorar indicadores de saúde e desempenho escolar dos beneficiários, e formar atletas e cidadãos comprometidos com valores do esporte.`,
    metasPreliminares: [
      `Atender pelo menos um número definido de beneficiários ao longo da duração do projeto.`,
      `Realizar atividades regulares com frequência mínima estabelecida.`,
      `Promover ao menos um evento de integração ou exibição com a comunidade.`
    ]
  }
}

function mockGoals(projeto: ProjetoCompleto): SugestaoMetas {
  return {
    metas: [
      {
        descricao: `Atender beneficiários em atividades regulares de ${projeto.ideia.modalidade || 'esporte'}.`,
        tipo: 'Quantitativa',
        indicador: 'Número de beneficiários inscritos e ativos',
        verificador: 'Lista de presença mensal e relatórios de frequência',
        prazo: 'Ao longo de toda a execução do projeto'
      },
      {
        descricao: 'Realizar atividades regulares com frequência mínima.',
        tipo: 'Quantitativa',
        indicador: 'Número de aulas/encontros realizados',
        verificador: 'Cronograma assinado e registros fotográficos',
        prazo: 'Mensal'
      },
      {
        descricao: 'Desenvolver valores cidadãos e socioeducacionais nos beneficiários.',
        tipo: 'Qualitativa',
        indicador: 'Percepção de evolução socioeducacional dos beneficiários',
        verificador: 'Avaliações pedagógicas e relatos de responsáveis',
        prazo: 'Avaliação semestral'
      },
      {
        descricao: 'Promover evento de integração com a comunidade.',
        tipo: 'Quantitativa',
        indicador: 'Realização de pelo menos 1 evento aberto',
        verificador: 'Registro do evento, lista de participantes e fotos',
        prazo: 'Até o final do projeto'
      }
    ]
  }
}

function mockValidation(projeto: ProjetoCompleto): ResultadoValidacao {
  const checks: ChecklistItem[] = []
  const pendencias: string[] = []
  const sugestoes: string[] = []
  const riscos: string[] = []

  // Faz a checagem de fato — não inventa
  const pushCheck = (item: string, valor: string | number | boolean, criterio?: string) => {
    const filled =
      typeof valor === 'string' ? valor.trim() !== '' : typeof valor === 'number' ? valor > 0 : valor
    checks.push({
      item,
      status: filled ? 'ok' : 'pendente',
      comentario: filled
        ? `${item} preenchido.`
        : criterio || `${item} não preenchido — preencher para seguir adiante.`
    })
    if (!filled) pendencias.push(`Preencher: ${item}.`)
  }

  pushCheck('Nome do projeto', projeto.ideia.nome)
  pushCheck('Objeto', projeto.estrutura.objeto)
  pushCheck('Objetivo geral', projeto.estrutura.objetivoGeral)
  pushCheck('Justificativa', projeto.estrutura.justificativa)
  pushCheck('Metodologia', projeto.estrutura.metodologia)
  pushCheck('Público beneficiário', projeto.estrutura.publicoBeneficiario || projeto.ideia.publicoAlvo)
  pushCheck('Local de execução', projeto.estrutura.locaisExecucao || projeto.ideia.localPrevisto)
  pushCheck('Quantidade de beneficiários', projeto.estrutura.quantidadeBeneficiarios)

  // Metas
  const metasPreenchidas = projeto.metas.filter(m => m.descricao.trim() !== '')
  checks.push({
    item: 'Pelo menos 2 metas cadastradas',
    status: metasPreenchidas.length >= 2 ? 'ok' : 'pendente',
    comentario:
      metasPreenchidas.length >= 2
        ? `${metasPreenchidas.length} metas cadastradas.`
        : `Apenas ${metasPreenchidas.length} meta(s) cadastrada(s). Mínimo: 2.`
  })
  if (metasPreenchidas.length < 2) {
    pendencias.push('Cadastrar pelo menos 2 metas.')
  }

  const todasComIndicador = metasPreenchidas.every(m => m.indicador.trim() !== '')
  checks.push({
    item: 'Cada meta possui indicador',
    status: todasComIndicador && metasPreenchidas.length > 0 ? 'ok' : 'pendente',
    comentario: todasComIndicador
      ? 'Todas as metas com indicador.'
      : 'Há metas sem indicador definido.'
  })
  if (!todasComIndicador && metasPreenchidas.length > 0) {
    pendencias.push('Definir indicador para todas as metas.')
  }

  const todasComVerificador = metasPreenchidas.every(m => m.verificador.trim() !== '')
  checks.push({
    item: 'Cada meta possui verificador',
    status: todasComVerificador && metasPreenchidas.length > 0 ? 'ok' : 'pendente',
    comentario: todasComVerificador
      ? 'Todas as metas com forma de verificação.'
      : 'Há metas sem forma de verificação.'
  })
  if (!todasComVerificador && metasPreenchidas.length > 0) {
    pendencias.push('Definir verificador para todas as metas.')
  }

  // Orçamento
  const orcPreenchido = projeto.orcamento.filter(
    i => i.descricao.trim() !== '' && i.valorUnitario > 0
  )
  checks.push({
    item: 'Orçamento inicial preenchido',
    status: orcPreenchido.length > 0 ? 'ok' : 'pendente',
    comentario:
      orcPreenchido.length > 0
        ? `${orcPreenchido.length} item(ns) no orçamento.`
        : 'Orçamento sem itens preenchidos.'
  })
  if (orcPreenchido.length === 0) pendencias.push('Adicionar pelo menos um item de orçamento.')

  // Proponente
  const propOk =
    projeto.proponente.nomeEntidade.trim() !== '' &&
    projeto.proponente.cnpj.trim() !== '' &&
    projeto.proponente.responsavel.trim() !== ''
  checks.push({
    item: 'Dados do proponente preenchidos',
    status: propOk ? 'ok' : 'pendente',
    comentario: propOk
      ? 'Dados básicos do proponente preenchidos.'
      : 'Faltam dados básicos do proponente (entidade, CNPJ ou responsável).'
  })
  if (!propOk) pendencias.push('Preencher entidade, CNPJ e responsável do proponente.')

  // Score: proporção de checks "ok"
  const okCount = checks.filter(c => c.status === 'ok').length
  const score = Math.round((okCount / checks.length) * 100)

  let status: ResultadoValidacao['status']
  if (score === 100) status = 'Completo para análise preliminar'
  else if (score >= 60) status = 'Parcialmente completo'
  else status = 'Incompleto'

  // Sugestões e riscos genéricos quando faltar algo
  if (pendencias.length > 0) {
    sugestoes.push('Revisar e completar os campos indicados como pendentes.')
    sugestoes.push(
      'Garantir coerência entre objetivo geral, metas e orçamento — cada parte deve sustentar a outra.'
    )
    riscos.push(
      'O projeto poderá ser considerado incompleto na análise preliminar caso não sejam resolvidas as pendências.'
    )
  } else {
    sugestoes.push('Revisar redação dos textos antes do envio oficial ao SLI.')
    sugestoes.push('Considerar parceiros ou contrapartidas que reforcem a viabilidade do projeto.')
  }

  const proximosPassos: string[] = []
  if (pendencias.length > 0) {
    proximosPassos.push('Corrigir todas as pendências indicadas.')
  }
  proximosPassos.push('Revisar o orçamento conforme regras vigentes da Lei de Incentivo ao Esporte.')
  proximosPassos.push('Preparar documentação oficial do proponente para cadastro no SLI.')
  proximosPassos.push('Submeter à análise técnica preliminar interna antes do envio oficial.')

  return {
    status,
    score,
    checklist: checks,
    pendencias,
    sugestoes,
    riscos,
    proximosPassos
  }
}
