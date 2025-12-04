import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from './env'

export function getServerClient(token?: string) {
  if (!token) {
    // create a read-only client (no token) if token not supplied
    return createClient({ projectId: projectId!, dataset: dataset!, apiVersion, useCdn: false })
  }
  return createClient({ projectId: projectId!, dataset: dataset!, apiVersion, useCdn: false, token })
}
