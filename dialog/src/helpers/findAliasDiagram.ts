import aliasDiagrams from '../data/aliasDiagrams';

export function findAliasDiagram(alias: string | null) {
  if (alias) {
    return aliasDiagrams[alias] || null;
  }
  return null;
}

export default findAliasDiagram;
