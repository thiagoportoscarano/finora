import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { AuthLayout } from '../components/AuthLayout'
import { ApiError, authApi } from '../lib/api'

type FormStatus = { type: 'error' | 'success'; message: string } | null

function FormAlert({ status }: { status: FormStatus }) {
  if (!status) return null
  return <div className={`form-alert ${status.type}`} role="status">{status.message}</div>
}

function PasswordInput({ id, label, value, onChange, autoComplete, minLength = 8 }: {
  id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string; minLength?: number
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap"><LockKeyhole size={17} /><input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={autoComplete} minLength={minLength} required /><button type="button" className="password-toggle" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
    </div>
  )
}

function EmailInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="form-field"><label htmlFor="email">E-mail</label><div className="input-wrap"><Mail size={17} /><input id="email" type="email" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Digite seu e-mail" autoComplete="email" required /></div></div>
}

function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return <button className="button button-primary button-submit" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Enviando...</> : <>{children}<ArrowRight size={17} /></>}</button>
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)
  const [searchParams] = useSearchParams()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setLoading(true)
    try {
      await authApi.login(email.trim(), password)
      navigate('/app')
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout eyebrow="BEM-VINDO DE VOLTA" title="Entre na sua conta." description="Acesse sua conta. Os recursos de controle financeiro ainda estão em desenvolvimento.">
      {searchParams.get('registered') === '1' && <FormAlert status={{ type: 'success', message: 'Cadastro concluído. Entre com suas credenciais.' }} />}
      {searchParams.get('reset') === '1' && <FormAlert status={{ type: 'success', message: 'Senha redefinida. Você já pode entrar com a nova senha.' }} />}
      <form className="auth-form" onSubmit={handleSubmit}>
        <EmailInput value={email} onChange={setEmail} />
        <PasswordInput id="password" label="Senha" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="form-options form-options-end"><Link to="/recuperar-senha">Esqueceu a senha?</Link></div>
        <FormAlert status={status} />
        <SubmitButton loading={loading}>Entrar</SubmitButton>
      </form>
      <p className="auth-switch">Ainda não tem uma conta? <Link to="/cadastro">Criar conta</Link></p>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas não coincidem.' })
      return
    }
    setLoading(true)
    try {
      await authApi.register(name.trim(), email.trim(), password)
      navigate('/login?registered=1')
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ApiError ? error.message : 'Não foi possível criar sua conta. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout eyebrow="COMECE POR AQUI" title="Crie sua conta." description="Preencha seus dados para criar o acesso. Os módulos financeiros ainda estão em desenvolvimento.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-field"><label htmlFor="name">Nome</label><div className="input-wrap"><UserRound size={17} /><input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Como podemos te chamar?" autoComplete="name" minLength={2} maxLength={100} required /></div></div>
        <EmailInput value={email} onChange={setEmail} />
        <PasswordInput id="password" label="Senha" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordInput id="confirm-password" label="Confirme sua senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        <p className="field-hint">Use pelo menos 8 caracteres. Evite senhas que você já utiliza em outros serviços.</p>
        <FormAlert status={status} />
        <SubmitButton loading={loading}>Criar conta</SubmitButton>
      </form>
      <p className="auth-switch">Já tem uma conta? <Link to="/login">Entrar</Link></p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setLoading(true)
    try {
      await authApi.requestPasswordReset(email.trim())
      setStatus({ type: 'success', message: 'Se existir uma conta associada a esse e-mail, a API processará a solicitação. O envio por e-mail depende da configuração do servidor.' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ApiError ? error.message : 'Não foi possível solicitar a recuperação agora.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout eyebrow="RECUPERAÇÃO DE ACESSO" title="Vamos recuperar seu acesso." description="Informe o e-mail cadastrado. A API processará a solicitação; o envio por e-mail depende da configuração do servidor.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <EmailInput value={email} onChange={setEmail} />
        <FormAlert status={status} />
        <SubmitButton loading={loading}>Enviar instruções</SubmitButton>
      </form>
      <p className="auth-switch"><Link to="/login">Voltar para o login</Link></p>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    if (!token) {
      setStatus({ type: 'error', message: 'O link de redefinição está incompleto. Solicite um novo e-mail de recuperação.' })
      return
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas não coincidem.' })
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      navigate('/login?reset=1')
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ApiError ? error.message : 'Não foi possível redefinir a senha.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout eyebrow="NOVA SENHA" title="Escolha uma nova senha." description="Crie uma senha nova para voltar a acessar sua conta.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <PasswordInput id="password" label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordInput id="confirm-password" label="Confirme a nova senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        <FormAlert status={status} />
        <SubmitButton loading={loading}>Salvar nova senha</SubmitButton>
      </form>
      <p className="auth-switch"><Link to="/login">Voltar para o login</Link></p>
    </AuthLayout>
  )
}
