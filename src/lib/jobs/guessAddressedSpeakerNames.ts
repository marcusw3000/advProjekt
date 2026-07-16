const MAX_ADDRESS_UTTERANCE_LENGTH = 100;

const ADDRESS_PATTERNS = [
  // "Leonardo Soares Severiano. Sim, boa tarde..." — name stands alone at the very start
  /^([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+){0,2})\.\s/,
  // "Doutor Pedro, boa tarde" / "Doutor Danilo, tudo bem?" — title + name anywhere
  /\b((?:Doutor|Doutora|Dr\.?|Dra\.?|Senhor|Senhora|Sr\.?|Sra\.?)\s+[A-ZÀ-Ý][a-zà-ÿ]+)\b/,
  // ", Leonardo, tudo bom?" — vocative right before a greeting question
  /,\s*([A-ZÀ-Ý][a-zà-ÿ]+),?\s+[Tt]udo\s+(?:bem|bom|ok|joia)/,
];

function extractAddressedName(text: string): string | null {
  if (text.length > MAX_ADDRESS_UTTERANCE_LENGTH) return null;

  for (const pattern of ADDRESS_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export function guessAddressedSpeakerNames(
  utterances: { speaker: string; text: string }[]
): Record<string, string> {
  const guesses: Record<string, string> = {};
  const seenSpeakers = new Set<string>();
  if (utterances.length > 0) seenSpeakers.add(utterances[0].speaker);

  for (let i = 0; i < utterances.length - 1; i++) {
    const current = utterances[i];
    const next = utterances[i + 1];
    const isNextSpeakersFirstAppearance = !seenSpeakers.has(next.speaker);
    seenSpeakers.add(next.speaker);

    if (current.speaker === next.speaker) continue;
    if (!isNextSpeakersFirstAppearance) continue;
    if (guesses[next.speaker]) continue;

    const name = extractAddressedName(current.text);
    if (name) guesses[next.speaker] = name;
  }

  return guesses;
}
