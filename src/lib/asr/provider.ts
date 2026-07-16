export type AsrUtterance = {
  speaker: string;
  startMs: number;
  endMs: number;
  text: string;
};

export type AsrTranscriptResult = {
  status: "completed" | "error" | "processing" | "queued";
  utterances: AsrUtterance[];
  error?: string;
};

export interface AsrProvider {
  submitTranscription(params: {
    audioUrl: string;
    webhookUrl: string;
  }): Promise<{ asrJobId: string }>;

  getTranscript(asrJobId: string): Promise<AsrTranscriptResult>;
}
