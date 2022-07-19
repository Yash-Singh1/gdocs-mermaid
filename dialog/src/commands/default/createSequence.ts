export const match =
  /((create|add|new|nu|start)(ed|ing)?|creating)?(an?|the)?(new|nu)?(sequence\s*(chart|diagram)\s*(diagram)?)\s*\.?$/i;

export function manipulate(): string {
  return 'sequenceDiagram';
}
