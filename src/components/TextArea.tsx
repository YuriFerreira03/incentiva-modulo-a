import type { ChangeEvent } from 'react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  rows?: number
  hint?: string
}

export default function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
  hint
}: Props) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <small className="hint">{hint}</small>}
    </div>
  )
}
