import { getAIStatus } from "../services/aiService";
import { hasDraft } from "../services/storageService";

interface Props {
  onStart: () => void;
  onContinue: () => void;
}

export default function Home({ onStart, onContinue }: Props) {
  const ai = getAIStatus();
  const draftExists = hasDraft();

  return (
    <div className="home">
      <header className="home-header">
        <div className="brand"> </div>
        <div className={`ai-status ${ai.configured ? "ai-on" : "ai-off"}`}>
          {ai.configured
            ? `IA ativa · ${ai.provider} · ${ai.model}`
            : "IA não configurada — usando modo de demonstração"}
        </div>
      </header>

      <section className="hero">
        <div className="hero-tag">MÓDULO A</div>
        <h1>Estruturação do Projeto</h1>

        <div className="hero-actions">
          <button className="btn-primary" onClick={onStart}>
            Iniciar estruturação do projeto
          </button>
          {draftExists && (
            <button className="btn-secondary" onClick={onContinue}>
              Continuar rascunho salvo
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
