/// <reference types="vite/client" />



declare module '*?raw' {
  const content: string
  export default content
}

declare module '*.vsix' {
  const content: string;
  export default content;
}
