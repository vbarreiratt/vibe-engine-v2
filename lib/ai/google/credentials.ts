import fs from 'fs'

/**
 * Resolve and validate Google Cloud credentials path from environment variables.
 *
 * Priority order:
 * 1. GOOGLE_CLOUD_CREDENTIALS_PATH (recommended for Docker/VPS)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (standard Google SDK variable)
 *
 * @throws {Error} If no credentials path is configured or file doesn't exist
 * @returns {string} Absolute path to the service account JSON file
 */
export function getGoogleCredentialsPath(): string {
  const credentialsPath =
    process.env.GOOGLE_CLOUD_CREDENTIALS_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!credentialsPath) {
    throw new Error(
      '[GCP] Missing GOOGLE_CLOUD_CREDENTIALS_PATH or GOOGLE_APPLICATION_CREDENTIALS environment variable. ' +
      'Configure the path to your service account JSON file. ' +
      'In Docker/VPS: set GOOGLE_CLOUD_CREDENTIALS_PATH=/app/gcp-service-account.json and mount the file as a volume.'
    )
  }

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `[GCP] Credentials file not found at: ${credentialsPath}\n` +
      'Ensure the file exists and is accessible by the application. ' +
      'In Docker: verify the volume mount is configured correctly.'
    )
  }

  return credentialsPath
}

/**
 * Load and parse Google Cloud credentials from the configured path.
 *
 * @throws {Error} If credentials file cannot be read or parsed
 * @returns {object} Parsed service account credentials
 */
export function loadGoogleCredentials(): Record<string, any> {
  const credentialsPath = getGoogleCredentialsPath()

  try {
    const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8')
    return JSON.parse(credentialsContent)
  } catch (error) {
    throw new Error(
      `[GCP] Failed to read or parse credentials file at ${credentialsPath}: ${error}`
    )
  }
}
