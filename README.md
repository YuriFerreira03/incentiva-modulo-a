# INCENTIVA — Módulo A (Estruturação do Projeto)

Protótipo funcional, focado em validação de conceito.
Front-end em React + Vite + TypeScript, sem backend, com integração opcional a APIs gratuitas de IA.

> **Importante.** Protótipo acadêmico. Não substitui o cadastro oficial no SLI/Ministério do Esporte, análise jurídica, contábil ou aprovação institucional. Sempre tratado como **validação técnica preliminar**.

---

## Sumário

1. [O que é](#o-que-é)
2. [Como rodar](#como-rodar)
3. [Configurar a IA](#configurar-a-ia)
4. [Estrutura de pastas](#estrutura-de-pastas)
5. [Fluxo do usuário](#fluxo-do-usuário)
6. [Onde mexer no código](#onde-mexer-no-código)

---

## O que é

Protótipo do **Módulo A** da plataforma INCENTIVA. Conduz o proponente em 7 etapas, da ideia inicial até um resumo exportável (.txt / .json) para validação técnica preliminar, com IA opcional para sugerir textos e validar pendências.

Funciona localmente, sem servidor, sem banco de dados. Os dados ficam em `LocalStorage` no próprio navegador.

---

## Como rodar

Pré-requisitos: **Node.js 18+** e **npm**.

```bash
# 1. Entrar na pasta do projeto
cd incentiva-modulo-a

# 2. Instalar dependências
npm install

# 3. (Opcional) Copiar arquivo de exemplo do .env
cp .env.example .env

# 4. (Opcional) Editar .env e colar sua chave de API — ver próxima seção

# 5. Rodar em modo desenvolvimento
npm run dev
```

Abra `http://localhost:5173` no navegador.

> **Sem chave de API o protótipo continua funcionando** com respostas simuladas (modo demonstração). A IA real só é usada se você configurar uma chave.

### Build de produção

```bash
npm run build
npm run preview
```

---

## Configurar a IA

O protótipo aceita 4 provedores de IA — todos com **free tier** em 2026:

| Provedor    | Onde pegar a chave                                           | Observação                                              |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| OpenRouter  | <https://openrouter.ai/keys>                                 | **Recomendado.** Vários modelos free com 1 só chave.    |
| Groq        | <https://console.groq.com/keys>                              | Muito rápido, free tier generoso.                       |
| Google AI   | <https://aistudio.google.com/app/apikey>                     | Gemini 2.0 Flash, free tier robusto.                    |
| Together AI | <https://api.together.xyz/>                                  | Vários modelos open-source.                             |

### Passo a passo

1. Crie conta no provedor escolhido (recomendamos **OpenRouter**).
2. Gere uma chave de API no painel.
3. Crie o arquivo `.env` na raiz do projeto (copie de `.env.example`).
4. Preencha:

```env
VITE_AI_PROVIDER=openrouter
VITE_AI_API_KEY=sk-or-v1-XXXXXXXXXXXXX
VITE_AI_MODEL=deepseek/deepseek-chat-v3.1:free
```

5. Reinicie o `npm run dev`.

### Trocar de modelo

No `.env`, mude o valor de `VITE_AI_MODEL`. Sugestões gratuitas:

```env
# OpenRouter — todos free
VITE_AI_MODEL=deepseek/deepseek-chat-v3.1:free
VITE_AI_MODEL=meta-llama/llama-3.3-70b-instruct:free
VITE_AI_MODEL=google/gemini-2.0-flash-exp:free
VITE_AI_MODEL=qwen/qwen-2.5-72b-instruct:free

# Groq
VITE_AI_PROVIDER=groq
VITE_AI_MODEL=llama-3.3-70b-versatile

# Google
VITE_AI_PROVIDER=google
VITE_AI_MODEL=gemini-2.0-flash
```

### Fallback local

Se a chave não estiver configurada ou a API falhar, o sistema usa respostas **simuladas** (mock determinístico baseado nos dados que você preencheu). O cabeçalho do app mostra qual modo está ativo.

---

## Estrutura de pastas

```
incentiva-modulo-a/
├── src/
│   ├── components/
│   │   ├── BudgetTable.tsx       # Tabela de orçamento com cálculos
│   │   ├── GoalsForm.tsx         # Formulário de metas (mín 2, máx 5)
│   │   ├── SelectInput.tsx       # Select reutilizável
│   │   ├── Stepper.tsx           # Indicador de progresso
│   │   ├── TextArea.tsx          # Textarea reutilizável
│   │   ├── TextInput.tsx         # Input reutilizável
│   │   └── ValidationResult.tsx  # Card de resultado da validação
│   ├── pages/
│   │   ├── Home.tsx              # Tela inicial
│   │   └── ProjectWizard.tsx     # Wizard de 7 etapas (página principal)
│   ├── services/
│   │   ├── aiService.ts          # IA: estrutura, metas, validação + fallback
│   │   ├── exportService.ts      # Download .txt e .json
│   │   └── storageService.ts     # Persistência em LocalStorage
│   ├── types/
│   │   └── project.ts            # Tipos e interfaces
│   ├── utils/
│   │   ├── formatters.ts         # BRL, CNPJ, telefone, slug, ids
│   │   └── validators.ts         # Validações locais
│   ├── App.tsx                   # Root: navega entre Home e Wizard
│   ├── main.tsx                  # Entry point React
│   ├── styles.css                # Estilos (CSS puro)
│   └── vite-env.d.ts             # Tipos de variáveis de ambiente
├── .env.example                  # Modelo do .env
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## Fluxo do usuário

1. **Tela inicial** — apresentação e botão "Iniciar estruturação". Se houver rascunho salvo, oferece "Continuar".
2. **Etapa 1 — Ideia inicial** — nome, descrição, modalidade, tipo, público, local, duração.
3. **Etapa 2 — Proponente** — entidade, CNPJ (com máscara), responsável, contatos.
4. **Etapa 3 — Estrutura** — objeto, objetivos, justificativa, metodologia, beneficiários, cronograma. **Botão "Gerar sugestão com IA"** preenche objetivo, justificativa, metodologia e resultados esperados.
5. **Etapa 4 — Metas** — 2 a 5 metas com indicador e verificador. **Botão "Sugerir metas com IA"**.
6. **Etapa 5 — Orçamento** — itens por categoria com cálculo automático de subtotal, total atividade-fim, total atividade-meio e total geral.
7. **Etapa 6 — Validação** — **Botão "Validar projeto com IA"** que retorna status, score, checklist, pendências, sugestões, riscos e próximos passos.
8. **Etapa 7 — Resumo** — cartões com resumo de todas as etapas + ações:
   - Baixar `.txt` (formato legível)
   - Baixar `.json` (estruturado)
   - Salvar rascunho
   - Limpar formulário
   - Simular envio para validador

Auto-save em LocalStorage a cada alteração — não perde nada se fechar o navegador.

---

## Onde mexer no código

| O que quero mudar                          | Onde mexer                                                 |
| ------------------------------------------ | ---------------------------------------------------------- |
| Adicionar ou remover campos do formulário  | `src/types/project.ts` + a etapa correspondente em `ProjectWizard.tsx` |
| Mudar prompts da IA                        | `src/services/aiService.ts` (constantes `SYSTEM_PROMPT` e dentro de cada função) |
| Trocar layout / cores                      | `src/styles.css` (tokens no `:root`)                       |
| Adicionar nova categoria de orçamento      | `CATEGORIAS_ORCAMENTO` em `src/types/project.ts`           |
| Alterar formato do `.txt` exportado        | `src/services/exportService.ts` → `exportToTxt()`          |
| Mudar regras de validação local            | `src/utils/validators.ts`                                  |
| Trocar provedor de IA padrão               | `.env` (variável `VITE_AI_PROVIDER`)                       |

---

## Limitações conhecidas

- Sem autenticação, sem backend, sem banco de dados — é um protótipo de front.
- Modelos de IA gratuitos podem ter limite de requisições por minuto.
- A validação é preliminar e didática — não substitui análise jurídica/contábil/oficial.
- Não há integração real com o SLI; o "envio" é simulado.

---

## Licença

Protótipo acadêmico. Uso livre para fins de pesquisa e demonstração.
