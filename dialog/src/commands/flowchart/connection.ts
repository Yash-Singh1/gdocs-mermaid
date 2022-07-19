export const match = /^(.*?)\s+(is\s+)?connect(s|ed|ing)?(\s+to)?\s+(.*?)$/;

export function manipulate(answer: RegExpExecArray): string {
  return `${answer[1]} --> ${answer[answer.length - 1]}`;
}

function cleanMatchPart(matchPart: string): string {
  matchPart = matchPart.trim();
  let articleFound: string | undefined;
  if (
    (articleFound = ['an', 'the', 'a', 'my', 'our'].find((article) =>
      matchPart.toLowerCase().startsWith(article + ' ')
    ))
  ) {
    matchPart = matchPart.slice(articleFound.length + 1);
  }
  matchPart = matchPart.trim();
  if (matchPart.toLowerCase() === 'database' || matchPart.toLowerCase() === 'databases') {
    matchPart = 'database[(database)]';
  }
  return matchPart;
}

export function cleanMatch(match: RegExpExecArray): RegExpExecArray {
  match[1] = cleanMatchPart(match[1]);
  match[match.length - 1] = cleanMatchPart(match[match.length - 1]);
  return match;
}
