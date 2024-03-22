export function findDiagramType(lines: string[]): string | null {
  let inDirective = false;
  for (const line of lines) {
    if (inDirective) {
      if (line.trim().endsWith('%%')) {
        inDirective = false;
      }
    } else {
      if (line.trim().startsWith('%%{')) {
        inDirective = true;
        if (line.trim().endsWith('%%')) {
          inDirective = false;
        }
      } else if (line.trim().startsWith('%%')) {
        continue;
      } else if (line.trim().length === 0) {
        continue;
      } else {
        return /\S+/.exec(line)?.[0] || null;
      }
    }
  }
  return null;
}

export default findDiagramType;
