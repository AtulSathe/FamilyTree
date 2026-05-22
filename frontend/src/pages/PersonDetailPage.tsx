import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePersonDetail } from '../api/persons'
import AppShell from '../components/layout/AppShell'
import PersonDetail from '../components/person/PersonDetail'
import { Modal } from '../components/common/Modal'
import PersonForm from '../components/person/PersonForm'

export default function PersonDetailPage() {
  const { id = '' } = useParams()
  const { data: detail, isLoading, error } = usePersonDetail(id)
  const { t } = useTranslation('person')
  const { t: tCommon } = useTranslation('common')
  const [editing, setEditing] = useState(false)

  return (
    <AppShell>
      <div className="overflow-y-auto h-full">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-gray-400">{tCommon('loading')}</div>
        )}
        {error && (
          <div className="p-6 text-red-600 text-sm">{tCommon('error')}</div>
        )}
        {detail && (
          <>
            <PersonDetail detail={detail} onEdit={() => setEditing(true)} />
            <Modal open={editing} title={t('editPerson')} onClose={() => setEditing(false)}>
              <PersonForm
                person={detail}
                onSuccess={() => setEditing(false)}
                onCancel={() => setEditing(false)}
              />
            </Modal>
          </>
        )}
      </div>
    </AppShell>
  )
}
