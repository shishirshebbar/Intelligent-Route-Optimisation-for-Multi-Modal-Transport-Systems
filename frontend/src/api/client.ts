import axios from 'axios'

// e.g. VITE_API_BASE="http://localhost:8000/api/v1"
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 15000,
})

// (optional) log errors in dev
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (import.meta.env.DEV) console.error('[API ERROR]', err)
    return Promise.reject(err)
  }
)

export default api
