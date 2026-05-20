import { useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PersonDetail as PersonDetailType } from '../../types/person'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useUpdatePerson } from '../../api/persons'

interface PersonDetailProps {
  detail: PersonDetailType
  onEdit: () => void
}

export default function PersonDetail({ detail, onEdit }: PersonDetailProps) {
  const navigate = useNavigate()
  const { t } = useTranslation('person')
  const { canEditTree } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updatePerson = useUpdatePerson(detail.id)

  const canEdit = canEditTree(detail.primaryTreeId ?? '')

  function handlePhotoClick() {
    if (canEdit) fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      updatePerson.mutate({ photoBlobUrl: dataUrl })
    }
    reader.readAsDataURL(file)
    // reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-start gap-5">
        {/* Photo with upload overlay */}
        <div className="relative group shrink-0">
          <Avatar src={detail.photoBlobUrl} name={detail.fullName} size={80} />
          {canEdit && (
            <button
              onClick={handlePhotoClick}
              disabled={updatePerson.isPending}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-wait"
              title="Change photo"
            >
              {updatePerson.isPending ? (
                <span className="text-white text-xs">…</span>
              ) : (
                <span className="text-white text-lg">📷</span>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{detail.fullName}</h1>
          {detail.nameBefore && (
            <p className="text-sm text-gray-500">{t('née')} {detail.nameBefore}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
            {detail.location && <span>📍 {detail.location}</span>}
            {detail.birthMonthYear && <span>🎂 {detail.birthMonthYear}</span>}
            {detail.deathMonthYear && <span>✝ {detail.deathMonthYear}</span>}
            {detail.phone && <span>📞 {detail.phone}</span>}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {canEdit && <Button onClick={onEdit}>{t('edit')}</Button>}
          <Button variant="secondary" onClick={() => navigate(-1)}>{t('backToTree')}</Button>
        </div>
      </div>

      {detail.hobbies && (
        <Section title={t('hobbies')}>
          <p className="text-sm text-gray-700">{detail.hobbies}</p>
        </Section>
      )}

      {detail.education && (
        <Section title={t('education')}>
          <p className="text-sm text-gray-700">{detail.education}</p>
        </Section>
      )}

      {detail.skills && (
        <Section title={t('skills')}>
          <p className="text-sm text-gray-700">{detail.skills}</p>
        </Section>
      )}

      {detail.jobs && detail.jobs.length > 0 && (
        <Section title={t('jobs')}>
          <ul className="space-y-3">
            {detail.jobs.map((job, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  {job.company && <p className="text-gray-500">{job.company}</p>}
                  <p className="text-gray-400 text-xs">
                    {job.startMMYYYY}
                    {job.endMMYYYY ? ` — ${job.endMMYYYY}` : ' — present'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {detail.customFields && Object.keys(detail.customFields).length > 0 && (
        <Section title={t('customFields')}>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(detail.customFields).map(([k, v]) => (
              <div key={k}>
                <dt className="text-gray-500 capitalize">{k}</dt>
                <dd className="font-medium text-gray-900">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h2>
      {children}
    </div>
  )
}
