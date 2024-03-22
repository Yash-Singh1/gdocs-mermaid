export const match =
  /^(.*?)\s+(is\s+)?((connect|broke|break|multi(ple)?)(s|ed|ing|n)?)(\s*(2|tw?oo?|with))?\s+(.*?)$/;

export function manipulate(answer: RegExpExecArray): string {
  return `${answer[1]} ${answer[4]} ${answer[answer.length - 1]}`;
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
  if (
    matchPart.toLowerCase() === 'database' ||
    matchPart.toLowerCase() === 'databases'
  ) {
    matchPart = 'database[(database)]';
  }
  return matchPart;
}

export function cleanMatch(match: RegExpExecArray): RegExpExecArray {
  match[1] = cleanMatchPart(match[1]);
  switch (match[4]) {
    case 'connect':
      match[4] = '-->';
      break;
    case 'broke':
    case 'break':
      match[4] = '--x';
      break;
    case 'multi':
    case 'multiple':
      match[4] = '<-->';
      break;
  }
  match[match.length - 1] = cleanMatchPart(match[match.length - 1]);
  return match;
}
