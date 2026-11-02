import { ArrowRight, ArrowUpRight, BarChart3, Check, ClipboardList, LockKeyhole, Menu, Wallet, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container nav-container">
          <Brand />
          <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'}>
            <a href="#produto" onClick={() => setMenuOpen(false)}>O projeto</a>
            <a href="#recursos" onClick={() => setMenuOpen(false)}>Escopo</a>
            <a href="#privacidade" onClick={() => setMenuOpen(false)}>Privacidade</a>
          </nav>
          <div className="nav-actions">
            <Link className="nav-login" to="/login">Entrar</Link>
            <Link className="button button-primary nav-cta" to="/cadastro">Criar conta <ArrowUpRight size={16} /></Link>
          </div>
          <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} type="button">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section" id="produto">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span className="eyebrow-dot" /> PROJETO EM DESENVOLVIMENTO</span>
              <h1>Controle financeiro com <em>dados reais.</em></h1>
              <p className="hero-description">Finora é um projeto de controle financeiro pessoal e multiusuário. A aplicação está em construção; nesta etapa, estamos estruturando as telas de acesso e a API.</p>
              <div className="hero-actions">
                <Link to="/cadastro" className="button button-primary button-large">Criar conta <ArrowRight size={17} /></Link>
                <a href="#recursos" className="text-link">Ver escopo do projeto <ArrowUpRight size={16} /></a>
              </div>
              <div className="hero-reassurance"><LockKeyhole size={15} /> Nenhum saldo ou lançamento de demonstração é exibido.</div>
            </div>

            <div className="hero-visual project-status-visual" aria-label="Situação atual do desenvolvimento">
              <div className="visual-glow" />
              <div className="project-status-card">
                <span className="preview-kicker">SITUAÇÃO ATUAL</span>
                <h2>Etapa de acesso</h2>
                <p className="project-status-description">O projeto ainda não possui módulos de controle financeiro disponíveis.</p>
                <div className="project-status-list">
                  <div><span className="project-status-mark complete"><Check size={14} /></span><span><b>Interface de acesso</b><small>Telas de login e cadastro criadas</small></span></div>
                  <div><span className="project-status-mark complete"><Check size={14} /></span><span><b>API de autenticação</b><small>Estrutura inicial implementada</small></span></div>
                  <div><span className="project-status-mark pending"><Wallet size={14} /></span><span><b>Contas e lançamentos</b><small>Ainda não implementados</small></span></div>
                  <div><span className="project-status-mark pending"><BarChart3 size={14} /></span><span><b>Dashboard financeiro</b><small>Ainda não implementado</small></span></div>
                </div>
                <p className="project-status-footnote">A interface não contém registros financeiros de exemplo.</p>
              </div>
            </div>
          </div>
          <div className="hero-bottom-rule" />
        </section>

        <section className="intro-strip">
          <div className="container intro-strip-inner"><span>ESCOPO ATUAL</span><p>Somente o que já existe é apresentado como disponível.</p><ClipboardList size={18} /></div>
        </section>

        <section className="features-section section-space" id="recursos">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">ESCOPO PLANEJADO</span>
              <h2>O que está previsto<br />para o projeto.</h2>
              <p>Os módulos abaixo ainda não estão disponíveis. Serão implementados em etapas, usando os dados cadastrados pelos próprios usuários.</p>
            </div>
            <div className="features-grid">
              <article className="feature-card feature-card-main"><div className="feature-icon"><Wallet size={21} /></div><span className="feature-index">PLANEJADO · NÃO IMPLEMENTADO</span><h3>Contas e lançamentos</h3><p>Cadastro de contas e movimentações financeiras. Nenhum saldo ou lançamento é criado automaticamente.</p></article>
              <article className="feature-card"><div className="feature-icon"><BarChart3 size={21} /></div><span className="feature-index">PLANEJADO · NÃO IMPLEMENTADO</span><h3>Indicadores e relatórios</h3><p>Gráficos e indicadores serão calculados a partir das movimentações reais registradas na aplicação.</p></article>
              <article className="feature-card"><div className="feature-icon"><ClipboardList size={21} /></div><span className="feature-index">PLANEJADO · NÃO IMPLEMENTADO</span><h3>Orçamentos</h3><p>Planejamento por categoria e acompanhamento de limites ainda não estão disponíveis.</p></article>
            </div>
          </div>
        </section>

        <section className="privacy-section" id="privacidade">
          <div className="container privacy-inner">
            <div className="privacy-icon"><LockKeyhole size={22} /></div>
            <div><span className="eyebrow eyebrow-light">PRIVACIDADE E SEGURANÇA</span><h2>Sem prometer o que<br /><em>ainda não foi validado.</em></h2><p>A autenticação possui uma implementação inicial no backend. Antes de disponibilizar o produto publicamente, ainda será necessário revisar a segurança, configurar HTTPS, validar a proteção contra CSRF e publicar a política de privacidade.</p></div>
            <div className="privacy-list"><span><Check size={16} /> Dados financeiros ainda não são coletados</span><span><Check size={16} /> JWT em cookies HttpOnly na API</span><span><Check size={16} /> Revisão de segurança pendente</span></div>
          </div>
        </section>

        <section className="closing-section"><div className="container closing-inner"><span className="eyebrow">PROJETO EM CONSTRUÇÃO</span><h2>Primeiro a estrutura.<br /><em>Depois, os dados reais.</em></h2><Link to="/cadastro" className="button button-primary button-large">Acessar cadastro <ArrowRight size={17} /></Link></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-inner"><Brand /><span>© {new Date().getFullYear()} Finora. Projeto em desenvolvimento.</span><div className="footer-links"><a href="#privacidade">Privacidade</a></div></div></footer>
    </div>
  )
}
