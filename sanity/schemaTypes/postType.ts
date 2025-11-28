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
      // Provide a controlled list so editors can pick from predefined topics when creating/publishing
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'CPI', value: 'CPI' },
              { title: 'APIM', value: 'APIM' },
              { title: 'Event Mesh', value: 'Event Mesh' },
              { title: 'EDI', value: 'EDI' },
            ],
          },
        },
      ],
      options: {
        // Use 'tags' layout so selected topics appear as pills
        layout: 'tags',
      },
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        {
          type: 'block',
          // Enable additional rich text features
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Code', value: 'code' },
              // Removed underline to avoid any decorator validation hiccups
              // { title: 'Underline', value: 'underline' },
              // IMPORTANT: Sanity's canonical value for strikethrough is 'strike-through'
              // Using 'strike' triggers a Runtime SchemaError in Studio.
              { title: 'Strike', value: 'strike-through' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) => rule.uri({ allowRelative: true, scheme: ['http', 'https'] }),
                  },
                  {
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: true,
                  },
                ],
              },
            ],
          },
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
        },
          // allow editors to insert images inline in the body multiple times
          {
            type: 'image',
            title: 'Image',
            options: { hotspot: true },
            fields: [
              {
                name: 'alt',
                type: 'string',
                title: 'Alt text',
                description: 'Alternative text for screen readers (important for accessibility)',
                options: { isHighlighted: true },
              },
              {
                name: 'caption',
                type: 'string',
                title: 'Caption',
              },
            ],
          },
        {
          type: 'code',
          options: {
            // default language shown in the editor
            language: 'javascript',
            // present a list of selectable languages including XML and Groovy
            languageAlternatives: [
              { title: 'JavaScript', value: 'javascript' },
              { title: 'TypeScript', value: 'typescript' },
              { title: 'JSON', value: 'json' },
              { title: 'Bash', value: 'bash' },
              { title: 'Python', value: 'python' },
              { title: 'XML', value: 'xml' },
              { title: 'Groovy', value: 'groovy' },
              { title: 'Other', value: 'text' },
            ],
            // optional: let editors toggle a filename field if desired
            withFilename: false,
          },
        },
      ],
    }),
  ],
})