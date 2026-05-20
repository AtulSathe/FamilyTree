import { useTranslation } from 'react-i18next'
import AppShell from '../components/layout/AppShell'
import SurnameRelationships from '../components/surname/SurnameRelationships'

export default function SurnameRelationshipsPage() {
  const { t } = useTranslation('common')

  return (
    <AppShell>
      <div className="overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">{t('surnameRelationships')}</h1>
          <SurnameRelationships />
        </div>
      </div>
    </AppShell>
  )
}
