import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LoaderCircle, LogOut, Wallet } from 'lucide-react'
import { Brand } from '../components/Brand'
import { ApiError, authApi } from '../lib/api'

type User = { id: string; name: string; email: string }

export function AppPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    authApi.me()
      .then((currentUser) => { if (active) setUser(currentUser) })
      .catch((reason: unknown) => {
        if (!active) return
        if (reason instanceof ApiError && reason.status === 401) {
          navigate('/login', { replace: true })
        } else {
          setError(reason instanceof Error ? reason.message : 'Não foi possível validar sua sessão.')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate])

  async function handleLogout() {
    try {
      await authApi.logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-empty-page">
      <header className="app-topbar"><Brand /><button className="button button-secondary button-small" onClick={handleLogout} type="button"><LogOut size={15} /> Sair</button></header>
      <main className="app-empty-main">
        {loading ? <div className="loading-state"><LoaderCircle className="spin" size={22} /> Validando sua sessão...</div> : error ? <div className="empty-card"><h1>Não foi possível acessar sua área.</h1><p>{error}</p><button className="button button-primary" onClick={() => window.location.reload()} type="button">Tentar novamente</button></div> : user ? (
          <div className="empty-card">
            <span className="empty-card-icon"><Wallet size={25} /></span>
            <span className="eyebrow">SEU ESPAÇO FINANCEIRO</span>
            <h1>Olá, {user.name}.</h1>
            <p>Sua conta está conectada. Os módulos de contas, lançamentos e dashboard ainda não foram implementados nesta versão.</p>
            <div className="empty-state-line"><span /> Módulo de lançamentos ainda não disponível</div>
            <button className="button button-secondary" onClick={() => navigate('/')} type="button">Voltar à página inicial <ArrowRight size={16} /></button>
          </div>
        ) : null}
      </main>
    </div>
  )
}
