import { ArrowUpRight, Landmark } from 'lucide-react'
import { Link } from 'react-router-dom'

type BrandProps = { compact?: boolean; linked?: boolean }

export function Brand({ compact = false, linked = true }: BrandProps) {
  const content = (
    <>
      <span className="brand-mark"><Landmark size={19} strokeWidth={2.1} /></span>
      {!compact && <span className="brand-name">finora<span>.</span></span>}
    </>
  )

  return linked ? <Link to="/" className="brand" aria-label="Finora, página inicial">{content}</Link> : <div className="brand">{content}</div>
}

export function InlineArrow() {
  return <ArrowUpRight size={16} aria-hidden="true" />
}
