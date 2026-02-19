export function getSplitSuggestions(description: string, splitWords: string[]): { suggestions: string[]; force: boolean } {
  if (!splitWords.length)
    return { suggestions: [description], force: false };

  const suggestionTokens: string[] = [];
  const forceTokens: string[] = [];

  for (const item of splitWords) {
    if (item.match(/^!\w+:\w+!$/)) {
      forceTokens.push(
        item
          .replace(/!/g, '')
          .split(':')
          .sort((a, b) => a.localeCompare(b))
          .join(':')
          .toLowerCase(),
      );
      continue;
    }
    suggestionTokens.push(item.replace(/!_!/g, ' ').toLowerCase());
  }

  const suggestions = description
    .split(new RegExp(`(?:${suggestionTokens.join('|')})`, 'i'))
    .map(item => item.trim());

  const forceCheck = [...suggestions].sort((a, b) => a.localeCompare(b)).join(':').toLowerCase();
  const force = forceTokens.includes(forceCheck);

  return { suggestions, force };
}
