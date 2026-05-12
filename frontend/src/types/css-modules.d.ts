/* Ambient module declaration so TypeScript accepts the
   `import s from './X.module.css'` form Vite uses for CSS modules. */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}
