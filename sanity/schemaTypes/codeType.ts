import {defineField, defineType} from 'sanity'

// Custom code block type that works without @sanity/code-input plugin
export const codeType = defineType({
  name: 'code',
  title: 'Code',
  type: 'object',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'text',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          {title: 'JavaScript', value: 'javascript'},
          {title: 'TypeScript', value: 'typescript'},
          {title: 'JSON', value: 'json'},
          {title: 'Bash', value: 'bash'},
          {title: 'Python', value: 'python'},
          {title: 'XML', value: 'xml'},
          {title: 'Groovy', value: 'groovy'},
          {title: 'Other', value: 'text'},
        ],
      },
    }),
  ],
  preview: {
    select: {language: 'language', code: 'code'},
    prepare({language, code}) {
      const firstLine = (code || '').split('\n')[0]
      return {title: `Code (${language || 'text'})`, subtitle: firstLine}
    },
  },
})
