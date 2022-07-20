export const match =
  /^(.*?)\s+(is\s+)?(connect|dash|broke|break)(n|e?s|t?ed|t?ing)?(\s*-?lio?ne?)?(\s*(tw?oo?|2))?\s+(.*?)\s*(fou?r|4)\s*(.*?)$/i;

export function manipulate(answer: RegExpExecArray): string {
  return `${answer[1]}${answer[3]}${answer[8]}: ${answer[answer.length - 1]}`;
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
  return matchPart;
}

export function cleanMatch(match: RegExpExecArray) {
  match[1] = cleanMatchPart(match[1]);
  match[7] = cleanMatchPart(match[8]);
  if (match[3] === 'connect') {
    match[3] = '->>';
  } else if (match[3] === 'dash') {
    match[3] = '-->>';
  } else if (match[3] === 'broke' || match[3] === 'break') {
    match[3] = '--x';
  }
  return match;
}
