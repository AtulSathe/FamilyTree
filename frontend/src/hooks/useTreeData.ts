import { useTreeStore } from '../store/treeStore'
import { useSurnames } from '../api/surnames'

export function useTreeData() {
  const store = useTreeStore()
  const { data: surnames = [] } = useSurnames()

  function openTree(treeId: string, personId: string) {
    store.loadFocalNode(treeId, personId)
  }

  function expand(personId: string, levels?: number) {
    if (store.activeFamilyTreeId) store.expandNode(personId, levels)
  }

  return { surnames, openTree, expand, ...store }
}
