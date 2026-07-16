const NAME_PATTERNS = [
  /\b(?:[Mm]eu nome é|[Mm]e chamo|[Ee]u sou[ao]?|[Aa]qui (?:é|quem fala é)|[Ff]alando aqui é)\s+(?:\b(?:a|o)\b\s+)?([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+){0,2})/,
  /\b(?:[Mm]y name is|[Tt]his is|[Ii]'?m)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
];

function extractName(text: string): string | null {
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/[.,!?]+$/, "");
    }
  }
  return null;
}

export function guessSpeakerNames(
  utterances: { speaker: string; text: string }[]
): Record<string, string> {
  const guesses: Record<string, string> = {};

  for (const utterance of utterances) {
    if (guesses[utterance.speaker]) continue;

    const name = extractName(utterance.text);
    if (name) guesses[utterance.speaker] = name;
  }

  return guesses;
}
