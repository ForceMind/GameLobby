import { useEffect, useRef } from 'react'
import { Icon } from './icons.jsx'
import { useLocale } from './useLocale.js'
import GameIllustration from './GameIllustration.jsx'

export function SectionHeader({ title, description, action, titleId }) {
  return (
    <div className="section-head">
      <div>
        <h2 id={titleId}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Progress({ value, label }) {
  const safeValue = Math.max(0, Math.min(100, value))
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={safeValue}
    >
      <span style={{ width: `${safeValue}%` }} />
    </div>
  )
}

export function GameArtwork({ game, compact = false }) {
  return (
    <span
      className={`game-art game-art-${game.id} ${compact ? 'is-compact' : ''}`}
      aria-hidden="true"
    >
      <span className="game-art-orb" />
      <GameIllustration id={game.id} compact={compact} />
    </span>
  )
}

export function Modal({ modal, onClose }) {
  const { t } = useLocale()
  const closeRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!modal) return undefined
    const previous = document.activeElement
    closeRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first) return
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
      previous?.focus?.()
    }
  }, [modal, onClose])

  if (!modal) return null

  return (
    <div
      className="modal-layer"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={
          modal.subtitle ? 'modal-subtitle modal-body' : 'modal-body'
        }
      >
        <div className="modal-head">
          <div>
            {modal.kicker && <span className="pill">{modal.kicker}</span>}
            <h2 id="modal-title">{modal.title}</h2>
            {modal.subtitle && <p id="modal-subtitle">{modal.subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            className="icon-btn"
            type="button"
            onClick={onClose}
            aria-label={t('common.closeDialog')}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body" id="modal-body">
          {modal.body}
        </div>
        <div className="modal-actions">
          {modal.actions ?? (
            <>
              {modal.cancelLabel !== null && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={onClose}
                >
                  {modal.cancelLabel || t('common.cancel')}
                </button>
              )}
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  modal.onConfirm?.()
                  onClose()
                }}
              >
                {modal.confirmLabel || t('common.gotIt')}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
