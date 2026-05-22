import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { useCreateTree } from '../../api/trees'

interface Props {
  open: boolean
  onClose: () => void
}

const inputCls =
  'w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

export default function CreateSurnameModal({ open, onClose }: Props) {
  const { t } = useTranslation('tree')
  const { t: tCommon } = useTranslation('common')
  const createTree = useCreateTree()
  const [surname, setSurname] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  function reset() {
    setSurname('')
    setDescription('')
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = surname.trim()
    if (!trimmed) { setError(t('surnameRequired')); return }
    setError('')
    try {
      await createTree.mutateAsync({
        surname: trimmed,
        description: description.trim() || undefined,
      })
      reset()
      onClose()
    } catch {
      setError(t('createSurnameFailed'))
    }
  }

  return (
    <Modal open={open} title={t('createSurnameTitle')} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            {t('surnameLabel')}
            <span className="text-red-500 ml-0.5">*</span>
          </span>
          <input
            className={`${inputCls} mt-0.5`}
            value={surname}
            onChange={e => setSurname(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-600">{t('descriptionLabel')}</span>
          <input
            className={`${inputCls} mt-0.5`}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={handleClose}>{tCommon('cancel')}</Button>
          <Button type="submit" loading={createTree.isPending}>{tCommon('add')}</Button>
        </div>
      </form>
    </Modal>
  )
}
