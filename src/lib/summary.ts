import Anthropic from "@anthropic-ai/sdk";
import { formatMs } from "@/lib/time";

const HEARING_SUMMARY_SYSTEM_PROMPT = `Você é um assistente jurídico. Analise a transcrição desta audiência e produza um resumo estruturado em português, em texto simples (sem markdown), com as seguintes seções (pule uma seção se não houver conteúdo relevante pra ela):

RESUMO GERAL
Um resumo objetivo do que foi discutido na audiência.

CONFISSÕES
Qualquer admissão de culpa, responsabilidade ou fato prejudicial feita por alguma das partes.

CONTRADIÇÕES ENTRE TESTEMUNHAS
Depoimentos que se contradizem entre si ou com outras provas apresentadas.

DECISÕES DO JUIZ
Decisões, determinações ou encaminhamentos feitos pelo juiz durante a audiência.

Use os nomes/rótulos dos locutores exatamente como aparecem na transcrição ao citar falas.`;

type SummarySegment = {
  speakerLabel: string;
  startMs: number;
  text: string;
};

function buildTranscriptText(segments: SummarySegment[]): string {
  return segments.map((s) => `[${formatMs(s.startMs)}] ${s.speakerLabel}: ${s.text}`).join("\n");
}

export async function generateHearingSummary(segments: SummarySegment[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const transcriptText = buildTranscriptText(segments);

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: HEARING_SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: transcriptText }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude não retornou texto");
  }

  return textBlock.text;
}
