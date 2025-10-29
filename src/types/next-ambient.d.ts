// Ambient module declarations to satisfy Next.js generated validator imports.
// Keep these focused so broad patterns don't shadow the more specific route/page
// declarations used by the generated `.next/types/validator.ts` checks.

// Specific page stubs used by the App Router validator
declare module "../../src/**/page.js" {
  // App pages export a default React component (and optional config). Keep
  // loose `any` typing but provide a default export so the validator can read
  // structural properties when present.
  const _default: any
  export default _default
}

// Specific app route stubs — export named handlers commonly present in route
// modules. These must exist so the generated validator's RouteHandlerConfig
// structural checks can succeed.
declare module "../../src/**/route.js" {
  export const GET: any
  export const POST: any
  export const PUT: any
  export const PATCH: any
  export const DELETE: any
  export const HEAD: any
  export const OPTIONS: any
  const _default: any
  export default _default
}
// Also cover validator imports that reference the top-level `app/` folder
// (some Next builds reference `../../app/...` instead of `../../src/app/...`).
declare module "../../app/**/page.js" {
  const _default: any
  export default _default
}

declare module "../../app/**/route.js" {
  export const GET: any
  export const POST: any
  export const PUT: any
  export const PATCH: any
  export const DELETE: any
  export const HEAD: any
  export const OPTIONS: any
  const _default: any
  export default _default
}

// Page-level (pages/) stubs used by any legacy pages referenced by validator
declare module "../../pages/*" {
  const _default: any
  export default _default
}

// Minimal fallback for other relative pages under pages/ hierarchy
declare module "../../pages/**" {
  const _default: any
  export default _default
}

// NOTE: intentionally avoiding very broad patterns like `"../../src/*"` or
// `"../../*"` here because they can match the same import paths as the
// specific `route.js` pattern and cause the type-checker to see a different
// (incomplete) module shape. If CI still shows missing paths, prefer adding a
// targeted per-file `.js.d.ts` stub (the project already includes a generator
// script: `scripts/generate-js-dts.js`).
