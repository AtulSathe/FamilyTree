import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../common/Avatar'
import { useTreeStore, type PersonNodeData } from '../../store/treeStore'

export const PersonNode = memo(({ data, selected }: NodeProps) => {
  const d = data as PersonNodeData
  const navigate = useNavigate()
  const { activeFamilyTreeId, expandNode, collapseNode, expandedPersonIds, setAddRelationTarget, setRemoveRelationTarget, setSelectedNodeId } = useTreeStore()
  const isExpanded = expandedPersonIds.has(d.personId)
  const [hovered, setHovered] = useState(false)

  const tooltipLines = [
    d.location       ? `📍 ${d.location}` : null,
    d.birthMonthYear ? `🎂 ${d.birthMonthYear}` : null,
    d.deathMonthYear ? `✝ ${d.deathMonthYear}` : null,
  ].filter(Boolean) as string[]

  return (
    <div
      onDoubleClick={() => navigate(`/person/${d.personId}`)}
      onClick={() => setSelectedNodeId(d.personId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex flex-col items-center gap-1 cursor-pointer select-none rounded-lg p-1 transition-shadow ${
        selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      } ${d.isCenter ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
      style={{ width: 90 }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <Avatar src={d.photoBlobUrl} name={d.fullName} size={60} />

      <span className="text-xs text-center font-medium text-gray-800 leading-tight max-w-[90px] line-clamp-2">
        {d.fullName}
      </span>

      {/* Custom tooltip */}
      {hovered && tooltipLines.length > 0 && (
        <div
          className="absolute bottom-full mb-2 left-1/2 z-50 pointer-events-none"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            {tooltipLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </div>
      )}

      {/* Action buttons visible on hover */}
      {hovered && activeFamilyTreeId && (
        <div className="flex gap-1 mt-0.5">
          <button
            onClick={e => {
              e.stopPropagation()
              if (isExpanded) collapseNode(d.personId)
              else expandNode(d.personId)
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center leading-none"
            title={isExpanded ? 'Collapse relations' : 'Expand relations'}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setAddRelationTarget(d.personId) }}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-full w-5 h-5 flex items-center justify-center leading-none"
            title="Add relation"
          >
            ✚
          </button>
          <button
            onClick={e => { e.stopPropagation(); setRemoveRelationTarget(d.personId) }}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-full w-5 h-5 flex items-center justify-center leading-none font-bold"
            title="Remove a relation"
          >
            −
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
})

PersonNode.displayName = 'PersonNode'
