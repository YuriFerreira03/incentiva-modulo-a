import type { Meta, TipoMeta } from '../types/project'
import { newId } from '../utils/formatters'

interface Props {
  metas: Meta[]
  onChange: (metas: Meta[]) => void
}

const TIPO_OPTS: TipoMeta[] = ['Quantitativa', 'Qualitativa']

export default function GoalsForm({ metas, onChange }: Props) {
  const update = (id: string, patch: Partial<Meta>) => {
    onChange(metas.map(m => (m.id === id ? { ...m, ...patch } : m)))
  }

  const add = () => {
    if (metas.length >= 5) return
    onChange([
      ...metas,
      { id: newId(), descricao: '', tipo: '', indicador: '', verificador: '', prazo: '' }
    ])
  }

  const remove = (id: string) => {
    if (metas.length <= 2) return // mínimo 2
    onChange(metas.filter(m => m.id !== id))
  }

  return (
    <div className="goals">
      {metas.map((m, idx) => (
        <div key={m.id} className="goal-card">
          <div className="goal-header">
            <strong>Meta {idx + 1}</strong>
            {metas.length > 2 && (
              <button
                type="button"
                className="btn-ghost-danger"
                onClick={() => remove(m.id)}
              >
                remover
              </button>
            )}
          </div>

          <div className="field">
            <label>Descrição da meta <span className="req">*</span></label>
            <textarea
              rows={2}
              value={m.descricao}
              onChange={e => update(m.id, { descricao: e.target.value })}
              placeholder="Ex: Atender 200 crianças em aulas regulares de basquete"
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Tipo</label>
              <select
                value={m.tipo}
                onChange={e => update(m.id, { tipo: e.target.value as TipoMeta })}
              >
                <option value="">-- selecione --</option>
                {TIPO_OPTS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Prazo estimado</label>
              <input
                value={m.prazo}
                onChange={e => update(m.id, { prazo: e.target.value })}
                placeholder="Ex: até o 12º mês"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Indicador</label>
              <input
                value={m.indicador}
                onChange={e => update(m.id, { indicador: e.target.value })}
                placeholder="Ex: Nº de beneficiários inscritos"
              />
            </div>
            <div className="field">
              <label>Verificador</label>
              <input
                value={m.verificador}
                onChange={e => update(m.id, { verificador: e.target.value })}
                placeholder="Ex: Lista de presença mensal"
              />
            </div>
          </div>
        </div>
      ))}

      {metas.length < 5 && (
        <button type="button" className="btn-secondary" onClick={add}>
          + Adicionar meta
        </button>
      )}
      <p className="muted small">
        Mínimo: 2 metas. Máximo: 5 metas.
      </p>
    </div>
  )
}
