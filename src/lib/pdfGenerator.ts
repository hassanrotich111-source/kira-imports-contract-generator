import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Contract, Settings } from "./storage";
import { calcTotals, numberToWord } from "./storage";

const PW = 595;  // A4 width
const PH = 842;  // A4 height
const ML = 45;   // margin left
const MR = 45;   // margin right
const MT = 55;   // margin top
const MB = 50;   // margin bottom
const CW = PW - ML - MR; // content width

function fmt(n: number): string {
  return n === 0 ? "-" : n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

interface PageCtx {
  page: ReturnType<PDFDocument["addPage"]>;
  y: number;
}

export async function generateContractPdf(contract: Contract, settings: Settings): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { totalBP, totalShipping, totalImporterFee, upfrontPayment } = calcTotals(contract.equipments);
  const countWord = numberToWord(contract.equipments.length);

  // ---- helpers ----
  function newPage(): PageCtx {
    return { page: doc.addPage([PW, PH]), y: PH - MT };
  }

  let ctx = newPage();

  function ensureSpace(needed: number) {
    if (ctx.y - needed < MB) ctx = newPage();
  }

  function drawText(text: string, x: number, size: number, font = reg) {
    ctx.page.drawText(text, { x, y: ctx.y, size, font });
  }

  function drawBold(text: string, x: number, size: number) {
    drawText(text, x, size, bold);
  }

  function lineHeight(size: number) {
    return size * 1.4;
  }

  function advance(size: number) {
    ctx.y -= lineHeight(size);
  }

  function advanceBy(n: number) {
    ctx.y -= n;
  }

  // ============ TITLE & DATE ============
  ensureSpace(80);

  const now = new Date();
  const day = now.getDate();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
  const dateStr = `${day}${suffix} day of ${months[now.getMonth()]}  ${now.getFullYear()}`;

  // Title line
  const title = 'This Machine Importation Contract ("Agreement") is made on the';
  drawText(title, ML, 11);
  advance(11);
  // Date on same visual line area
  ctx.y += 3;
  drawText(dateStr, ML + bold.widthOfTextAtSize(title, 11) + 3, 11, bold);
  ctx.y -= 3;
  drawText(", between:", ML + bold.widthOfTextAtSize(title + " " + dateStr, 11) + 6, 11);

  advance(11);

  // Main heading
  const heading = "MACHINES IMPORTATION CONTRACT.";
  const headingW = bold.widthOfTextAtSize(heading, 16);
  drawBold(heading, (PW - headingW) / 2, 16);
  advance(16);
  advanceBy(8);

  // ============ 1. IMPORTER ============
  ensureSpace(130);
  drawBold("1.", ML, 12);
  drawBold("Importer:", ML + 20, 12);
  advance(12);

  const impFields = [
    { label: "Name: ", val: settings.importerName },
    { label: "ID number: ", val: settings.importerId },
    { label: "Mobile No: ", val: settings.importerMobile },
    { label: "Business Name: ", val: settings.importerBusinessName },
  ];
  for (const f of impFields) {
    advanceBy(20);
    drawText(f.label, ML + 10, 11);
    drawText(f.val, ML + 10 + reg.widthOfTextAtSize(f.label, 11), 11, bold);
  }
  advanceBy(10);

  // ============ 2. BUYER ============
  ensureSpace(130);
  drawBold("2.", ML, 12);
  drawBold("Buyer/Customer:", ML + 20, 12);
  advance(12);

  const buyFields = [
    { label: "Name: ", val: contract.buyerName },
    { label: "ID number: ", val: contract.buyerId },
    { label: "Mobile No: ", val: contract.buyerMobile },
    { label: "Business Name: ", val: contract.buyerBusinessName },
  ];
  for (const f of buyFields) {
    advanceBy(20);
    drawText(f.label, ML + 10, 11);
    drawText(f.val, ML + 10 + reg.widthOfTextAtSize(f.label, 11), 11, bold);
  }
  advanceBy(15);

  // Together line
  ensureSpace(30);
  drawText('Together referred to as "the Parties."', ML, 11);
  advanceBy(25);

  // ============ 1. PURPOSE ============
  ensureSpace(100);
  drawBold("1.", ML, 12);
  drawBold("Purpose of the Agreement", ML + 20, 12);
  advance(12);
  advanceBy(5);

  drawText("The purpose of this Agreement is to outline the terms under which the Importer agrees to import,", ML, 11);
  advance(11);
  drawText("ship, customs clear and supply the following machine(s) to the buyer/customer.", ML, 11);
  advanceBy(25);

  // ============ 2. DESCRIPTION OF MACHINES ============
  ensureSpace(60);
  drawBold("2.", ML, 12);
  drawBold("Description of the Machines", ML + 20, 12);
  advanceBy(20);

  for (let i = 0; i < contract.equipments.length; i++) {
    const eq = contract.equipments[i];
    const letter = String.fromCharCode(97 + i);
    const bullets = eq.description
      ? eq.description.split("\n").filter((l) => l.trim())
      : [`Quantity: ${eq.quantity}`];

    const needed = 30 + bullets.length * 22 + (eq.imageData ? 180 : 10);
    ensureSpace(needed);

    // Machine label
    advanceBy(5);
    drawBold(`${letter})`, ML, 11);
    drawBold(eq.name.toUpperCase(), ML + 25, 11);
    advanceBy(20);

    // Bullets
    for (const b of bullets) {
      drawText("\u2022", ML + 15, 10);
      drawText(b.trim(), ML + 35, 11);
      advanceBy(20);
    }

    // Image
    if (eq.imageData) {
      try {
        let img;
        if (eq.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq.imageData);
        else if (eq.imageData.startsWith("data:image")) img = await doc.embedJpg(eq.imageData);

        if (img) {
          ensureSpace(170);
          const maxW = CW - 60;
          const maxH = 150;
          const dims = img.scale(1);
          const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);
          const sw = dims.width * scale;
          const sh = dims.height * scale;
          ctx.page.drawImage(img, {
            x: ML + 20 + (maxW - sw) / 2,
            y: ctx.y - sh,
            width: sw,
            height: sh,
          });
          advanceBy(sh + 15);
        }
      } catch (e) { console.error("img:", e); }
    }

    advanceBy(10);
  }

  // ============ 3. PURCHASE PRICE & PAYMENT ============
  ensureSpace(350);
  drawBold("3.", ML, 12);
  drawBold("Purchase Price and Payment Terms", ML + 20, 12);
  advanceBy(20);

  // Bullet dots
  drawText("\u2022", ML, 11); advanceBy(3);
  drawText("\u2022", ML, 11); advanceBy(3);
  drawText("\u2022", ML, 11);
  advanceBy(18);

  // Total price line
  const totalPrefix = `Total Price/cost for the ${countWord} equipment: `;
  drawText(totalPrefix, ML + 15, 11);
  drawText(`KES ${fmt(totalBP)}`, ML + 15 + reg.widthOfTextAtSize(totalPrefix, 11), 12, bold);
  advanceBy(22);

  // Payment Method
  drawText(`Payment Method: ${contract.paymentMethod}`, ML + 15, 11);
  advanceBy(22);

  // Payment Schedule
  drawText("Payment Schedule:", ML + 15, 11, bold);
  advanceBy(20);

  // Upfront payment
  const upIndent = ML + 35;
  const upfrontLine1 = "o Upfront payment for the machines buying price cost + importers service fee on";
  drawText(upfrontLine1, upIndent, 11);
  advance(11);
  const upfrontLine2 = "contract signing standing at";
  drawText(upfrontLine2, upIndent + 15, 11);
  advance(11);
  drawBold(`KES ${fmt(upfrontPayment)} .`, upIndent + 15, 11);
  advanceBy(18);

  // Balance
  const balLine1 = "o Balance of shipping fee upon equipment arrival, at the point of collection";
  drawText(balLine1, upIndent, 11);
  advance(11);
  const balLine2 = "standing at";
  drawText(balLine2, upIndent + 15, 11);
  advance(11);
  drawBold(`KES ${fmt(totalShipping)} .`, upIndent + 15, 11);
  advanceBy(22);

  // Table intro
  drawText("\u2022", ML, 11);
  drawText("Cost as outlined in the below table:", ML + 15, 11);
  advanceBy(25);

  // ============ COST TABLE ============
  // Column positions (adjustable)
  const colX = [ML + 5, ML + 170, ML + 290, ML + 420];
  const tableHeaders = ["EQUIPMENT NAME", "BUYING PRICE", "SHIPPING FEE", "IMPORTERS SERVICE FEE"];

  tableHeaders.forEach((h, i) => {
    drawBold(h, colX[i], 11);
  });
  advanceBy(5);

  // Header underline
  ctx.page.drawLine({ start: { x: ML, y: ctx.y }, end: { x: PW - MR, y: ctx.y }, thickness: 0.8, color: rgb(0, 0, 0) });
  advanceBy(20);

  // Rows
  for (const eq of contract.equipments) {
    ensureSpace(50);

    const words = eq.name.toUpperCase().split(" ");
    let l1 = words.slice(0, Math.min(3, words.length)).join(" ");
    let l2 = words.slice(3).join(" ");
    if (words.length <= 3) { l1 = words.join(" "); l2 = ""; }

    drawText(l1, colX[0], 11);
    if (l2) {
      advanceBy(14);
      drawText(l2, colX[0], 11);
      advanceBy(-14);
    }

    drawText(fmt(eq.buyingPrice), colX[1], 11);
    drawText(fmt(eq.shippingFee), colX[2], 11);
    drawText(fmt(eq.importerFee), colX[3], 11);
    advanceBy(30);
  }

  // Totals
  ctx.page.drawLine({ start: { x: ML, y: ctx.y + 10 }, end: { x: PW - MR, y: ctx.y + 10 }, thickness: 0.8, color: rgb(0, 0, 0) });
  advanceBy(8);
  drawBold("TOTALS", colX[0], 12);
  drawBold(fmt(totalBP), colX[1], 12);
  drawBold(fmt(totalShipping), colX[2], 12);
  drawBold(fmt(totalImporterFee), colX[3], 12);
  advanceBy(30);

  // ============ 4. INCOTERMS ============
  ensureSpace(100);
  drawBold("4.", ML, 12);
  drawBold("Incoterms / Delivery Terms", ML + 20, 12);
  advanceBy(20);
  drawText("\u2022", ML, 11); advanceBy(3);
  drawText("\u2022", ML, 11); advanceBy(3);
  drawText("\u2022", ML, 11); advanceBy(18);
  drawText("Lead-times: 35-45 days", ML + 15, 11);
  advanceBy(20);
  drawText("Shipping Method: via sea except for the handheld printer that's by air.", ML + 15, 11);
  advanceBy(20);
  drawText("Collection terms: self-collection at the Mombasa Road warehouse.", ML + 15, 11);
  advanceBy(30);

  // ============ 5. INSPECTION ============
  ensureSpace(80);
  drawBold("5.", ML, 12);
  drawBold("Inspection and Testing", ML + 20, 12);
  advanceBy(20);
  drawText("\u2022", ML, 11); advanceBy(3);
  drawText("\u2022", ML, 11); advanceBy(18);
  drawText("Pre-shipment inspection and testing (Yes/No): Yes", ML + 15, 11);
  advanceBy(20);
  drawText("Inspection conducted by: Importer in liaison with the Chinese equipment", ML + 15, 11);
  advance(11);
  drawText("manufacturer/supplier", ML + 15, 11);
  advanceBy(30);

  // ============ 6. RISK & INSURANCE ============
  ensureSpace(60);
  drawBold("6.", ML, 12);
  drawBold("Risk and Insurance", ML + 20, 12);
  advanceBy(20);
  drawText("Insurance responsibility during shipping and risk of loss or damage passes to the", ML, 11);
  advance(11);
  drawText("Importer according to the chosen Incoterm until the equipment is collected by the buyer.", ML, 11);
  advanceBy(30);

  // ============ 7. DISPUTE RESOLUTION ============
  ensureSpace(100);
  drawBold("7.", ML, 12);
  drawBold("Dispute Resolution", ML + 20, 12);
  advanceBy(20);
  drawText("Any disputes arising from this Agreement shall be resolved through:", ML, 11);
  advanceBy(20);
  drawText("\u2022  Negotiation", ML + 10, 11);
  advanceBy(18);
  drawText("\u2022  Mediation/Arbitration", ML + 10, 11);
  advanceBy(18);
  drawText("\u2022  Courts of Kenya", ML + 10, 11);
  advanceBy(30);

  // ============ 8. TERMINATION ============
  ensureSpace(150);
  drawBold("8.", ML, 12);
  drawBold("Termination", ML + 20, 12);
  advanceBy(20);
  drawText("Either party may terminate this Agreement if the other party:", ML, 11);
  advanceBy(20);
  drawText("\u2022", ML, 11); advanceBy(3);
  drawText("\u2022", ML, 11); advanceBy(3);
  drawText("\u2022", ML, 11); advanceBy(18);
  drawText("breaches material terms,", ML + 15, 11);
  advanceBy(18);
  drawText("fails to deliver/pay within agreed timelines,", ML + 15, 11);
  advanceBy(18);
  drawText("becomes insolvent.", ML + 15, 11);
  advanceBy(20);
  drawText("Monies already paid to the importer shall be refunded in full upon:", ML, 11);
  advanceBy(20);
  drawText("Failure to deliver the equipment as ordered, and of the specifications as ordered, and as", ML, 11);
  advance(11);
  drawText("per the agreed lead times with any naturally unavoidable delays, shall be communicated to", ML, 11);
  advance(11);
  drawText("the buyer immediately for alignment.", ML, 11);
  advanceBy(30);

  // ============ 9. GOVERNING LAW ============
  ensureSpace(50);
  drawBold("9.", ML, 12);
  drawBold("Governing Law", ML + 20, 12);
  advanceBy(20);
  drawText("This Agreement shall be governed by the laws of Kenya.", ML, 11);
  advanceBy(40);

  // ============ 10. SIGNATURES ============
  ensureSpace(300);
  drawBold("10.", ML, 12);
  drawBold("Signatures", ML + 25, 12);
  advanceBy(40);

  // Importer
  drawBold("Importer", ML, 12);
  advanceBy(25);
  drawText("Name: ______________________________", ML, 11);
  advanceBy(22);
  drawText("Signature: __________________________", ML, 11);
  advanceBy(22);
  drawText("Date: ______________________________", ML, 11);
  advanceBy(40);

  // Buyer
  drawBold("Buyer", ML, 12);
  advanceBy(25);
  drawText("Name: ______________________________", ML, 11);
  advanceBy(22);
  drawText("Signature: __________________________", ML, 11);
  advanceBy(22);
  drawText("Date: ______________________________", ML, 11);
  advanceBy(40);

  // Witness
  drawBold("Buyer's referee/witness", ML, 12);
  advanceBy(25);
  drawText("Name: ______________________________", ML, 11);
  advanceBy(22);
  drawText("Signature: __________________________", ML, 11);
  advanceBy(22);
  drawText("Date: ______________________________", ML, 11);
  advanceBy(22);
  drawText("ID No.  ______________________________", ML + 20, 11);

  return await doc.save();
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
