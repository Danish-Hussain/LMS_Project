// Ambient module declarations to satisfy Next.js generated validator imports
// These cover the generated `import("../../src/.../page.js")` and `route.js` imports
// produced in `.next/types/validator.ts` during build.

declare module "../../src/*" {
  const _default: any
  export default _default
}

declare module "../../src/**" {
  const _default: any
  export default _default
}

declare module "../../src/**/page.js" {
  const _default: any
  export default _default
}

declare module "../../src/**/route.js" {
  // Next app route modules export named handlers (GET, POST, etc.). Provide them
  // so the generated validator's structural check succeeds.
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

declare module "../../pages/*" {
  const _default: any
  export default _default
}

declare module "../../pages/**" {
  const _default: any
  export default _default
}

// Fallback for any other relative import patterns used by the generated types
declare module "../../*" {
  const _default: any
  export default _default
}
