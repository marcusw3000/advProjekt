import PDFDocument from "pdfkit";
import { formatMs } from "@/lib/time";
import type { ExportSegment } from "./types";

const CM_TO_PT = 28.3465;

export async function toPdf(segments: ExportSegment[], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margins: {
        top: Math.round(3 * CM_TO_PT),
        left: Math.round(3 * CM_TO_PT),
        right: Math.round(2 * CM_TO_PT),
        bottom: Math.round(2 * CM_TO_PT),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Times-Roman").fontSize(16).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(12);

    segments.forEach((s, index) => {
      const prefix = `${(index + 1).toString().padStart(4, "0")}  [${formatMs(s.startMs)}] ${s.speakerLabel}: `;
      doc.font("Times-Bold").text(prefix, { continued: true });
      doc.font("Times-Roman").text(s.text);
      doc.moveDown(0.5);
    });

    doc.end();
  });
}
