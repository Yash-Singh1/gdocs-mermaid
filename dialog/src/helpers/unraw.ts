export default function unraw(str: string) {
  return str.replace(
    /\\[0-9]|\\['"\bfnrtv]|\\x[0-9a-f]{2}|\\u[0-9a-f]{4}|\\u\{[0-9a-f]+\}|\\./gi,
    (match) => {
      switch (match[1]) {
        case "'":
        case '"':
        case '\\':
          return match[1];
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'v':
          return '\v';
        case 'u':
          if (match[2] === '{') {
            return String.fromCodePoint(parseInt(match.substring(3), 16));
          }
          return String.fromCharCode(parseInt(match.substring(2), 16));
        case 'x':
          return String.fromCharCode(parseInt(match.substring(2), 16));
        case '0':
          return '\0';
        default:
          // E.g., "\q" === "q"
          return match.substring(1);
      }
    }
  );
}
