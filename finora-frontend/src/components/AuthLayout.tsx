import type { ReactNode } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from './Brand'

export function AuthLayout({ children, eyebrow, title, description }: {
  children: ReactNode
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <div className="auth-aside-inner">
          <Brand />
          <div className="auth-aside-copy">
            <span className="eyebrow eyebrow-light">PROJETO EM DESENVOLVIMENTO</span>
            <h2>A primeira etapa do Finora é construir um <em>acesso confiável.</em></h2>
            <p>Cadastro, login e recuperação de acesso estão sendo estruturados antes dos módulos financeiros.</p>
          </div>
          <div className="auth-aside-bottom"><ShieldCheck size={16} /> Nesta etapa, solicitamos apenas nome, e-mail e senha.</div>
        </div>
        <div className="auth-orbit auth-orbit-one" />
        <div className="auth-orbit auth-orbit-two" />
      </aside>

      <section className="auth-main">
        <div className="auth-topline"><Link className="back-home" to="/"><ArrowLeft size={16} /> Voltar ao início</Link><span>Já faz parte? <Link to="/login">Entrar</Link></span></div>
        <div className="auth-form-wrap">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
        </div>
        <div className="auth-legal">Os documentos de Termos de Uso e Política de Privacidade serão publicados antes da disponibilização pública do serviço.</div>
      </section>
    </main>
  )
}
