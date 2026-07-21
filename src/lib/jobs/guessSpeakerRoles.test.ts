import { describe, expect, it } from "vitest";
import { guessSpeakerRoles } from "./guessSpeakerRoles";

describe("guessSpeakerRoles", () => {
  it("identifies the judge opening the hearing", () => {
    const result = guessSpeakerRoles([
      {
        speaker: "Speaker A",
        text: "Leonardo e Rafael, nós vamos dar início à audiência de instrução no processo em que os senhores...",
      },
    ]);
    expect(result).toEqual({ "Speaker A": "Juiz" });
  });

  it("identifies the judge from a self-reference to their court", () => {
    const result = guessSpeakerRoles([
      {
        speaker: "Speaker A",
        text: "Estão participando desse ato, além de mim, juiz da 1ª Vara Criminal, Doutor Pedro, à disposição.",
      },
    ]);
    expect(result).toEqual({ "Speaker A": "Juiz" });
  });

  it("assigns Vítima to the next speaker when introduced as such", () => {
    const result = guessSpeakerRoles([
      {
        speaker: "Speaker A",
        text: "Jean, seu nome figura nesse processo na condição de vítima e nesta condição será ouvido, tá certo?",
      },
      { speaker: "Speaker C", text: "Sim, senhor." },
    ]);
    expect(result).toEqual({ "Speaker C": "Vítima" });
  });

  it("assigns Vítima from 'pela vítima'", () => {
    const result = guessSpeakerRoles([
      { speaker: "Speaker A", text: "Pela vítima, perfeito. Jean Soares de Oliveira." },
      { speaker: "Speaker C", text: "Boa tarde." },
    ]);
    expect(result).toEqual({ "Speaker C": "Vítima" });
  });

  it("assigns Promotor when introduced as Ministério Público representative", () => {
    const result = guessSpeakerRoles([
      {
        speaker: "Speaker A",
        text: "Doutor Pedro, representante do Ministério Público, pode iniciar a inquirição.",
      },
      { speaker: "Speaker D", text: "Obrigado, Excelência." },
    ]);
    expect(result).toEqual({ "Speaker D": "Promotor" });
  });

  it("self-priority overrides an addressed guess for the same speaker", () => {
    const result = guessSpeakerRoles([
      { speaker: "Speaker A", text: "na condição de réu, o senhor Leonardo." },
      { speaker: "Speaker B", text: "Sou promotor de justiça, boa tarde a todos." },
    ]);
    expect(result).toEqual({ "Speaker B": "Promotor" });
  });

  it("keeps first assignment per speaker and does not overwrite", () => {
    const result = guessSpeakerRoles([
      { speaker: "Speaker A", text: "Pela vítima, perfeito." },
      { speaker: "Speaker C", text: "Boa tarde." },
      { speaker: "Speaker A", text: "na condição de réu, vamos prosseguir." },
      { speaker: "Speaker C", text: "Sem mais perguntas." },
    ]);
    expect(result).toEqual({ "Speaker C": "Vítima" });
  });

  it("returns empty object when no role cue is found", () => {
    const result = guessSpeakerRoles([{ speaker: "Speaker A", text: "Boa tarde a todos." }]);
    expect(result).toEqual({});
  });

  it("does not assign a role when the same speaker continues talking", () => {
    const result = guessSpeakerRoles([
      { speaker: "Speaker A", text: "Pela vítima, perfeito." },
      { speaker: "Speaker A", text: "Vamos seguir." },
    ]);
    expect(result).toEqual({});
  });
});
