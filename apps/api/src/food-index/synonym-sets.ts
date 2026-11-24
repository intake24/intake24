export function parseSynonymSet(value: string): string[] {
  return (value.includes(';')
    ? value.split(';')
    : value.split(/\s+/))
    .map(entry => entry.trim())
    .filter(Boolean);
}
