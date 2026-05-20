import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Person, CreatePersonPayload, UpdatePersonPayload } from '../../types/person'
import { Button } from '../common/Button'
import { useCreatePerson, useUpdatePerson } from '../../api/persons'
import { useTrees } from '../../api/trees'

interface PersonFormProps {
  person?: Person
  defaultTreeId?: string
  hideTrees?: boolean
  onSuccess: (created?: Person) => void
  onCancel: () => void
}

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  )
}

export default function PersonForm({ person, defaultTreeId, hideTrees, onSuccess, onCancel }: PersonFormProps) {
  const { t } = useTranslation('person')
  const { data: trees = [] } = useTrees()
  const createMutation = useCreatePerson()
  const updateMutation = useUpdatePerson(person?.id ?? '')

  const [form, setForm] = useState({
    fullName:       person?.fullName       ?? '',
    nameBefore:     person?.nameBefore     ?? '',
    phone:          person?.phone          ?? '',
    location:       person?.location       ?? '',
    birthMonthYear: person?.birthMonthYear ?? '',
    deathMonthYear: person?.deathMonthYear ?? '',
    treeId:         person?.primaryTreeId  ?? defaultTreeId ?? '',
  })

  const set = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (person) {
      const payload: UpdatePersonPayload = {
        fullName:       form.fullName       || undefined,
        nameBefore:     form.nameBefore     || null,
        phone:          form.phone          || null,
        location:       form.location       || null,
        birthMonthYear: form.birthMonthYear || null,
        deathMonthYear: form.deathMonthYear || null,
      }
      await updateMutation.mutateAsync(payload)
      onSuccess()
    } else {
      const payload: CreatePersonPayload = {
        fullName:       form.fullName,
        nameBefore:     form.nameBefore     || null,
        phone:          form.phone          || null,
        location:       form.location       || null,
        birthMonthYear: form.birthMonthYear || null,
        deathMonthYear: form.deathMonthYear || null,
        treeId:         form.treeId,
      }
      const created = await createMutation.mutateAsync(payload)
      onSuccess(created)
    }
  }

  const loading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label={t('fullName')} required>
        <input
          className={inputCls}
          value={form.fullName}
          onChange={e => set('fullName', e.target.value)}
          required
        />
      </Field>

      <Field label={t('nameBefore')}>
        <input
          className={inputCls}
          value={form.nameBefore}
          onChange={e => set('nameBefore', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('birthMonthYear')}>
          <input
            className={inputCls}
            placeholder="Jan 1952"
            value={form.birthMonthYear}
            onChange={e => set('birthMonthYear', e.target.value)}
          />
        </Field>
        <Field label={t('deathMonthYear')}>
          <input
            className={inputCls}
            placeholder="Jun 2010"
            value={form.deathMonthYear}
            onChange={e => set('deathMonthYear', e.target.value)}
          />
        </Field>
      </div>

      <Field label={t('location')}>
        <input
          className={inputCls}
          value={form.location}
          onChange={e => set('location', e.target.value)}
        />
      </Field>

      <Field label={t('phone')}>
        <input
          className={inputCls}
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
        />
      </Field>

      {!person && !hideTrees && (
        <Field label={t('tree')} required>
          <select
            className={inputCls}
            value={form.treeId}
            onChange={e => set('treeId', e.target.value)}
            required
          >
            <option value="">— select —</option>
            {trees.map(tr => (
              <option key={tr.id} value={tr.id}>{tr.surname}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit" loading={loading}>
          {person ? t('save') : t('create')}
        </Button>
      </div>
    </form>
  )
}
