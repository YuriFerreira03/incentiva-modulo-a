import type { ResultadoValidacao } from '../types/project'

interface Props {
  resultado: ResultadoValidacao
}

export default function ValidationResult({ resultado }: Props) {
  const statusClass =
    resultado.status === 'Completo para análise preliminar'
      ? 'status-ok'
      : resultado.status === 'Parcialmente completo'
      ? 'status-warning'
      : 'status-danger'

  return (
    <div className="validation-result">
      <div className={`status-banner ${statusClass}`}>
        <div>
          <div className="status-label">STATUS DA VALIDAÇÃO TÉCNICA PRELIMINAR</div>
          <div className="status-title">{resultado.status}</div>
        </div>
        <div className="score">
          <span>{resultado.score}</span>
          <small>/100</small>
        </div>
      </div>

      <section>
        <h4>Checklist</h4>
        <ul className="checklist">
          {resultado.checklist.map((c, i) => (
            <li key={i} className={`check check-${c.status}`}>
              <span className="check-mark">
                {c.status === 'ok' ? '✓' : c.status === 'atencao' ? '!' : '○'}
              </span>
              <div>
                <strong>{c.item}</strong>
                <p>{c.comentario}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {resultado.pendencias.length > 0 && (
        <section>
          <h4>Pendências</h4>
          <ul className="bullet-list pendencias">
            {resultado.pendencias.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}

      {resultado.sugestoes.length > 0 && (
        <section>
          <h4>Sugestões de melhoria</h4>
          <ul className="bullet-list sugestoes">
            {resultado.sugestoes.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}

      {resultado.riscos.length > 0 && (
        <section>
          <h4>Riscos de inconsistência</h4>
          <ul className="bullet-list riscos">
            {resultado.riscos.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}

      {resultado.proximosPassos.length > 0 && (
        <section>
          <h4>Próximos passos recomendados</h4>
          <ol className="bullet-list">
            {resultado.proximosPassos.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </section>
      )}
    </div>
  )
}
