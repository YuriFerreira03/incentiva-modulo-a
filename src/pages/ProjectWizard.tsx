import { useEffect, useMemo, useState } from 'react'
import Stepper from '../components/Stepper'
import TextInput from '../components/TextInput'
import TextArea from '../components/TextArea'
import SelectInput from '../components/SelectInput'
import GoalsForm from '../components/GoalsForm'
import BudgetTable from '../components/BudgetTable'
import ValidationResult from '../components/ValidationResult'
import type {
  ProjetoCompleto,
  IdeiaInicial,
  Proponente,
  EstruturaProjeto,
  Meta,
  ItemOrcamento,
  ResultadoValidacao,
  TipoProjeto,
  TipoEntidade,
  FaixaEtaria
} from '../types/project'
import {
  generateProjectStructure,
  generateGoals,
  validateProject,
  getAIStatus
} from '../services/aiService'
import { saveDraft, loadDraft, clearDraft } from '../services/storageService'
import { exportToTxt, exportToJson } from '../services/exportService'
import {
  validateIdeia,
  validateProponente,
  validateEstrutura,
  validateMetas,
  validateOrcamento
} from '../utils/validators'
import { formatBRL, formatCNPJ, formatPhone, newId } from '../utils/formatters'

const STEPS = [
  'Ideia inicial',
  'Proponente',
  'Estrutura',
  'Metas',
  'Orçamento',
  'Validação',
  'Resumo'
]

const TIPO_PROJ_OPTS: TipoProjeto[] = [
  'Atividade regular',
  'Evento',
  'Formação esportiva',
  'Esporte para toda a vida',
  'Excelência esportiva',
  'Outro'
]
const TIPO_ENT_OPTS: TipoEntidade[] = [
  'Associação',
  'Fundação',
  'Instituto',
  'Federação',
  'Confederação',
  'Clube',
  'OSC',
  'Outro'
]
const FAIXA_OPTS: FaixaEtaria[] = [
  'Infantil (até 12)',
  'Adolescente (13-17)',
  'Jovem (18-24)',
  'Adulto (25-59)',
  'Idoso (60+)',
  'Todas as faixas'
]

function emptyProjeto(): ProjetoCompleto {
  return {
    ideia: {
      nome: '',
      descricao: '',
      modalidade: '',
      tipoProjeto: '',
      publicoAlvo: '',
      localPrevisto: '',
      duracaoEstimada: ''
    },
    proponente: {
      nomeEntidade: '',
      cnpj: '',
      tipoEntidade: '',
      tempoFuncionamento: '',
      responsavel: '',
      email: '',
      telefone: '',
      cidade: '',
      estado: ''
    },
    estrutura: {
      objeto: '',
      objetivoGeral: '',
      objetivosEspecificos: '',
      justificativa: '',
      metodologia: '',
      publicoBeneficiario: '',
      quantidadeBeneficiarios: '',
      faixaEtaria: '',
      atendePCD: false,
      locaisExecucao: '',
      cronogramaResumido: '',
      resultadosEsperados: ''
    },
    metas: [
      { id: newId(), descricao: '', tipo: '', indicador: '', verificador: '', prazo: '' },
      { id: newId(), descricao: '', tipo: '', indicador: '', verificador: '', prazo: '' }
    ],
    orcamento: [],
    validacao: null,
    metadata: {
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      versao: '0.1.0'
    }
  }
}

interface Props {
  loadFromDraft: boolean
  onExit: () => void
}

