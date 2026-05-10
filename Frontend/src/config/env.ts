function getRequiredEnv(name: 'VITE_API_BASE_URL') {
  const value = import.meta.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const env = {
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Validacion de polizas',
  appEnv: import.meta.env.VITE_APP_ENV?.trim() || 'local',
}
