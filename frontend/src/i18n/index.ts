import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './en/common.json'
import enTree   from './en/tree.json'
import enPerson from './en/person.json'
import enAdmin  from './en/admin.json'

import hiCommon from './hi/common.json'
import hiTree   from './hi/tree.json'
import hiPerson from './hi/person.json'
import hiAdmin  from './hi/admin.json'

import mrCommon from './mr/common.json'
import mrTree   from './mr/tree.json'
import mrPerson from './mr/person.json'
import mrAdmin  from './mr/admin.json'

const saved = localStorage.getItem('lang') ?? 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, tree: enTree, person: enPerson, admin: enAdmin },
    hi: { common: hiCommon, tree: hiTree, person: hiPerson, admin: hiAdmin },
    mr: { common: mrCommon, tree: mrTree, person: mrPerson, admin: mrAdmin },
  },
  lng: saved,
  fallbackLng: 'en',
  ns: ['common', 'tree', 'person', 'admin'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export default i18n
