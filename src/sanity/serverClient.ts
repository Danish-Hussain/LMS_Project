import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '../../sanity/env'

export function getServerClient(token?: string) {
  if (!token) {
    return createClient({ projectId: projectId!, dataset: dataset!, apiVersion, useCdn: false })
  }
  return createClient({ projectId: projectId!, dataset: dataset!, apiVersion, useCdn: false, token })
}

export default getServerClient
