import { useEffect, useState } from 'react'
import { Cookie, Settings2, X } from 'lucide-react'

type Preferences = {
  necessary: true
  savedAt: string
}

const CONSENT_COOKIE = 'finora_cookie_preferences'

function hasSavedConsent(): boolean {
  const entry = document.cookie.split('; ').find((item) => item.startsWith(`${CONSENT_COOKIE}=`))
  if (!entry) return false

  try {
    const preferences = JSON.parse(decodeURIComponent(entry.slice(CONSENT_COOKIE.length + 1))) as Partial<Preferences>
    return preferences.necessary === true
  } catch {
    return false
  }
}

function saveConsent() {
  const preferences: Preferences = {
    necessary: true,
    savedAt: new Date().toISOString(),
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(preferences))}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!hasSavedConsent()) setVisible(true)
  }, [])

  function confirm() {
    saveConsent()
    setVisible(false)
    setSettingsOpen(false)
  }

  function openSettings() {
    setVisible(true)
    setSettingsOpen(true)
  }

  return (
    <>
      <button className="cookie-manage-link" onClick={openSettings} type="button">
        <Cookie size={15} /> Preferências de cookies
      </button>

      {visible && (
        <div className="cookie-layer" role="presentation">
          <section className="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
            <div className="cookie-banner-top">
              <div className="cookie-icon"><Cookie size={21} /></div>
              <button className="icon-button cookie-close" onClick={() => setVisible(false)} aria-label="Fechar aviso" type="button">
                <X size={18} />
              </button>
            </div>
            {!settingsOpen ? (
              <>
                <h2 id="cookie-title">Sobre os cookies</h2>
                <p>Nesta versão, o Finora utiliza apenas um cookie necessário para guardar esta escolha de preferência. Não há ferramentas de análise, publicidade ou personalização conectadas.</p>
                <div className="cookie-actions">
                  <button className="button button-primary button-small" onClick={confirm} type="button">Entendi</button>
                  <button className="button button-quiet button-small" onClick={() => setSettingsOpen(true)} type="button"><Settings2 size={15} /> Ver detalhes</button>
                </div>
              </>
            ) : (
              <>
                <h2 id="cookie-title">Preferências de cookies</h2>
                <p>Os cookies opcionais não estão ativos nesta versão. O único cookie utilizado guarda a confirmação deste aviso.</p>
                <div className="cookie-options">
                  <div className="cookie-option">
                    <div><strong>Preferência necessária</strong><small>Armazena se este aviso já foi apresentado e confirmado.</small></div>
                    <span className="always-on">Necessário</span>
                  </div>
                  <div className="cookie-option">
                    <div><strong>Cookies opcionais</strong><small>Não há cookies analíticos, publicitários ou de personalização ativos.</small></div>
                    <span className="always-on">Inativos</span>
                  </div>
                </div>
                <div className="cookie-actions">
                  <button className="button button-primary button-small" onClick={confirm} type="button">Confirmar</button>
                </div>
              </>
            )}
            <p className="cookie-note">Você pode reabrir este painel pelo botão fixo de preferências.</p>
          </section>
        </div>
      )}
    </>
  )
}
