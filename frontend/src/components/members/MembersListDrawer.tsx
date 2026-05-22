import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Person } from '../../types/person'
import { useAllPersons } from '../../api/persons'
import { useTrees } from '../../api/trees'
import { useCrossTreeMap } from '../../hooks/useCrossTreeMap'
import { useTreeStore } from '../../store/treeStore'
import { useTreeAdmins, useAssignTreeAdmin, useRemoveTreeAdmin } from '../../api/admin'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  open: boolean
  onClose: () => void
}

/** Resolve a person → comma/dot-joined surnames (e.g. "Sathe · Panse" for bridge persons). */
export function linkedSurnameFor(
  person: Person,
  treeById: Map<string, string>,
  crossTreeMap: Map<string, string[]>,
): string {
  const cross = crossTreeMap.get(person.id)
  if (cross && cross.length > 0) return cross.join(' · ')
  if (person.primaryTreeId) {
    const surname = treeById.get(person.primaryTreeId)
    if (surname) return surname
  }
  return '—'
}

/**
 * Members of a single tree: primary members + cross-tree bridge persons whose
 * surname list includes this tree's surname (mirrors PersonTreeMemberships).
 *
 * If `activeTreeId` is null we show everyone (discovery view on the welcome screen).
 */
export function filterMembersForTree(
  persons: Person[],
  activeTreeId: string | null,
  activeSurname: string | undefined,
  crossTreeMap: Map<string, string[]>,
): Person[] {
  if (!activeTreeId) return persons
  return persons.filter(p => {
    if (p.primaryTreeId === activeTreeId) return true
    if (!activeSurname) return false
    return crossTreeMap.get(p.id)?.includes(activeSurname) ?? false
  })
}

export default function MembersListDrawer({ open, onClose }: Props) {
  const { t } = useTranslation('tree')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const { data: persons = [], isLoading } = useAllPersons()
  const { data: trees = [] } = useTrees()
  const crossTreeMap = useCrossTreeMap()
  const activeFamilyTreeId = useTreeStore(s => s.activeFamilyTreeId)
  const { isPowerAdmin } = useAuth()
  const { data: admins = [] } = useTreeAdmins(activeFamilyTreeId)
  const assignAdmin = useAssignTreeAdmin(activeFamilyTreeId)
  const removeAdmin = useRemoveTreeAdmin(activeFamilyTreeId)
  const adminIds = useMemo(() => new Set(admins.map(a => a.personId)), [admins])

  const treeById = useMemo(
    () => new Map(trees.map(tr => [tr.id, tr.surname])),
    [trees],
  )

  const activeSurname = activeFamilyTreeId ? treeById.get(activeFamilyTreeId) : undefined

  const visiblePersons = useMemo(
    () => filterMembersForTree(persons, activeFamilyTreeId, activeSurname, crossTreeMap),
    [persons, activeFamilyTreeId, activeSurname, crossTreeMap],
  )

  if (!open) return null

  return (
    <aside
      className="w-[380px] shrink-0 flex flex-col border-l bg-white overflow-hidden"
      aria-label={t('membersTitle')}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold text-gray-800">{t('membersTitle')}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={tCommon('close')}
        >
          ×
        </button>
      </div>

      <div className="overflow-auto">
        {isLoading ? (
          <p className="p-4 text-sm text-gray-400">{tCommon('loading')}</p>
        ) : visiblePersons.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">{t('noMembers')}</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('memberColumns.name')}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('memberColumns.location')}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('memberColumns.birth')}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('memberColumns.death')}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('memberColumns.linkedSurname')}</th>
                {isPowerAdmin && activeFamilyTreeId && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('memberColumns.admin')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visiblePersons.map(p => {
                const surname = linkedSurnameFor(p, treeById, crossTreeMap)
                const isCrossTree = (crossTreeMap.get(p.id)?.length ?? 0) > 0
                const isAdmin = adminIds.has(p.id)
                const busy = (assignAdmin.isPending || removeAdmin.isPending) &&
                  (assignAdmin.variables === p.id || removeAdmin.variables === p.id)
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/person/${p.id}`)}
                    className="hover:bg-blue-50 cursor-pointer focus-within:bg-blue-50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                      <span>{p.fullName}</span>
                      {isAdmin && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                          {t('adminBadge')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{p.location ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{p.birthMonthYear ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{p.deathMonthYear ?? '—'}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${isCrossTree ? 'text-amber-700 font-medium' : 'text-gray-700'}`}>
                      {surname}
                    </td>
                    {isPowerAdmin && activeFamilyTreeId && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            if (busy) return
                            if (isAdmin) removeAdmin.mutate(p.id)
                            else assignAdmin.mutate(p.id)
                          }}
                          disabled={busy}
                          className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
                            isAdmin
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 focus:ring-red-400'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 focus:ring-emerald-400'
                          }`}
                        >
                          {isAdmin ? t('removeAdmin') : t('makeAdmin')}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </aside>
  )
}
