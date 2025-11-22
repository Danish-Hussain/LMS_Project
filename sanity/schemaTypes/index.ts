import { type SchemaTypeDefinition } from 'sanity'
import { postType } from './postType'
import { codeType } from './codeType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [postType, codeType],
}
