import {defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'topics',
      title: 'Topics',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        // Sanity array layouts support: 'tags' | 'grid' | 'list'. 'checkbox' is invalid.
        // Use 'tags' to allow multiple selection with a tag-style UI.
        layout: 'tags',
        list: [
          { title: 'CPI', value: 'CPI' },
          { title: 'APIM', value: 'APIM' },
          { title: 'Event Mesh', value: 'Event Mesh' },
          { title: 'EDI', value: 'EDI' },
        ],
      },
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
})