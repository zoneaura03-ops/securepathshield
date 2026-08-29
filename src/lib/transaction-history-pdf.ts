import PDFDocument from "pdfkit";

type HistoryEntry = {
  reference: string;
  rail: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

export async function buildTransactionHistoryPdf({
  customerName,
  currency,
  entries,
}: {
  customerName: string;
  currency: string;
  entries: HistoryEntry[];
}) {
  const doc = new PDFDocument({ size: "LETTER", margin: 42 });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc
    .save()
    .opacity(0.045)
    .fontSize(64)
    .fillColor("#10233f")
    .rotate(-32, { origin: [306, 396] })
    .text("SECUREPATH BANK", 95, 350, { width: 430, align: "center" })
    .restore();
  doc
    .fillColor("#10233f")
    .fontSize(12)
    .text("SECUREPATH BANK", { characterSpacing: 3 });
  doc
    .fillColor("#111827")
    .fontSize(24)
    .text("Transaction history", { characterSpacing: 0 });
  doc
    .moveDown(0.3)
    .fillColor("#667085")
    .fontSize(10)
    .text(`${customerName} • Generated ${new Date().toLocaleString("en-GB")}`);
  doc.moveDown(1.2);
  for (const entry of entries) {
    if (doc.y > 710) doc.addPage();
    const direction = entry.type === "debit" ? "Debit" : "Credit";
    doc
      .fillColor("#111827")
      .fontSize(10)
      .text(
        `${direction} • ${entry.rail.replaceAll("_", " ")} • ${entry.status}`,
        { continued: true },
      );
    doc
      .fillColor(entry.type === "debit" ? "#a12a2a" : "#10233f")
      .text(
        `  ${direction === "Debit" ? "-" : "+"}${entry.amount.toFixed(2)} ${currency}`,
        { align: "right" },
      );
    doc
      .fillColor("#667085")
      .fontSize(8)
      .text(
        `${new Date(entry.createdAt).toLocaleString("en-GB")} • ${entry.reference}`,
      );
    doc
      .moveDown(0.7)
      .strokeColor("#dfe5ef")
      .moveTo(42, doc.y)
      .lineTo(570, doc.y)
      .stroke()
      .moveDown(0.7);
  }
  doc.end();
  return completed;
}
