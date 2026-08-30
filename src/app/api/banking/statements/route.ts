import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { bank } from "../../../../lib/config";
import { db, type DatabaseRow } from "../../../../lib/db";

const PRIMARY = "#0a1728";
const DARK = "#111827";
const MUTED = "#667085";
const LINE = "#dfe5ef";
const PAGE_WIDTH = 612;
const MARGIN = 45;

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (
    !from ||
    !to ||
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    from > to
  )
    return NextResponse.json(
      { error: "Choose a valid start and end date." },
      { status: 400 },
    );

  const [accountResult, transactionResult] = await Promise.all([
    db.execute<DatabaseRow[]>(
      "SELECT account_number,name,type,currency,available_balance FROM accounts WHERE user_id=? AND status<>'closed' ORDER BY id LIMIT 1",
      [user.id],
    ),
    db.execute<DatabaseRow[]>(
      "SELECT created_at,reference,description,type,currency,amount,status,balance_after FROM transactions WHERE user_id=? AND created_at>=? AND created_at<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY created_at",
      [user.id, from, to],
    ),
  ]);
  const [accounts] = accountResult;
  const [transactions] = transactionResult;
  const account = accounts[0];
  if (!account)
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const calculatedTransactions = calculateRunningBalances(transactions);

  const pdf = await buildStatement({
    customerName: `${user.firstName} ${user.lastName}`,
    account,
    transactions: calculatedTransactions,
    from,
    to,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="securepathbank-statement-${from}-to-${to}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}

async function buildStatement({
  customerName,
  account,
  transactions,
  from,
  to,
}: {
  customerName: string;
  account: DatabaseRow;
  transactions: DatabaseRow[];
  from: string;
  to: string;
}) {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 42, right: MARGIN, bottom: 52, left: MARGIN },
    bufferPages: true,
    info: {
      Title: `${bank.name} account statement`,
      Author: bank.fullName,
      Subject: `Account statement from ${from} to ${to}`,
    },
  });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawBrandHeader(doc);
  doc
    .fillColor(DARK)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("Account statement", MARGIN, 130);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text(`Statement period: ${displayDate(from)} - ${displayDate(to)}`, MARGIN, 160);

  drawAccountSummary(doc, customerName, account, from, to);

  const credits = transactions.reduce(
    (sum, row) => sum + (row.type === "credit" ? Number(row.amount) : 0),
    0,
  );
  const debits = transactions.reduce(
    (sum, row) => sum + (row.type === "debit" ? Number(row.amount) : 0),
    0,
  );
  drawTotals(doc, account.currency, transactions.length, credits, debits);

  let y = 337;
  y = drawTableHeader(doc, y);
  if (!transactions.length) {
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text("No transactions were recorded during this statement period.", MARGIN, y + 18, {
        width: PAGE_WIDTH - MARGIN * 2,
        align: "center",
      });
  } else {
    for (const transaction of transactions) {
      if (y > 700) {
        doc.addPage();
        drawCompactHeader(doc, from, to);
        y = drawTableHeader(doc, 92);
      }
      y = drawTransactionRow(doc, transaction, y);
    }
  }

  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .moveTo(MARGIN, 744)
      .lineTo(PAGE_WIDTH - MARGIN, 744)
      .strokeColor(LINE)
      .lineWidth(0.6)
      .stroke();
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(`${bank.fullName} | ${bank.supportEmail}`, MARGIN, 754, { width: 350 })
      .text(`Page ${index + 1} of ${range.count}`, PAGE_WIDTH - MARGIN - 100, 754, {
        width: 100,
        align: "right",
      });
  }

  doc.end();
  return completed;
}

function drawBrandHeader(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, PAGE_WIDTH, 104).fill(PRIMARY);
  drawShield(doc, MARGIN, 30, "#ffffff");
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(bank.name.toUpperCase(), MARGIN + 34, 31, { characterSpacing: 2.2 });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#dbeafe")
    .text("SECURE DIGITAL BANKING", MARGIN + 34, 54, { characterSpacing: 1.2 });
  doc
    .fontSize(8)
    .fillColor("#ffffff")
    .text("OFFICIAL ACCOUNT DOCUMENT", PAGE_WIDTH - MARGIN - 180, 41, {
      width: 180,
      align: "right",
    });
}

function drawCompactHeader(doc: PDFKit.PDFDocument, from: string, to: string) {
  drawShield(doc, MARGIN, 34, PRIMARY);
  doc
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(bank.name.toUpperCase(), MARGIN + 29, 36, { characterSpacing: 1.5 });
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text(`${displayDate(from)} - ${displayDate(to)}`, PAGE_WIDTH - MARGIN - 160, 38, {
      width: 160,
      align: "right",
    });
  doc.moveTo(MARGIN, 67).lineTo(PAGE_WIDTH - MARGIN, 67).strokeColor(LINE).stroke();
}

