import imageUrlBuilder from '@sanity/image-url'
import { client } from './client'

const builder = imageUrlBuilder(client as any)

export default function urlFor(source: any) {
  return builder.image(source)
}
