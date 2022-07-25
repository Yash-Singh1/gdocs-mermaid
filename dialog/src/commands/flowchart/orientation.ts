export const match =
  /(top|right|write|left|bottom|down)\s*-?(-|2|tw?o?)-?\s*(top|right|write|left|bottom|down)/i;

export function manipulate(
  answer: RegExpExecArray,
  context: string
): string | { replace: boolean; text: string } {
  if (context.includes('subGraph')) {
    return `direction ${answer[1]}${answer[3]}`;
  } else {
    return {
      text: `${context.trim()} ${answer[1]}${answer[3]}`,
      replace: true,
    };
  }
}

function cleanMatchPart(matchPart: string): string {
  matchPart = matchPart.trim().toLowerCase();
  switch (matchPart) {
    case 'top':
      return 'T';
    case 'right':
    case 'write':
      return 'R';
    case 'left':
      return 'L';
    case 'bottom':
      return 'B';
    case 'down':
      return 'D';
    default:
      return matchPart;
  }
}

export function cleanMatch(match: RegExpExecArray) {
  match[1] = cleanMatchPart(match[1]);
  match[3] = cleanMatchPart(match[3]);
  return match;
}
