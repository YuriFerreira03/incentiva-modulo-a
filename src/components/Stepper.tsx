interface Props {
  steps: string[]
  current: number
}

export default function Stepper({ steps, current }: Props) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : 'pending'
        return (
          <div key={label} className={`step ${status}`}>
            <div className="step-bullet">{i + 1}</div>
            <div className="step-label">{label}</div>
            {i < steps.length - 1 && <div className="step-bar" />}
          </div>
        )
      })}
    </div>
  )
}
