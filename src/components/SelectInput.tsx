import type { ChangeEvent } from 'react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  required?: boolean
  hint?: string
}

export default function SelectInput({
  label,
  value,
  onChange,
  options,
  required,
  hint
}: Props) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        <option value="">-- selecione --</option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {hint && <small className="hint">{hint}</small>}
    </div>
  )
}
