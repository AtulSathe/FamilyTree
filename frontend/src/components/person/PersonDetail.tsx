import { useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PersonDetail as PersonDetailType } from '../../types/person'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useUpdatePerson, useRequestPhotoUploadUrl } from '../../api/persons'

const CDN_BASE = import.meta.env.VITE_BLOB_CDN_BASE ?? ''
const PHOTOS_CONTAINER = 'person-photos'

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
  const requestUploadUrl = useRequestPhotoUploadUrl(detail.id)

  const canEdit = canEditTree(detail.primaryTreeId ?? '')
  const uploading = requestUploadUrl.isPending || updatePerson.isPending

  function handlePhotoClick() {
    if (canEdit && !uploading) fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // reset so the same file can be re-selected even on early-return paths
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB'); return }

    try {
      const { sasUrl, blobName } = await requestUploadUrl.mutateAsync()
      const putRes = await fetch(sasUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })
      if (!putRes.ok) throw new Error(`Blob upload failed: ${putRes.status}`)
      const cdnUrl = `${CDN_BASE}/${PHOTOS_CONTAINER}/${blobName}`
      await updatePerson.mutateAsync({ photoBlobUrl: cdnUrl })
    } catch (err) {
      console.error('Photo upload failed', err)
      alert('Photo upload failed. Please try again.')
    }
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
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-wait"
              title="Change photo"
            >
              {uploading ? (
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
