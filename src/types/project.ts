// =============================================================
// INCENTIVA — Módulo A
// Tipos e interfaces do modelo de projeto esportivo
// =============================================================

export type TipoProjeto =
  | 'Atividade regular'
  | 'Evento'
  | 'Formação esportiva'
  | 'Esporte para toda a vida'
  | 'Excelência esportiva'
  | 'Outro'

export type TipoEntidade =
  | 'Associação'
  | 'Fundação'
  | 'Instituto'
  | 'Federação'
  | 'Confederação'
  | 'Clube'
  | 'OSC'
  | 'Outro'

export type FaixaEtaria =
  | 'Infantil (até 12)'
  | 'Adolescente (13-17)'
  | 'Jovem (18-24)'
  | 'Adulto (25-59)'
  | 'Idoso (60+)'
  | 'Todas as faixas'

export type TipoMeta = 'Quantitativa' | 'Qualitativa'

export type StatusValidacao =
  | 'Completo para análise preliminar'
  | 'Parcialmente completo'
  | 'Incompleto'

export type StatusItem = 'ok' | 'pendente' | 'atencao'

// ---------- Etapa 1: Ideia inicial ----------
export interface IdeiaInicial {
  nome: string
  descricao: string
  modalidade: string
  tipoProjeto: TipoProjeto | ''
  publicoAlvo: string
  localPrevisto: string
  duracaoEstimada: string
}

// ---------- Etapa 2: Proponente ----------
export interface Proponente {
  nomeEntidade: string
  cnpj: string
  tipoEntidade: TipoEntidade | ''
  tempoFuncionamento: string
  responsavel: string
  email: string
  telefone: string
  cidade: string
  estado: string
}

// ---------- Etapa 3: Estrutura ----------
export interface EstruturaProjeto {
  objeto: string
  objetivoGeral: string
  objetivosEspecificos: string
  justificativa: string
  metodologia: string
  publicoBeneficiario: string
  quantidadeBeneficiarios: string
  faixaEtaria: FaixaEtaria | ''
  atendePCD: boolean
  locaisExecucao: string
  cronogramaResumido: string
  resultadosEsperados: string
}

// ---------- Etapa 4: Metas ----------
export interface Meta {
  id: string
  descricao: string
  tipo: TipoMeta | ''
  indicador: string
  verificador: string
  prazo: string
}

// ---------- Etapa 5: Orçamento ----------
export type CategoriaOrcamento =
  | 'Atividade-fim'
  | 'Atividade-meio'
  | 'Elaboração/captação'
  | 'Materiais esportivos'
  | 'Recursos humanos'
  | 'Comunicação/divulgação'
  | 'Transporte/logística'
  | 'Outros custos'

export const CATEGORIAS_ORCAMENTO: CategoriaOrcamento[] = [
  'Atividade-fim',
  'Atividade-meio',
  'Elaboração/captação',
  'Materiais esportivos',
  'Recursos humanos',
  'Comunicação/divulgação',
  'Transporte/logística',
  'Outros custos'
]

export interface ItemOrcamento {
  id: string
  categoria: CategoriaOrcamento
  descricao: string
  quantidade: number
  valorUnitario: number
}

// ---------- Etapa 6: Resultado da validação ----------
export interface ChecklistItem {
  item: string
  status: StatusItem
  comentario: string
}

export interface ResultadoValidacao {
  status: StatusValidacao
  score: number
  checklist: ChecklistItem[]
  pendencias: string[]
  sugestoes: string[]
  riscos: string[]
  proximosPassos: string[]
}

// ---------- Estado completo do projeto ----------
export interface ProjetoCompleto {
  ideia: IdeiaInicial
  proponente: Proponente
  estrutura: EstruturaProjeto
  metas: Meta[]
  orcamento: ItemOrcamento[]
  validacao: ResultadoValidacao | null
  metadata: {
    criadoEm: string
    atualizadoEm: string
    versao: string
  }
}

// ---------- Sugestão da IA para estrutura ----------
export interface SugestaoEstrutura {
  objetivoGeral?: string
  justificativa?: string
  metodologia?: string
  resultadosEsperados?: string
  metasPreliminares?: string[]
}

// ---------- Sugestão da IA para metas ----------
export interface SugestaoMetas {
  metas: Array<{
    descricao: string
    tipo: TipoMeta
    indicador: string
    verificador: string
    prazo: string
  }>
}
