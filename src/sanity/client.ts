import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '../../sanity/env'

export const client = createClient({
  projectId: projectId!,
  dataset: dataset!,
  apiVersion,
  useCdn: false,
})