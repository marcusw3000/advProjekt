import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { formatMs } from "@/lib/time";
import type { ExportSegment } from "./types";

const CM_TO_TWIPS = 566.929;

export async function toDocx(segments: ExportSegment[], title: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: Math.round(3 * CM_TO_TWIPS),
              left: Math.round(3 * CM_TO_TWIPS),
              right: Math.round(2 * CM_TO_TWIPS),
              bottom: Math.round(2 * CM_TO_TWIPS),
            },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: title, font: "Times New Roman" })],
          }),
          ...segments.map(
            (s, index) =>
              new Paragraph({
                spacing: { after: 160 },
                children: [
                  new TextRun({
                    text: `${(index + 1).toString().padStart(4, "0")}  `,
                    bold: true,
                    font: "Times New Roman",
                    size: 24,
                  }),
                  new TextRun({
                    text: `[${formatMs(s.startMs)}] ${s.speakerLabel}: `,
                    bold: true,
                    font: "Times New Roman",
                    size: 24,
                  }),
                  new TextRun({ text: s.text, font: "Times New Roman", size: 24 }),
                ],
              })
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
