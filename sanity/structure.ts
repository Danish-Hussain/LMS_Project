// Minimal structure resolver for Sanity Studio. Use `any` here to avoid
// a circular type-alias issue during the Next.js typecheck in CI.
// If you want stricter typing, replace `any` with the appropriate Sanity
// types in the studio-only code path.
export const structure = (S: any) =>
  S.list()
    .title('Content')
    .items(S.documentTypeListItems())
