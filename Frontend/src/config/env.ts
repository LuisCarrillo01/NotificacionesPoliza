function getRequiredEnv(name: 'VITE_API_BASE_URL') {
  const value = import.meta.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getNumberEnv(name: 'VITE_VALIDATION_RETRY_TIMEOUT_MINUTES', defaultValue: number) {
  const rawValue = import.meta.env[name]?.trim()

  if (!rawValue) {
    return defaultValue
  }

  const parsedValue = Number(rawValue)

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid numeric environment variable: ${name}`)
  }

  return parsedValue
}

export const env = {
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Validacion de polizas',
  appEnv: import.meta.env.VITE_APP_ENV?.trim() || 'local',
  validationRetryTimeoutMinutes: getNumberEnv('VITE_VALIDATION_RETRY_TIMEOUT_MINUTES', 3),
}
