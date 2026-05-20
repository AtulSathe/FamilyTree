import { useTreeStore } from '../store/treeStore'
import { useSurnames } from '../api/surnames'

export function useTreeData() {
  const store = useTreeStore()
  const { data: surnames = [] } = useSurnames()

  function openTree(treeId: string, personId: string) {
    store.loadFocalNode(treeId, personId)
  }

  function expand(treeId: string, personId: string) {
    if (store.activeFamilyTreeId) store.expandNode(treeId, personId)
  }

  return { surnames, openTree, expand, ...store }
}
