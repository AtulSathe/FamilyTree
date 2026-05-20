// src/mocks/browser.ts
// MSW browser worker — imported in main.tsx when VITE_USE_MOCK=true

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
