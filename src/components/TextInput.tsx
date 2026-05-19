// Reusable text input
import type { ChangeEvent } from 'react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  hint?: string
}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  hint
}: Props) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <small className="hint">{hint}</small>}
    </div>
  )
}
