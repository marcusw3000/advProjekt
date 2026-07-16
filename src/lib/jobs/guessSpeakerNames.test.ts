import { describe, expect, it } from "vitest";
import { guessSpeakerNames } from "./guessSpeakerNames";

describe("guessSpeakerNames", () => {
  it("extracts name from 'meu nome é'", () => {
    const result = guessSpeakerNames([
      { speaker: "Speaker A", text: "Oi, meu nome é João Silva, tudo bem?" },
    ]);
    expect(result).toEqual({ "Speaker A": "João Silva" });
  });

  it("extracts name from 'aqui é'", () => {
    const result = guessSpeakerNames([{ speaker: "Speaker B", text: "Aqui é a Maria, bom dia." }]);
    expect(result).toEqual({ "Speaker B": "Maria" });
  });

  it("extracts name from english 'my name is'", () => {
    const result = guessSpeakerNames([{ speaker: "Speaker A", text: "Hi, my name is John Smith." }]);
    expect(result).toEqual({ "Speaker A": "John Smith" });
  });

  it("keeps first match per speaker across multiple utterances", () => {
    const result = guessSpeakerNames([
      { speaker: "Speaker A", text: "Meu nome é Ana." },
      { speaker: "Speaker A", text: "Meu nome é Outra Pessoa." },
    ]);
    expect(result).toEqual({ "Speaker A": "Ana" });
  });

  it("returns empty object when no introduction is found", () => {
    const result = guessSpeakerNames([{ speaker: "Speaker A", text: "Vamos começar a reunião." }]);
    expect(result).toEqual({});
  });

  it("does not confuse speakers with each other", () => {
    const result = guessSpeakerNames([
      { speaker: "Speaker A", text: "Meu nome é Carlos." },
      { speaker: "Speaker B", text: "E eu sou Beatriz." },
    ]);
    expect(result).toEqual({ "Speaker A": "Carlos", "Speaker B": "Beatriz" });
  });

  it("does not match a lowercase word after 'aqui é' as a name", () => {
    const result = guessSpeakerNames([
      { speaker: "Speaker A", text: "Essa assinatura aqui é sua?" },
    ]);
    expect(result).toEqual({});
  });

  it("does not match lowercase words after 'eu sou' as a name", () => {
    const result = guessSpeakerNames([
      { speaker: "Speaker A", text: "Eu arredei assim, que eu sou muito amigo dela." },
    ]);
    expect(result).toEqual({});
  });
});
