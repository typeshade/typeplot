import Prism from "prismjs";
import "prismjs/components/prism-typescript";
export function highlight(code: string): string {
  return Prism.highlight(code, Prism.languages.typescript, "typescript");
}
