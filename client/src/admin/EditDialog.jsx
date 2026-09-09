import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from '../icons.jsx'
import './EditDialog.css'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function firstAvailableTab(tabs, preferredId) {
  return tabs.find((tab) => tab.id === preferredId) || tabs[0] || null
}

export default function EditDialog({
  title,
  eyebrow,
  subtitle,
  tabs = [],
  dirty,
  onClose,
  onSave,
  saveLabel = '保存草稿并提交审核',
  saveDisabled = false,
  footNote,
  initialTab,
  extraActions,
  errors = [],
}) {
  const [selectedTabId, setSelectedTabId] = useState(() => firstAvailableTab(tabs, initialTab)?.id)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const dialogRef = useRef(null)
  const discardRef = useRef(null)
  const closeButtonRef = useRef(null)
  const continueEditingRef = useRef(null)
  const tabRefs = useRef(new Map())
  const returnFocusRef = useRef(typeof document === 'undefined' ? null : document.activeElement)
  const rawId = useId().replace(/:/g, '')
  const titleId = `edit-dialog-title-${rawId}`
  const subtitleId = `edit-dialog-subtitle-${rawId}`
  const activeTab = firstAvailableTab(tabs, selectedTabId)
  const activeTabId = activeTab?.id

  const errorItems = useMemo(() => {
    const seen = new Set()
    const add = (message, tab) => {
      const text = String(message || '').trim()
      if (!text || seen.has(text)) return null
      seen.add(text)
      return { text, tab }
    }
    const items = []
    tabs.forEach((tab) => {
      ;(tab.errors || []).forEach((message) => {
        const item = add(message, tab)
        if (item) items.push(item)
      })
    })
    errors.forEach((message) => {
      const item = add(message, null)
      if (item) items.push(item)
    })
    return items
  }, [errors, tabs])

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirmDiscard(true)
      return
    }
    onClose?.()
  }, [dirty, onClose])

  const selectTab = useCallback((tabId) => {
    setSelectedTabId(tabId)
    setConfirmDiscard(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (confirmDiscard) continueEditingRef.current?.focus()
      else closeButtonRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [confirmDiscard])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (confirmDiscard) setConfirmDiscard(false)
        else requestClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusRoot = confirmDiscard ? discardRef.current : dialogRef.current
      const nodes = Array.from(focusRoot?.querySelectorAll(focusableSelector) || [])
        .filter((node) => !node.hidden && node.getClientRects().length > 0)
      if (!nodes.length) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [confirmDiscard, requestClose])

  useEffect(() => () => {
    if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus()
  }, [])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  const onTabKeyDown = (event, currentIndex) => {
    const { key } = event
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key) || !tabs.length) return
    event.preventDefault()
    const nextIndex = key === 'Home'
      ? 0
      : key === 'End'
        ? tabs.length - 1
        : (currentIndex + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    const nextTab = tabs[nextIndex]
    selectTab(nextTab.id)
    tabRefs.current.get(nextTab.id)?.focus()
  }

  const saveIsDisabled = !dirty || errorItems.length > 0 || saveDisabled

  return <div className="edit-dialog-overlay" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
    <section
      ref={dialogRef}
      className="edit-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={subtitle ? subtitleId : undefined}
      aria-label={title ? undefined : '编辑'}
      tabIndex={-1}
    >
      <header className="edit-dialog-head">
        <div>
          {eyebrow && <span className="edit-dialog-eyebrow">{eyebrow}</span>}
          {title && <h2 id={titleId}>{title}</h2>}
          {subtitle && <p id={subtitleId}>{subtitle}</p>}
        </div>
        <button ref={closeButtonRef} className="icon-button edit-dialog-close" type="button" onClick={requestClose} aria-label="关闭编辑弹窗">
          <Icon name="close" />
        </button>
      </header>

      <div className="edit-dialog-tabs" role="tablist" aria-label={`${title || '编辑'}分组`}>
        {tabs.map((tab, index) => {
          const tabErrors = Array.from(new Set((tab.errors || []).map((message) => String(message || '').trim()).filter(Boolean)))
          const tabId = `edit-dialog-tab-${rawId}-${tab.id}`
          const panelId = `edit-dialog-panel-${rawId}-${tab.id}`
          const selected = tab.id === activeTabId
          return <button
            key={tab.id}
            ref={(node) => {
              if (node) tabRefs.current.set(tab.id, node)
              else tabRefs.current.delete(tab.id)
            }}
            className={`edit-dialog-tab${selected ? ' is-active' : ''}${tabErrors.length ? ' has-error' : ''}`}
            type="button"
            role="tab"
            id={tabId}
            aria-controls={panelId}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            <span>{tab.label}</span>{tabErrors.length > 0 && <b aria-label={`${tabErrors.length} 个错误`}>{tabErrors.length}</b>}
          </button>
        })}
      </div>

      <div className="edit-dialog-scroll">
        {errorItems.length > 0 && <section className="edit-dialog-errors" aria-label="保存前需要处理的问题">
          <strong>保存前请处理以下问题</strong>
          <ul>{errorItems.map((item) => <li key={item.text}>
            {item.tab
              ? <button type="button" onClick={() => selectTab(item.tab.id)}>{item.tab.label}：{item.text}</button>
              : <span>通用：{item.text}</span>}
          </li>)}</ul>
        </section>}
        {tabs.map((tab) => <div
          key={tab.id}
          id={`edit-dialog-panel-${rawId}-${tab.id}`}
          className="edit-dialog-panel"
          role="tabpanel"
          aria-labelledby={`edit-dialog-tab-${rawId}-${tab.id}`}
          hidden={tab.id !== activeTabId}
        >
          {tab.content}
        </div>)}
        {!tabs.length && <p className="edit-dialog-empty">当前没有可编辑内容。</p>}
      </div>

      <footer className="edit-dialog-foot">
        <div className="edit-dialog-foot-note">{footNote && <span>{footNote}</span>}</div>
        <div className="edit-dialog-actions">
          {extraActions}
          <button className="admin-btn subtle" type="button" onClick={requestClose}>取消</button>
          {onSave && <button className="admin-btn primary" type="button" disabled={saveIsDisabled} onClick={onSave}>{saveLabel}</button>}
        </div>
      </footer>

      {confirmDiscard && <div ref={discardRef} className="edit-dialog-discard" aria-live="assertive">
        <div className="edit-dialog-discard-card">
          <span className="edit-dialog-eyebrow">未保存的修改</span>
          <h3>放弃本次修改？</h3>
          <p>关闭后，当前编辑内容不会保存或提交审核。</p>
          <div className="edit-dialog-actions">
            <button ref={continueEditingRef} className="admin-btn subtle" type="button" onClick={() => setConfirmDiscard(false)}>继续编辑</button>
            <button className="admin-btn warning" type="button" onClick={() => onClose?.()}>放弃修改</button>
          </div>
        </div>
      </div>}
    </section>
  </div>
}
