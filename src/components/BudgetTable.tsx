import type { ItemOrcamento, CategoriaOrcamento } from '../types/project'
import { CATEGORIAS_ORCAMENTO } from '../types/project'
import { newId } from '../utils/formatters'
import { formatBRL } from '../utils/formatters'

interface Props {
  itens: ItemOrcamento[]
  onChange: (itens: ItemOrcamento[]) => void
}

export default function BudgetTable({ itens, onChange }: Props) {
  const update = (id: string, patch: Partial<ItemOrcamento>) => {
    onChange(itens.map(i => (i.id === id ? { ...i, ...patch } : i)))
  }

  const add = () => {
    onChange([
      ...itens,
      {
        id: newId(),
        categoria: 'Atividade-fim',
        descricao: '',
        quantidade: 1,
        valorUnitario: 0
      }
    ])
  }

  const remove = (id: string) => {
    onChange(itens.filter(i => i.id !== id))
  }

  const total = itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
  const totalFim = itens
    .filter(i => i.categoria === 'Atividade-fim')
    .reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)
  const totalMeio = itens
    .filter(i => i.categoria === 'Atividade-meio')
    .reduce((s, i) => s + i.quantidade * i.valorUnitario, 0)

  return (
    <div className="budget">
      <div className="alert alert-warning">
        Valores apresentados são estimativas preliminares e devem ser revisados conforme regras
        vigentes da Lei de Incentivo ao Esporte.
      </div>

      {itens.length === 0 && (
        <p className="muted">Nenhum item de orçamento cadastrado.</p>
      )}

      {itens.map((it, idx) => {
        const subtotal = it.quantidade * it.valorUnitario
        return (
          <div key={it.id} className="budget-row">
            <div className="budget-row-head">
              <strong>Item {idx + 1}</strong>
              <button
                type="button"
                className="btn-ghost-danger"
                onClick={() => remove(it.id)}
              >
                remover
              </button>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Categoria</label>
                <select
                  value={it.categoria}
                  onChange={e =>
                    update(it.id, { categoria: e.target.value as CategoriaOrcamento })
                  }
                >
                  {CATEGORIAS_ORCAMENTO.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Descrição</label>
                <input
                  value={it.descricao}
                  onChange={e => update(it.id, { descricao: e.target.value })}
                  placeholder="Ex: Bolas oficiais de basquete tam. 6"
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="field">
                <label>Quantidade</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={it.quantidade}
                  onChange={e =>
                    update(it.id, { quantidade: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Valor unitário (R$)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.valorUnitario}
                  onChange={e =>
                    update(it.id, { valorUnitario: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field">
                <label>Subtotal</label>
                <input value={formatBRL(subtotal)} readOnly />
              </div>
            </div>
          </div>
        )
      })}

      <button type="button" className="btn-secondary" onClick={add}>
        + Adicionar item
      </button>

      <div className="budget-totals">
        <div className="totals-row">
          <span>Total Atividade-fim</span>
          <strong>{formatBRL(totalFim)}</strong>
        </div>
        <div className="totals-row">
          <span>Total Atividade-meio</span>
          <strong>{formatBRL(totalMeio)}</strong>
        </div>
        <div className="totals-row totals-grand">
          <span>TOTAL GERAL ESTIMADO</span>
          <strong>{formatBRL(total)}</strong>
        </div>
      </div>
    </div>
  )
}
