declare module "*?source" {
  const text: string;
  export default text;
}

declare module "*.png" {
  const url: string;
  export default url;
}
declare module "*data-program.json" {
  const program: unknown;
  export default program;
}
