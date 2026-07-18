import type { AsrProvider, AsrTranscriptResult } from "./provider";

const API_BASE = "https://api.assemblyai.com/v2";

function apiKey() {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) throw new Error("ASSEMBLYAI_API_KEY is not set");
  return key;
}

type AssemblyAiUtterance = {
  speaker: string;
  start: number;
  end: number;
  text: string;
};

type AssemblyAiTranscript = {
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  utterances?: AssemblyAiUtterance[];
  audio_duration?: number;
};

export const assemblyAiProvider: AsrProvider = {
  async submitTranscription({ audioUrl, webhookUrl }) {
    const res = await fetch(`${API_BASE}/transcript`, {
      method: "POST",
      headers: {
        Authorization: apiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        speaker_labels: true,
        webhook_url: webhookUrl,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AssemblyAI submit failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { id: string };
    return { asrJobId: data.id };
  },

  async getTranscript(asrJobId): Promise<AsrTranscriptResult> {
    const res = await fetch(`${API_BASE}/transcript/${asrJobId}`, {
      headers: { Authorization: apiKey() },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AssemblyAI fetch failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as AssemblyAiTranscript;

    return {
      status: data.status,
      error: data.error,
      durationSeconds: data.audio_duration,
      utterances: (data.utterances ?? []).map((u) => ({
        speaker: `Speaker ${u.speaker}`,
        startMs: u.start,
        endMs: u.end,
        text: u.text,
      })),
    };
  },
};
