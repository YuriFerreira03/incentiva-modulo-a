// =============================================================
// Validações locais (sem IA) — evitam avanço com campos vazios
// =============================================================

import type {
  IdeiaInicial,
  Proponente,
  EstruturaProjeto,
  Meta,
  ItemOrcamento,
  ProjetoCompleto
} from '../types/project'

type ValidationResult = {
  valid: boolean
  errors: string[]
}

export function validateIdeia(ideia: IdeiaInicial): ValidationResult {
  const errors: string[] = []
  if (!ideia.nome.trim()) errors.push('Nome do projeto é obrigatório.')
  if (!ideia.descricao.trim()) errors.push('Descrição da ideia é obrigatória.')
  if (!ideia.modalidade.trim()) errors.push('Modalidade esportiva é obrigatória.')
  if (!ideia.tipoProjeto) errors.push('Tipo do projeto é obrigatório.')
  if (!ideia.publicoAlvo.trim()) errors.push('Público-alvo é obrigatório.')
  if (!ideia.localPrevisto.trim()) errors.push('Local previsto de execução é obrigatório.')
  return { valid: errors.length === 0, errors }
}

export function validateProponente(p: Proponente): ValidationResult {
  const errors: string[] = []
  if (!p.nomeEntidade.trim()) errors.push('Nome da entidade é obrigatório.')
  if (!p.cnpj.trim()) errors.push('CNPJ é obrigatório.')
  else if (!isValidCNPJFormat(p.cnpj)) errors.push('CNPJ em formato inválido (use 00.000.000/0000-00).')
  if (!p.responsavel.trim()) errors.push('Responsável pelo projeto é obrigatório.')
  if (p.email && !isValidEmail(p.email)) errors.push('E-mail em formato inválido.')
  return { valid: errors.length === 0, errors }
}

export function validateEstrutura(e: EstruturaProjeto): ValidationResult {
  const errors: string[] = []
  if (!e.objeto.trim()) errors.push('Objeto do projeto é obrigatório.')
  if (!e.objetivoGeral.trim()) errors.push('Objetivo geral é obrigatório.')
  if (!e.justificativa.trim()) errors.push('Justificativa é obrigatória.')
  if (!e.metodologia.trim()) errors.push('Metodologia é obrigatória.')
  return { valid: errors.length === 0, errors }
}

export function validateMetas(metas: Meta[]): ValidationResult {
  const errors: string[] = []
  const preenchidas = metas.filter(m => m.descricao.trim() !== '')
  if (preenchidas.length < 2) {
    errors.push('Cadastre pelo menos 2 metas.')
  }
  preenchidas.forEach((m, i) => {
    if (!m.tipo) errors.push(`Meta ${i + 1}: selecione o tipo (quantitativa/qualitativa).`)
    if (!m.indicador.trim()) errors.push(`Meta ${i + 1}: informe o indicador.`)
    if (!m.verificador.trim()) errors.push(`Meta ${i + 1}: informe a forma de verificação.`)
  })
  return { valid: errors.length === 0, errors }
}

export function validateOrcamento(itens: ItemOrcamento[]): ValidationResult {
  const errors: string[] = []
  const preenchidos = itens.filter(
    i => i.descricao.trim() !== '' && i.valorUnitario > 0 && i.quantidade > 0
  )
  if (preenchidos.length < 1) {
    errors.push('Cadastre pelo menos um item de orçamento com valor e quantidade.')
  }
  return { valid: errors.length === 0, errors }
}

// ---------- Validação completa ----------
export function validateProjetoCompleto(p: ProjetoCompleto): ValidationResult {
  const all = [
    validateIdeia(p.ideia),
    validateProponente(p.proponente),
    validateEstrutura(p.estrutura),
    validateMetas(p.metas),
    validateOrcamento(p.orcamento)
  ]
  const errors = all.flatMap(r => r.errors)
  return { valid: errors.length === 0, errors }
}

// ---------- Utilitários ----------
export function isValidCNPJFormat(cnpj: string): boolean {
  // Aceita 00.000.000/0000-00 ou apenas 14 dígitos
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.length === 14
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
