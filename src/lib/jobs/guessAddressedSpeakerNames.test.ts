import { describe, expect, it } from "vitest";
import { guessAddressedSpeakerNames } from "./guessAddressedSpeakerNames";

describe("guessAddressedSpeakerNames", () => {
  it("assigns name spoken at the start of the previous turn to the next speaker", () => {
    const result = guessAddressedSpeakerNames([
      { speaker: "Speaker A", text: "Leonardo Soares Severiano. Sim, boa tarde, Leonardo, tudo bom?" },
      { speaker: "Speaker B", text: "Boa tarde, tudo joia." },
    ]);
    expect(result).toEqual({ "Speaker B": "Leonardo Soares Severiano" });
  });

  it("assigns title + name mentioned mid-turn to the next speaker", () => {
    const result = guessAddressedSpeakerNames([
      { speaker: "Speaker A", text: "Doutor Pedro, boa tarde novamente." },
      { speaker: "Speaker D", text: "Boa tarde, excelente." },
    ]);
    expect(result).toEqual({ "Speaker D": "Doutor Pedro" });
  });

  it("assigns vocative name before a greeting question", () => {
    const result = guessAddressedSpeakerNames([
      { speaker: "Speaker A", text: "Doutor Alexandre, tudo ok?" },
      { speaker: "Speaker F", text: "Boa tarde, tudo bem, Excelência?" },
    ]);
    expect(result).toEqual({ "Speaker F": "Doutor Alexandre" });
  });

  it("does not assign when the same speaker continues", () => {
    const result = guessAddressedSpeakerNames([
      { speaker: "Speaker A", text: "Leonardo Soares Severiano. Boa tarde." },
      { speaker: "Speaker A", text: "Vamos continuar." },
    ]);
    expect(result).toEqual({});
  });

  it("does not misattribute a name mentioned inside a long speech", () => {
    const longSpeech =
      "Pela vítima, perfeito. Jean Soares de Oliveira. Boa tarde, Jean, tudo bem? " +
      "Jean, seu nome figura nesse processo na condição de vítima e nesta condição será ouvido, " +
      "tá certo? Estão participando desse ato, além de mim, juiz da 1ª Vara Criminal, Doutor Pedro, " +
      "à disposição.";
    const result = guessAddressedSpeakerNames([
      { speaker: "Speaker A", text: longSpeech },
      { speaker: "Speaker D", text: "Obrigado, Excelência." },
    ]);
    expect(result).toEqual({});
  });

  it("keeps the first assignment per speaker", () => {
    const result = guessAddressedSpeakerNames([
      { speaker: "Speaker A", text: "Doutor Pedro, boa tarde." },
      { speaker: "Speaker D", text: "Boa tarde." },
      { speaker: "Speaker A", text: "Doutor Outro, alguma questão?" },
      { speaker: "Speaker D", text: "Sem mais." },
    ]);
    expect(result).toEqual({ "Speaker D": "Doutor Pedro" });
  });

  it("does not attribute a name to a speaker who has already spoken before (not their first turn)", () => {
    const result = guessAddressedSpeakerNames([
      { speaker: "Speaker A", text: "Abrindo a sessão." },
      { speaker: "Speaker D", text: "Boa tarde." },
      { speaker: "Speaker F", text: "Doutor Danilo, à vontade, qualquer coisa manda mensagem." },
      { speaker: "Speaker A", text: "Tudo bem, vamos continuar." },
    ]);
    expect(result).toEqual({});
  });
});
