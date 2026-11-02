import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CookieConsent } from './components/CookieConsent'
import { AppPage } from './pages/AppPage'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages'
import { HomePage } from './pages/HomePage'

function NotFound() {
  return <main className="not-found"><span className="eyebrow">404</span><h1>Não encontramos essa página.</h1><a href="/">Voltar ao início</a></main>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/inicio" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  )
}
