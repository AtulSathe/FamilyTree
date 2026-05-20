import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const api = axios.create({ baseURL: BASE })
