export const match =
  /(((create|add|new|nu|start|make?)(ed|ing)?|creating)?(an?|the)?(new|nu)?|(wh?[ua]t\s*i[sz](\s*(an?|the))?(\s*current)?(\s*version)))((version|info)\s*(chart|diagram)?\s*(diagram)?)\s*\.?$/i;

export function manipulate(): string {
  return 'info';
}
