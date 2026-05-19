// =============================================================
// Storage Service — persistência local (LocalStorage)
// =============================================================

import type { ProjetoCompleto } from '../types/project'

const STORAGE_KEY = 'incentiva-modulo-a-projeto'

export function saveDraft(projeto: ProjetoCompleto): void {
  try {
    const updated = {
      ...projeto,
      metadata: {
        ...projeto.metadata,
        atualizadoEm: new Date().toISOString()
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Erro ao salvar rascunho:', err)
  }
}

export function loadDraft(): ProjetoCompleto | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ProjetoCompleto
  } catch (err) {
    console.error('Erro ao carregar rascunho:', err)
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasDraft(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}
