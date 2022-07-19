function calculateIndexForPosition(
  lineNumber: number,
  columnNumber: number,
  lines: string[]
): number {
  let number = 0;
  lines.slice(0, lineNumber - 1).forEach((line) => {
    number += line.length + 1;
  });
  if (lineNumber > lines.length) {
    number -= 2;
  }
  number += columnNumber;
  return number;
}

export default calculateIndexForPosition;
