import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function Modal({ open, title, onClose, children }: ModalProps) {
  const { t } = useTranslation('common')
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null

    // focus the first focusable element inside the modal, falling back to the container
    const focusFirst = () => {
      const root = containerRef.current
      if (!root) return
      const first = root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(first ?? root).focus()
    }
    // wait a tick so portal children are mounted
    const id = window.setTimeout(focusFirst, 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const root = containerRef.current
      if (!root) return
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')
      if (focusables.length === 0) { e.preventDefault(); return }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
            aria-label={t('close')}
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
