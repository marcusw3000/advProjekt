const MAX_ADDRESS_UTTERANCE_LENGTH = 400;

// Role declared by the speaker about themself (e.g. the judge opening the hearing).
const SELF_ROLE_PATTERNS: { role: string; pattern: RegExp }[] = [
  { role: "Juiz", pattern: /\bju[ií]z(?:a)?\s+d[ae]\s+\d/i },
  { role: "Juiz", pattern: /\bvamos dar in[ií]cio [àa] audi[êe]ncia\b/i },
  { role: "Juiz", pattern: /\babro a (?:presente )?audi[êe]ncia\b/i },
  { role: "Promotor", pattern: /\bsou\s+(?:o\s+|a\s+)?promotor(?:a)?\s+de\s+justi[çc]a\b/i },
  { role: "Defensor", pattern: /\bsou\s+(?:o\s+|a\s+)?(?:defensor|advogad[oa])\b/i },
];

// Role attributed to the NEXT speaker, extracted from the current utterance
// (e.g. the judge introducing a witness/victim before they speak).
const ADDRESSED_ROLE_PATTERNS: { role: string; pattern: RegExp }[] = [
  { role: "Vítima", pattern: /\bna condi[çc][ãa]o de v[íi]tima\b/i },
  { role: "Vítima", pattern: /\bpela v[íi]tima\b/i },
  { role: "Réu", pattern: /\bna condi[çc][ãa]o de r[ée]u\b/i },
  { role: "Testemunha", pattern: /\b(?:na qualidade de|como) testemunha\b/i },
  { role: "Promotor", pattern: /\brepresentante do Minist[ée]rio P[úu]blico\b/i },
  { role: "Defensor", pattern: /\bpela defesa\b/i },
];

function extractRole(
  text: string,
  patterns: { role: string; pattern: RegExp }[]
): string | null {
  if (text.length > MAX_ADDRESS_UTTERANCE_LENGTH) return null;

  for (const { role, pattern } of patterns) {
    if (pattern.test(text)) return role;
  }
  return null;
}

export function guessSelfSpeakerRoles(
  utterances: { speaker: string; text: string }[]
): Record<string, string> {
  const guesses: Record<string, string> = {};

  for (const utterance of utterances) {
    if (guesses[utterance.speaker]) continue;

    const role = extractRole(utterance.text, SELF_ROLE_PATTERNS);
    if (role) guesses[utterance.speaker] = role;
  }

  return guesses;
}

export function guessAddressedSpeakerRoles(
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

    const role = extractRole(current.text, ADDRESSED_ROLE_PATTERNS);
    if (role) guesses[next.speaker] = role;
  }

  return guesses;
}

export function guessSpeakerRoles(
  utterances: { speaker: string; text: string }[]
): Record<string, string> {
  return {
    ...guessAddressedSpeakerRoles(utterances),
    ...guessSelfSpeakerRoles(utterances),
  };
}