export default function ProjectWizard({ loadFromDraft, onExit }: Props) {
  const [projeto, setProjeto] = useState<ProjetoCompleto>(() => {
    if (loadFromDraft) {
      const d = loadDraft()
      if (d) return d
    }
    return emptyProjeto()
  })
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState<string | null>(null)

  // Auto-save em LocalStorage a cada alteração
  useEffect(() => {
    saveDraft(projeto)
  }, [projeto])

  const aiStatus = getAIStatus()

  // ---------- Setters parciais ----------
  const setIdeia = (patch: Partial<IdeiaInicial>) =>
    setProjeto(p => ({ ...p, ideia: { ...p.ideia, ...patch } }))
  const setProp = (patch: Partial<Proponente>) =>
    setProjeto(p => ({ ...p, proponente: { ...p.proponente, ...patch } }))
  const setEstrutura = (patch: Partial<EstruturaProjeto>) =>
    setProjeto(p => ({ ...p, estrutura: { ...p.estrutura, ...patch } }))
  const setMetas = (metas: Meta[]) => setProjeto(p => ({ ...p, metas }))
  const setOrcamento = (orcamento: ItemOrcamento[]) =>
    setProjeto(p => ({ ...p, orcamento }))
  const setValidacao = (validacao: ResultadoValidacao | null) =>
    setProjeto(p => ({ ...p, validacao }))

  // ---------- Navegação com validação ----------
  function tryNext() {
    setErrors([])
    let res
    switch (step) {
      case 0:
        res = validateIdeia(projeto.ideia)
        break
      case 1:
        res = validateProponente(projeto.proponente)
        break
      case 2:
        res = validateEstrutura(projeto.estrutura)
        break
      case 3:
        res = validateMetas(projeto.metas)
        break
      case 4:
        res = validateOrcamento(projeto.orcamento)
        break
      default:
        res = { valid: true, errors: [] }
    }
    if (!res.valid) {
      setErrors(res.errors)
      return
    }
    setStep(s => Math.min(STEPS.length - 1, s + 1))
  }

  function goBack() {
    setErrors([])
    setStep(s => Math.max(0, s - 1))
  }

  // ---------- IA: estrutura ----------
  async function suggestStructure() {
    setAiBusy('structure')
    setAiError(null)
    try {
      const sug = await generateProjectStructure(projeto.ideia)
      setEstrutura({
        objetivoGeral: sug.objetivoGeral || projeto.estrutura.objetivoGeral,
        justificativa: sug.justificativa || projeto.estrutura.justificativa,
        metodologia: sug.metodologia || projeto.estrutura.metodologia,
        resultadosEsperados: sug.resultadosEsperados || projeto.estrutura.resultadosEsperados
      })
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erro ao chamar IA.')
    } finally {
      setAiBusy(null)
    }
  }

  // ---------- IA: metas ----------
  async function suggestGoals() {
    setAiBusy('goals')
    setAiError(null)
    try {
      const sug = await generateGoals(projeto)
      const novas: Meta[] = sug.metas.slice(0, 5).map(m => ({
        id: newId(),
        descricao: m.descricao,
        tipo: m.tipo,
        indicador: m.indicador,
        verificador: m.verificador,
        prazo: m.prazo
      }))
      while (novas.length < 2) {
        novas.push({
          id: newId(),
          descricao: '',
          tipo: '',
          indicador: '',
          verificador: '',
          prazo: ''
        })
      }
      setMetas(novas)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erro ao chamar IA.')
    } finally {
      setAiBusy(null)
    }
  }

  // ---------- IA: validação ----------
  async function runValidation() {
    setAiBusy('validate')
    setAiError(null)
    try {
      const res = await validateProject(projeto)
      setValidacao(res)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erro ao chamar IA.')
    } finally {
      setAiBusy(null)
    }
  }

  // ---------- Resumo: ações ----------
  function clearForm() {
    if (!confirm('Tem certeza? Isso vai apagar todos os dados do formulário.')) return
    clearDraft()
    setProjeto(emptyProjeto())
    setStep(0)
    setSentMessage(null)
    onExit()
  }

  function simulateSend() {
    setSentMessage(
      'Projeto enviado para validação técnica preliminar. Esta etapa simula o envio interno para análise antes do cadastro oficial no SLI.'
    )
  }

  const totalOrcamento = useMemo(
    () => projeto.orcamento.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0),
    [projeto.orcamento]
  )

  // ---------- Render por etapa ----------
  return (
    <div className="wizard">
      <header className="wizard-header">
        <button className="btn-link" onClick={onExit}>← voltar à tela inicial</button>
        <div className={`ai-pill ${aiStatus.configured ? 'on' : 'off'}`}>
          {aiStatus.configured
            ? `IA: ${aiStatus.provider}`
            : 'IA em modo demonstração (sem chave)'}
        </div>
      </header>

      <h1 className="wizard-title">
        INCENTIVA — Módulo A · Estruturação do Projeto
      </h1>

      <Stepper steps={STEPS} current={step} />

      {errors.length > 0 && (
        <div className="alert alert-danger">
          <strong>Antes de avançar, corrija:</strong>
          <ul>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {aiError && (
        <div className="alert alert-danger">
          <strong>Erro na chamada de IA:</strong> {aiError}
        </div>
      )}

      {/* ===================== ETAPA 1 ===================== */}
      {step === 0 && (
        <section className="step-section">
          <h2>Etapa 1 — Ideia inicial</h2>
          <p className="muted">Conte a ideia do projeto. Quanto mais clara, melhor a IA poderá ajudar nas próximas etapas.</p>

          <TextInput
            label="Nome provisório do projeto"
            value={projeto.ideia.nome}
            onChange={v => setIdeia({ nome: v })}
            placeholder="Ex: Arena Jovem — Basquete Comunitário"
            required
          />
          <TextArea
            label="Descrição livre da ideia inicial"
            value={projeto.ideia.descricao}
            onChange={v => setIdeia({ descricao: v })}
            placeholder="O que o projeto pretende fazer? Para quem? Em que contexto?"
            rows={5}
            required
          />
          <div className="grid-2">
            <TextInput
              label="Modalidade esportiva"
              value={projeto.ideia.modalidade}
              onChange={v => setIdeia({ modalidade: v })}
              placeholder="Ex: Basquete, Atletismo, Esportes aquáticos..."
              required
            />
            <SelectInput
              label="Tipo do projeto"
              value={projeto.ideia.tipoProjeto}
              onChange={v => setIdeia({ tipoProjeto: v as TipoProjeto })}
              options={TIPO_PROJ_OPTS}
              required
            />
          </div>
          <TextInput
            label="Público-alvo"
            value={projeto.ideia.publicoAlvo}
            onChange={v => setIdeia({ publicoAlvo: v })}
            placeholder="Ex: Crianças e adolescentes de 10 a 17 anos em situação de vulnerabilidade"
            required
          />
          <div className="grid-2">
            <TextInput
              label="Local previsto de execução"
              value={projeto.ideia.localPrevisto}
              onChange={v => setIdeia({ localPrevisto: v })}
              placeholder="Bairro, cidade, estado"
              required
            />
            <TextInput
              label="Duração estimada"
              value={projeto.ideia.duracaoEstimada}
              onChange={v => setIdeia({ duracaoEstimada: v })}
              placeholder="Ex: 12 meses"
            />
          </div>
        </section>
      )}

      {/* ===================== ETAPA 2 ===================== */}
      {step === 1 && (
        <section className="step-section">
          <h2>Etapa 2 — Dados do proponente</h2>
          <div className="alert alert-info small">
            <strong>Atenção:</strong> esta é uma simulação. Não substitui o cadastro oficial no SLI/Ministério do Esporte.
          </div>

          <div className="grid-2">
            <TextInput
              label="Nome da entidade proponente"
              value={projeto.proponente.nomeEntidade}
              onChange={v => setProp({ nomeEntidade: v })}
              required
            />
            <TextInput
              label="CNPJ"
              value={projeto.proponente.cnpj}
              onChange={v => setProp({ cnpj: formatCNPJ(v) })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>

          <div className="grid-2">
            <SelectInput
              label="Tipo de entidade"
              value={projeto.proponente.tipoEntidade}
              onChange={v => setProp({ tipoEntidade: v as TipoEntidade })}
              options={TIPO_ENT_OPTS}
            />
            <TextInput
              label="Tempo de funcionamento"
              value={projeto.proponente.tempoFuncionamento}
              onChange={v => setProp({ tempoFuncionamento: v })}
              placeholder="Ex: 8 anos"
            />
          </div>

          <div className="grid-2">
            <TextInput
              label="Responsável pelo projeto"
              value={projeto.proponente.responsavel}
              onChange={v => setProp({ responsavel: v })}
              required
            />
            <TextInput
              label="E-mail"
              type="email"
              value={projeto.proponente.email}
              onChange={v => setProp({ email: v })}
              placeholder="responsavel@entidade.org.br"
            />
          </div>

          <div className="grid-3">
            <TextInput
              label="Telefone"
              value={projeto.proponente.telefone}
              onChange={v => setProp({ telefone: formatPhone(v) })}
              placeholder="(31) 99999-9999"
            />
            <TextInput
              label="Cidade"
              value={projeto.proponente.cidade}
              onChange={v => setProp({ cidade: v })}
            />
            <TextInput
              label="Estado"
              value={projeto.proponente.estado}
              onChange={v => setProp({ estado: v.toUpperCase().slice(0, 2) })}
              placeholder="UF"
            />
          </div>
        </section>
      )}

      {/* ===================== ETAPA 3 ===================== */}
      {step === 2 && (
        <section className="step-section">
          <h2>Etapa 3 — Estrutura do projeto</h2>

          <div className="ai-cta">
            <div>
              <strong>Quer ajuda da IA?</strong>
              <p className="muted">
                A IA pode sugerir texto para objetivo geral, justificativa, metodologia,
                resultados esperados e metas preliminares com base na ideia inicial.
              </p>
            </div>
            <button
              type="button"
              className="btn-accent"
              onClick={suggestStructure}
              disabled={aiBusy !== null}
            >
              {aiBusy === 'structure' ? 'Gerando…' : 'Gerar sugestão com IA'}
            </button>
          </div>

          <TextArea
            label="Objeto do projeto"
            value={projeto.estrutura.objeto}
            onChange={v => setEstrutura({ objeto: v })}
            placeholder="O que será realizado, em termos concretos."
            required
          />
          <TextArea
            label="Objetivo geral"
            value={projeto.estrutura.objetivoGeral}
            onChange={v => setEstrutura({ objetivoGeral: v })}
            required
          />
          <TextArea
            label="Objetivos específicos"
            value={projeto.estrutura.objetivosEspecificos}
            onChange={v => setEstrutura({ objetivosEspecificos: v })}
            placeholder="Liste os objetivos desdobrados."
          />
          <TextArea
            label="Justificativa"
            value={projeto.estrutura.justificativa}
            onChange={v => setEstrutura({ justificativa: v })}
            rows={5}
            required
          />
          <TextArea
            label="Metodologia"
            value={projeto.estrutura.metodologia}
            onChange={v => setEstrutura({ metodologia: v })}
            rows={5}
            required
          />

          <div className="grid-2">
            <TextInput
              label="Público beneficiário"
              value={projeto.estrutura.publicoBeneficiario}
              onChange={v => setEstrutura({ publicoBeneficiario: v })}
            />
            <TextInput
              label="Quantidade estimada de beneficiários"
              type="number"
              value={projeto.estrutura.quantidadeBeneficiarios}
              onChange={v => setEstrutura({ quantidadeBeneficiarios: v })}
            />
          </div>

          <div className="grid-2">
            <SelectInput
              label="Faixa etária"
              value={projeto.estrutura.faixaEtaria}
              onChange={v => setEstrutura({ faixaEtaria: v as FaixaEtaria })}
              options={FAIXA_OPTS}
            />
            <div className="field">
              <label>Atendimento a PCD?</label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={projeto.estrutura.atendePCD}
                  onChange={e => setEstrutura({ atendePCD: e.target.checked })}
                />
                Sim, o projeto atende pessoas com deficiência
              </label>
            </div>
          </div>

          <TextArea
            label="Locais de execução"
            value={projeto.estrutura.locaisExecucao}
            onChange={v => setEstrutura({ locaisExecucao: v })}
            placeholder="Endereços, espaços públicos, equipamentos, parcerias..."
          />
          <TextArea
            label="Cronograma resumido"
            value={projeto.estrutura.cronogramaResumido}
            onChange={v => setEstrutura({ cronogramaResumido: v })}
            placeholder="Etapas principais e prazos estimados."
          />
          <TextArea
            label="Resultados esperados"
            value={projeto.estrutura.resultadosEsperados}
            onChange={v => setEstrutura({ resultadosEsperados: v })}
          />
        </section>
      )}

      {/* ===================== ETAPA 4 ===================== */}
      {step === 3 && (
        <section className="step-section">
          <h2>Etapa 4 — Metas</h2>

          <div className="ai-cta">
            <div>
              <strong>Sugestão de metas com IA</strong>
              <p className="muted">
                A IA pode propor metas coerentes com o projeto, com indicador e forma de verificação.
              </p>
            </div>
            <button
              type="button"
              className="btn-accent"
              onClick={suggestGoals}
              disabled={aiBusy !== null}
            >
              {aiBusy === 'goals' ? 'Gerando…' : 'Sugerir metas com IA'}
            </button>
          </div>

          <GoalsForm metas={projeto.metas} onChange={setMetas} />
        </section>
      )}

      {/* ===================== ETAPA 5 ===================== */}
      {step === 4 && (
        <section className="step-section">
          <h2>Etapa 5 — Orçamento inicial simplificado</h2>
          <BudgetTable itens={projeto.orcamento} onChange={setOrcamento} />
        </section>
      )}

      {/* ===================== ETAPA 6 ===================== */}
      {step === 5 && (
        <section className="step-section">
          <h2>Etapa 6 — Validação técnica preliminar</h2>
          <p className="muted">
            A IA vai analisar todos os campos preenchidos e apontar pendências,
            sugestões e próximos passos. Não aprova se faltar informação essencial.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={runValidation}
            disabled={aiBusy !== null}
          >
            {aiBusy === 'validate' ? 'Validando…' : 'Validar projeto com IA'}
          </button>

          {projeto.validacao && (
            <div style={{ marginTop: 24 }}>
              <ValidationResult resultado={projeto.validacao} />
            </div>
          )}
        </section>
      )}

      {/* ===================== ETAPA 7 ===================== */}
      {step === 6 && (
        <section className="step-section">
          <h2>Etapa 7 — Resumo e envio simulado</h2>

          <div className="resumo-grid">
            <div className="resumo-card">
              <h4>Projeto</h4>
              <p><strong>Nome:</strong> {projeto.ideia.nome || '—'}</p>
              <p><strong>Modalidade:</strong> {projeto.ideia.modalidade || '—'}</p>
              <p><strong>Tipo:</strong> {projeto.ideia.tipoProjeto || '—'}</p>
              <p><strong>Local:</strong> {projeto.ideia.localPrevisto || '—'}</p>
              <p><strong>Duração:</strong> {projeto.ideia.duracaoEstimada || '—'}</p>
            </div>
            <div className="resumo-card">
              <h4>Proponente</h4>
              <p><strong>Entidade:</strong> {projeto.proponente.nomeEntidade || '—'}</p>
              <p><strong>CNPJ:</strong> {projeto.proponente.cnpj || '—'}</p>
              <p><strong>Responsável:</strong> {projeto.proponente.responsavel || '—'}</p>
              <p><strong>Cidade/UF:</strong> {projeto.proponente.cidade}/{projeto.proponente.estado}</p>
            </div>
            <div className="resumo-card">
              <h4>Metas</h4>
              <p><strong>Cadastradas:</strong> {projeto.metas.filter(m => m.descricao.trim()).length}</p>
              <ul className="bullet-list small">
                {projeto.metas.filter(m => m.descricao.trim()).map(m => (
                  <li key={m.id}>{m.descricao}</li>
                ))}
              </ul>
            </div>
            <div className="resumo-card">
              <h4>Orçamento</h4>
              <p><strong>Itens:</strong> {projeto.orcamento.filter(i => i.descricao.trim()).length}</p>
              <p><strong>Total estimado:</strong> {formatBRL(totalOrcamento)}</p>
            </div>
            {projeto.validacao && (
              <div className="resumo-card resumo-card-wide">
                <h4>Validação técnica preliminar</h4>
                <p>
                  <strong>Status:</strong> {projeto.validacao.status} ·{' '}
                  <strong>Score:</strong> {projeto.validacao.score}/100
                </p>
                {projeto.validacao.pendencias.length > 0 && (
                  <>
                    <p className="small muted" style={{ marginTop: 8 }}>Pendências:</p>
                    <ul className="bullet-list small">
                      {projeto.validacao.pendencias.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="resumo-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => exportToTxt(projeto)}
            >
              Baixar projeto em .txt
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => exportToJson(projeto)}
            >
              Baixar projeto em .json
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => saveDraft(projeto)}
            >
              Salvar rascunho no navegador
            </button>
            <button
              type="button"
              className="btn-accent"
              onClick={simulateSend}
            >
              Simular envio para validador
            </button>
            <button
              type="button"
              className="btn-ghost-danger"
              onClick={clearForm}
            >
              Limpar formulário
            </button>
          </div>

          {sentMessage && (
            <div className="alert alert-success" style={{ marginTop: 16 }}>
              {sentMessage}
            </div>
          )}
        </section>
      )}

      {/* ===================== NAVEGAÇÃO ===================== */}
      <div className="wizard-nav">
        <button
          type="button"
          className="btn-secondary"
          onClick={goBack}
          disabled={step === 0}
        >
          ← Voltar
        </button>
        {step < STEPS.length - 1 && (
          <button type="button" className="btn-primary" onClick={tryNext}>
            Próximo →
          </button>
        )}
      </div>
    </div>
  )
}
