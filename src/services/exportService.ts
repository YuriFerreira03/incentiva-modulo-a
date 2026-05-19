// =============================================================
// Export Service — exporta projeto em .txt e .json
// =============================================================

import type { ProjetoCompleto } from '../types/project'
import { formatBRL } from '../utils/formatters'

// ---------- TXT estruturado e legível ----------
export function exportToTxt(p: ProjetoCompleto): void {
  const lines: string[] = []
  const sep = '═'.repeat(72)
  const sub = '─'.repeat(72)

  lines.push('INCENTIVA — MÓDULO A')
  lines.push('PROJETO ESTRUTURADO PARA VALIDAÇÃO PRELIMINAR')
  lines.push(sep)
  lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`)
  lines.push(`Versão do documento: ${p.metadata.versao}`)
  lines.push('')

  lines.push('1. DADOS GERAIS')
  lines.push(sub)
  lines.push(`Nome do projeto: ${p.ideia.nome}`)
  lines.push(`Modalidade: ${p.ideia.modalidade}`)
  lines.push(`Tipo: ${p.ideia.tipoProjeto}`)
  lines.push(`Público-alvo: ${p.ideia.publicoAlvo}`)
  lines.push(`Local previsto: ${p.ideia.localPrevisto}`)
  lines.push(`Duração estimada: ${p.ideia.duracaoEstimada}`)
  lines.push('')
  lines.push('Descrição da ideia inicial:')
  lines.push(p.ideia.descricao || '(não preenchido)')
  lines.push('')

  lines.push('2. DADOS DO PROPONENTE')
  lines.push(sub)
  lines.push(`Entidade: ${p.proponente.nomeEntidade}`)
  lines.push(`CNPJ: ${p.proponente.cnpj}`)
  lines.push(`Tipo de entidade: ${p.proponente.tipoEntidade}`)
  lines.push(`Tempo de funcionamento: ${p.proponente.tempoFuncionamento}`)
  lines.push(`Responsável: ${p.proponente.responsavel}`)
  lines.push(`E-mail: ${p.proponente.email}`)
  lines.push(`Telefone: ${p.proponente.telefone}`)
  lines.push(`Cidade/Estado: ${p.proponente.cidade}/${p.proponente.estado}`)
  lines.push('')

  lines.push('3. OBJETO')
  lines.push(sub)
  lines.push(p.estrutura.objeto || '(não preenchido)')
  lines.push('')

  lines.push('4. OBJETIVOS')
  lines.push(sub)
  lines.push('Objetivo geral:')
  lines.push(p.estrutura.objetivoGeral || '(não preenchido)')
  lines.push('')
  lines.push('Objetivos específicos:')
  lines.push(p.estrutura.objetivosEspecificos || '(não preenchido)')
  lines.push('')

  lines.push('5. JUSTIFICATIVA')
  lines.push(sub)
  lines.push(p.estrutura.justificativa || '(não preenchida)')
  lines.push('')

  lines.push('6. METODOLOGIA')
  lines.push(sub)
  lines.push(p.estrutura.metodologia || '(não preenchida)')
  lines.push('')

  lines.push('7. PÚBLICO BENEFICIÁRIO')
  lines.push(sub)
  lines.push(`Público: ${p.estrutura.publicoBeneficiario || '(não preenchido)'}`)
  lines.push(`Quantidade estimada: ${p.estrutura.quantidadeBeneficiarios || '(não informada)'}`)
  lines.push(`Faixa etária: ${p.estrutura.faixaEtaria || '(não informada)'}`)
  lines.push(`Atende PCD: ${p.estrutura.atendePCD ? 'Sim' : 'Não'}`)
  lines.push(`Locais de execução: ${p.estrutura.locaisExecucao || '(não preenchido)'}`)
  lines.push(`Cronograma resumido: ${p.estrutura.cronogramaResumido || '(não preenchido)'}`)
  lines.push(`Resultados esperados: ${p.estrutura.resultadosEsperados || '(não preenchido)'}`)
  lines.push('')

  lines.push('8. METAS')
  lines.push(sub)
  const metas = p.metas.filter(m => m.descricao.trim() !== '')
  if (metas.length === 0) {
    lines.push('(nenhuma meta cadastrada)')
  } else {
    metas.forEach((m, i) => {
      lines.push(`Meta ${i + 1} — ${m.tipo}`)
      lines.push(`  Descrição: ${m.descricao}`)
      lines.push(`  Indicador: ${m.indicador}`)
      lines.push(`  Verificador: ${m.verificador}`)
      lines.push(`  Prazo: ${m.prazo}`)
      lines.push('')
    })
  }

  lines.push('9. ORÇAMENTO INICIAL')
  lines.push(sub)
  const itens = p.orcamento.filter(i => i.descricao.trim() !== '')
  if (itens.length === 0) {
    lines.push('(orçamento sem itens)')
  } else {
    const porCategoria = new Map<string, typeof itens>()
    itens.forEach(it => {
      const arr = porCategoria.get(it.categoria) || []
      arr.push(it)
      porCategoria.set(it.categoria, arr)
    })
    let total = 0
    porCategoria.forEach((items, cat) => {
      const subTotal = items.reduce((s, it) => s + it.quantidade * it.valorUnitario, 0)
      total += subTotal
      lines.push(`[${cat}]`)
      items.forEach(it => {
        const v = it.quantidade * it.valorUnitario
        lines.push(
          `  · ${it.descricao} — ${it.quantidade} × ${formatBRL(it.valorUnitario)} = ${formatBRL(v)}`
        )
      })
      lines.push(`  Subtotal ${cat}: ${formatBRL(subTotal)}`)
      lines.push('')
    })
    lines.push(`TOTAL GERAL ESTIMADO: ${formatBRL(total)}`)
    lines.push('')
    lines.push(
      'AVISO: Valores apresentados são estimativas preliminares e devem ser revisados conforme regras vigentes da Lei de Incentivo ao Esporte.'
    )
    lines.push('')
  }

  lines.push('10. VALIDAÇÃO TÉCNICA PRELIMINAR')
  lines.push(sub)
  if (p.validacao) {
    lines.push(`Status: ${p.validacao.status}`)
    lines.push(`Score: ${p.validacao.score}/100`)
    lines.push('')
    lines.push('Checklist:')
    p.validacao.checklist.forEach(c => {
      const mark = c.status === 'ok' ? '[OK]' : c.status === 'atencao' ? '[!]' : '[ ]'
      lines.push(`  ${mark} ${c.item} — ${c.comentario}`)
    })
    lines.push('')
  } else {
    lines.push('(validação não executada)')
    lines.push('')
  }

  lines.push('11. PENDÊNCIAS')
  lines.push(sub)
  if (p.validacao && p.validacao.pendencias.length > 0) {
    p.validacao.pendencias.forEach(x => lines.push(`  · ${x}`))
  } else {
    lines.push('(nenhuma pendência registrada)')
  }
  lines.push('')

  lines.push('12. PRÓXIMOS PASSOS')
  lines.push(sub)
  if (p.validacao && p.validacao.proximosPassos.length > 0) {
    p.validacao.proximosPassos.forEach(x => lines.push(`  · ${x}`))
  } else {
    lines.push('(não definidos)')
  }
  lines.push('')

  lines.push(sep)
  lines.push(
    'Este documento é gerado por protótipo acadêmico (INCENTIVA — Módulo A) e não substitui o cadastro oficial no SLI/Ministério do Esporte.'
  )

  downloadFile(
    `INCENTIVA_${slug(p.ideia.nome || 'projeto')}.txt`,
    lines.join('\n'),
    'text/plain;charset=utf-8'
  )
}

// ---------- JSON estruturado ----------
export function exportToJson(p: ProjetoCompleto): void {
  // Limpa metas e orçamento vazios para um JSON mais limpo
  const cleaned = {
    ...p,
    metas: p.metas.filter(m => m.descricao.trim() !== ''),
    orcamento: p.orcamento.filter(i => i.descricao.trim() !== ''),
    totais: {
      atividadeFim: p.orcamento
        .filter(i => i.categoria === 'Atividade-fim')
        .reduce((s, i) => s + i.quantidade * i.valorUnitario, 0),
      atividadeMeio: p.orcamento
        .filter(i => i.categoria === 'Atividade-meio')
        .reduce((s, i) => s + i.quantidade * i.valorUnitario, 0),
      total: p.orcamento.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
    }
  }

  downloadFile(
    `INCENTIVA_${slug(p.ideia.nome || 'projeto')}.json`,
    JSON.stringify(cleaned, null, 2),
    'application/json;charset=utf-8'
  )
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'projeto'
}
