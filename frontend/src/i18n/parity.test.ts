import { describe, it, expect } from 'vitest'
import enCommon from './en/common.json'
import enTree from './en/tree.json'
import enPerson from './en/person.json'
import enAdmin from './en/admin.json'
import hiCommon from './hi/common.json'
import hiTree from './hi/tree.json'
import hiPerson from './hi/person.json'
import hiAdmin from './hi/admin.json'
import mrCommon from './mr/common.json'
import mrTree from './mr/tree.json'
import mrPerson from './mr/person.json'
import mrAdmin from './mr/admin.json'

type Json = Record<string, unknown>

function keyShape(o: Json): string[] {
  const out: string[] = []
  const walk = (node: unknown, path: string) => {
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      for (const k of Object.keys(node as Json).sort()) {
        const next = path ? `${path}.${k}` : k
        out.push(next)
        walk((node as Json)[k], next)
      }
    }
  }
  walk(o, '')
  return out
}

describe('i18n key parity across en/hi/mr', () => {
  const namespaces: Array<{ name: string; en: Json; hi: Json; mr: Json }> = [
    { name: 'common', en: enCommon, hi: hiCommon, mr: mrCommon },
    { name: 'tree',   en: enTree,   hi: hiTree,   mr: mrTree   },
    { name: 'person', en: enPerson, hi: hiPerson, mr: mrPerson },
    { name: 'admin',  en: enAdmin,  hi: hiAdmin,  mr: mrAdmin  },
  ]

  for (const ns of namespaces) {
    it(`${ns.name}: hi has every key present in en`, () => {
      const enKeys = keyShape(ns.en)
      const hiKeys = new Set(keyShape(ns.hi))
      const missing = enKeys.filter(k => !hiKeys.has(k))
      expect(missing, `missing hi keys in ${ns.name}`).toEqual([])
    })

    it(`${ns.name}: mr has every key present in en`, () => {
      const enKeys = keyShape(ns.en)
      const mrKeys = new Set(keyShape(ns.mr))
      const missing = enKeys.filter(k => !mrKeys.has(k))
      expect(missing, `missing mr keys in ${ns.name}`).toEqual([])
    })
  }
})
