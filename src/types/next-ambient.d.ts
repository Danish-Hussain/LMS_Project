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
