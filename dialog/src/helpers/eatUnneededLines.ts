function unneededLine(line: string) {
  if (
    !line.trim() ||
    line.startsWith('//') ||
    line.startsWith('%%') ||
    [
      'flowchart',
      'flowchart-v2',
      'graph',
      'sequenceDiagram',
      'classDiagram',
      'classDiagram-v2',
      'stateDiagram',
      'stateDiagram-v2',
      'erDiagram',
      'journey',
      'info',
      'gantt',
      'requirement',
      'requirementDiagram',
      'gitGraph',
      'pie',
      'C4Context',
      'C4Container',
      'C4Component',
      'C4Dynamic',
      'C4Deployment',
      'linkStyle',
      'style',
      'classDef',
      'class',
    ].includes(line.trim().match(/^\S+/)![0])
  ) {
    return true;
  }
  return false;
}

function eatUnneededLines(
  lines: string[],
  start: number,
  breakpoints: number[]
) {
  while (
    start < lines.length &&
    (breakpoints.includes(start) || unneededLine(lines[start - 1]))
  ) {
    start++;
  }
  return Math.min(start, lines.length);
}

export default eatUnneededLines;