function drawShield(doc: PDFKit.PDFDocument, x: number, y: number, color: string) {
  doc.save().translate(x, y);
  doc
    .path("M12 0 L23 4 L23 14 C23 22 18 28 12 31 C6 28 1 22 1 14 L1 4 Z")
    .lineWidth(2.2)
    .strokeColor(color)
    .stroke();
  doc.path("M7 14 L10.5 17.5 L17.5 10").lineWidth(2.2).strokeColor(color).stroke();
  doc.restore();
}

function drawAccountSummary(
  doc: PDFKit.PDFDocument,
  customerName: string,
  account: DatabaseRow,
  from: string,
  to: string,
) {
  doc.roundedRect(MARGIN, 187, PAGE_WIDTH - MARGIN * 2, 83, 7).fill("#f7f9fc");
  const entries = [
    ["ACCOUNT HOLDER", customerName],
    ["ACCOUNT NUMBER", String(account.account_number)],
    ["ACCOUNT TYPE", String(account.type || account.name)],
    ["STATEMENT PERIOD", `${displayDate(from)} - ${displayDate(to)}`],
  ];
  entries.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + 18 + column * 256;
    const y = 201 + row * 34;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7).text(label, x, y);
    doc.fillColor(DARK).font("Helvetica").fontSize(9).text(clean(value), x, y + 11, { width: 225 });
  });
}

function drawTotals(
  doc: PDFKit.PDFDocument,
  currency: string,
  count: number,
  credits: number,
  debits: number,
) {
  const items = [
    ["TRANSACTIONS", String(count)],
    ["TOTAL CREDITS", formatAmount(credits, currency)],
    ["TOTAL DEBITS", formatAmount(debits, currency)],
  ];
  items.forEach(([label, value], index) => {
    const x = MARGIN + index * 174;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7).text(label, x, 287);
    doc.fillColor(index === 1 ? PRIMARY : DARK).font("Helvetica-Bold").fontSize(11).text(value, x, 301, {
      width: 160,
    });
  });
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  doc.rect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 24).fill(PRIMARY);
  const headers = [
    ["DATE", MARGIN + 7, 61],
    ["REFERENCE", MARGIN + 68, 91],
    ["DESCRIPTION", MARGIN + 159, 157],
    ["TYPE", MARGIN + 316, 48],
    ["AMOUNT", MARGIN + 364, 91],
    ["BALANCE", MARGIN + 455, 60],
  ] as const;
  headers.forEach(([label, x, width]) =>
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7).text(label, x, y + 8, {
      width,
      align: label === "AMOUNT" ? "right" : "left",
    }),
  );
  return y + 24;
}

function drawTransactionRow(doc: PDFKit.PDFDocument, row: DatabaseRow, y: number) {
  const height = 31;
  doc.rect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, height).fill(y % 2 ? "#ffffff" : "#f8f9fc");
  doc.moveTo(MARGIN, y + height).lineTo(PAGE_WIDTH - MARGIN, y + height).strokeColor(LINE).lineWidth(0.4).stroke();
  const amount = `${row.type === "debit" ? "-" : "+"}${formatAmount(Number(row.amount), row.currency)}`;
  const cells: Array<[string, number, number, "left" | "right", string]> = [
    [displayDate(new Date(row.created_at).toISOString().slice(0, 10)), MARGIN + 7, 61, "left", DARK],
    [clean(row.reference), MARGIN + 68, 87, "left", MUTED],
    [clean(row.description), MARGIN + 159, 151, "left", DARK],
    [clean(row.type).toUpperCase(), MARGIN + 316, 46, "left", MUTED],
    [amount, MARGIN + 364, 91, "right", row.type === "credit" ? PRIMARY : DARK],
    [formatAmount(Number(row.balance_after), row.currency), MARGIN + 455, 60, "right", MUTED],
  ];
  cells.forEach(([value, x, width, align, color]) =>
    doc.fillColor(color).font("Helvetica").fontSize(7.2).text(value, x, y + 10, {
      width,
      height: 12,
      align,
      ellipsis: true,
      lineBreak: false,
    }),
  );
  return y + height;
}

function displayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatAmount(amount: number, currency: unknown) {
  return `${clean(currency || "USD")} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "");
}

function calculateRunningBalances(transactions: DatabaseRow[]) {
  const movement = (row: DatabaseRow) =>
    (row.type === "credit" ? 1 : -1) * Number(row.amount || 0);
  const knownIndex = transactions.findIndex((row) => row.balance_after !== null);
  const openingBalance =
    knownIndex >= 0
      ? Number(transactions[knownIndex].balance_after) -
        transactions.slice(0, knownIndex + 1).reduce((sum, row) => sum + movement(row), 0)
      : 0;
  let runningBalance = openingBalance;
  return transactions.map((row) => {
    runningBalance += movement(row);
    return { ...row, balance_after: runningBalance };
  });
}
