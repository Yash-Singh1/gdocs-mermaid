function calculateIndexForPosition(
  lineNumber: number,
  columnNumber: number,
  lines: string[]
): number {
  console.log(lineNumber, columnNumber, lines);
  let number = 0;
  lines.slice(0, lineNumber - 1).forEach((line) => {
    number += line.length + 1;
  });
  number += columnNumber;
  return number;
}

export default calculateIndexForPosition;
