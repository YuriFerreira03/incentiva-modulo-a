import { useState } from 'react'
import Home from './pages/Home'
import ProjectWizard from './pages/ProjectWizard'
import './styles.css'

type Screen = 'home' | 'wizard'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [continueDraft, setContinueDraft] = useState(false)

  if (screen === 'home') {
    return (
      <Home
        onStart={() => {
          setContinueDraft(false)
          setScreen('wizard')
        }}
        onContinue={() => {
          setContinueDraft(true)
          setScreen('wizard')
        }}
      />
    )
  }

  return (
    <ProjectWizard
      loadFromDraft={continueDraft}
      onExit={() => setScreen('home')}
    />
  )
}
