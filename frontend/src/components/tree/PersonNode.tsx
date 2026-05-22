import { memo, useState, type KeyboardEvent } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../common/Avatar'
import { useTreeStore, type PersonNodeData } from '../../store/treeStore'
import { useAuth } from '../../hooks/useAuth'
import { useCrossTreeMap } from '../../hooks/useCrossTreeMap'

export const PersonNode = memo(({ data, selected }: NodeProps) => {
  const d = data as PersonNodeData
  const navigate = useNavigate()
  const { t } = useTranslation('tree')
  const {
    activeFamilyTreeId,
    expandNode,
    collapseNode,
    expandedPersonIds,
    setAddRelationTarget,
    setRemoveRelationTarget,
    setSelectedNodeId,
  } = useTreeStore()
  const { canEditTree } = useAuth()
  const crossTreeMap = useCrossTreeMap()
  const canEdit = !!activeFamilyTreeId && canEditTree(activeFamilyTreeId)
  const isExpanded = expandedPersonIds.has(d.personId)
  const crossTreeSurnames = crossTreeMap.get(d.personId) ?? null
  const isCrossTree = !!crossTreeSurnames && crossTreeSurnames.length > 0
  const [hovered, setHovered] = useState(false)

  const tooltipLines = [
    d.location       ? `📍 ${d.location}` : null,
    d.birthMonthYear ? `🎂 ${d.birthMonthYear}` : null,
    d.deathMonthYear ? `✝ ${d.deathMonthYear}` : null,
    isCrossTree      ? `🌳 ${crossTreeSurnames!.join(' · ')}` : null,
  ].filter(Boolean) as string[]

  function openDetails() { navigate(`/person/${d.personId}`) }
  function selectNode() { setSelectedNodeId(d.personId) }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') { e.preventDefault(); openDetails() }
    else if (e.key === ' ') { e.preventDefault(); selectNode() }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('nodeAriaLabel', { name: d.fullName })}
      aria-pressed={selected}
      onDoubleClick={openDetails}
      onClick={selectNode}
      onKeyDown={handleKeyDown}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex flex-col items-center gap-1 cursor-pointer select-none rounded-lg p-1 w-[90px] outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
        selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      } ${d.isCenter ? 'ring-2 ring-indigo-400 ring-offset-2' : ''} ${
        isCrossTree && !d.isCenter && !selected ? 'ring-2 ring-amber-400 ring-offset-1' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <Avatar src={d.photoBlobUrl} name={d.fullName} size={60} />

      <span className="text-xs text-center font-medium text-gray-800 leading-tight max-w-[90px] line-clamp-2">
        {d.fullName}
      </span>

      {/* Custom tooltip */}
      {hovered && tooltipLines.length > 0 && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          role="tooltip"
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            {tooltipLines.map(line => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </div>
      )}

      {/* Action buttons visible on hover/focus */}
      {hovered && activeFamilyTreeId && (
        <div className="flex gap-1 mt-0.5">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              if (isExpanded) collapseNode(d.personId)
              else expandNode(d.personId)
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center leading-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label={`${isExpanded ? t('collapse') : t('expand')} – ${d.fullName}`}
          >
            {isExpanded ? '−' : '+'}
          </button>
          {canEdit && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setAddRelationTarget(d.personId) }}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-full w-5 h-5 flex items-center justify-center leading-none focus:outline-none focus:ring-2 focus:ring-green-400"
                title={t('addRelation')}
                aria-label={`${t('addRelation')} – ${d.fullName}`}
              >
                ✚
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setRemoveRelationTarget(d.personId) }}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-full w-5 h-5 flex items-center justify-center leading-none font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                title={t('removeRelation')}
                aria-label={`${t('removeRelation')} – ${d.fullName}`}
              >
                −
              </button>
            </>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
})

PersonNode.displayName = 'PersonNode'
