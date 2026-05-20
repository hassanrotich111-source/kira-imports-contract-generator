import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Contract, Settings } from "./storage";
import { calcTotals, numberToWord } from "./storage";

const PW = 595;
const PH = 842;

function fmt(n: number): string {
  return n === 0 ? "" : n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

// Convert top-origin y (from analysis) to pdf-lib bottom-origin
function Y(py: number): number {
  return PH - py;
}

export async function generateContractPdf(contract: Contract, settings: Settings): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { totalBP, totalShipping, totalImporterFee, upfrontPayment } = calcTotals(contract.equipments);
  const countWord = numberToWord(contract.equipments.length);
  const eqCount = contract.equipments.length;

  // Parse contract date (YYYY-MM-DD)
  const dateParts = contract.contractDate ? contract.contractDate.split("-") : [];
  const contractYear = dateParts[0] ? parseInt(dateParts[0]) : new Date().getFullYear();
  const contractMonth = dateParts[1] ? parseInt(dateParts[1]) - 1 : new Date().getMonth();
  const contractDay = dateParts[2] ? parseInt(dateParts[2]) : new Date().getDate();

  const day = contractDay;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";

  // ===== PAGE 1 =====
  let page = doc.addPage([PW, PH]);

  // --- TITLE (underlined) ---
  const titleText = "MACHINES IMPORT CONTRACT.";
  const titleW = bold.widthOfTextAtSize(titleText, 16);
  page.drawText(titleText, { x: 139, y: Y(25), size: 16, font: bold });
  page.drawLine({ start: { x: 139, y: Y(25) - 3 }, end: { x: 139 + titleW, y: Y(25) - 3 }, thickness: 0.8, color: rgb(0, 0, 0) });

  // --- DATE LINE (sequentially positioned, no overlap) ---
  let dx = 22;
  const dy = Y(45);

  const drawPart = (text: string, font = reg) => {
    page.drawText(text, { x: dx, y: dy, size: 11, font });
    dx += font.widthOfTextAtSize(text, 11) + 1.5;
  };

  drawPart('This ');
  drawPart('Machine Importation Contract', bold);
  drawPart(' ("Agreement") is made on the ');
  drawPart(`${day}`, bold);
  // Superscript suffix
  page.drawText(suffix, { x: dx - 1, y: dy + 3, size: 7, font: bold });
  dx += 6;
  drawPart('day of ');
  drawPart(`${months[contractMonth]} `, bold);
  drawPart(`${contractYear}`, bold);
  drawPart(', between:');

  // --- IMPORTER (underlined values) ---
  page.drawText("1.", { x: 22, y: Y(67), size: 11, font: bold });
  page.drawText("Importer:", { x: 33, y: Y(67), size: 11, font: bold });

  // Name (underlined)
  const impNameW = reg.widthOfTextAtSize(settings.importerName, 11);
  page.drawText("Name: ", { x: 21, y: Y(90), size: 11, font: reg });
  page.drawText(settings.importerName, { x: 55, y: Y(90), size: 11, font: reg });
  page.drawLine({ start: { x: 55, y: Y(90) - 2 }, end: { x: 55 + impNameW, y: Y(90) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  // ID (underlined)
  const impIdW = reg.widthOfTextAtSize(settings.importerId, 11);
  page.drawText("ID number: ", { x: 22, y: Y(112), size: 11, font: reg });
  page.drawText(settings.importerId, { x: 82, y: Y(112), size: 11, font: reg });
  page.drawLine({ start: { x: 82, y: Y(112) - 2 }, end: { x: 82 + impIdW, y: Y(112) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  // Mobile (underlined)
  const impMobileW = reg.widthOfTextAtSize(settings.importerMobile, 11);
  page.drawText("Mobile No: ", { x: 22, y: Y(135), size: 11, font: reg });
  page.drawText(settings.importerMobile, { x: 82, y: Y(135), size: 11, font: reg });
  page.drawLine({ start: { x: 82, y: Y(135) - 2 }, end: { x: 82 + impMobileW, y: Y(135) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  // Business (underlined)
  const impBizW = reg.widthOfTextAtSize(settings.importerBusinessName, 11);
  page.drawText("Business Name: ", { x: 22, y: Y(157), size: 11, font: reg });
  page.drawText(settings.importerBusinessName, { x: 108, y: Y(157), size: 11, font: reg });
  page.drawLine({ start: { x: 108, y: Y(157) - 2 }, end: { x: 108 + impBizW, y: Y(157) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  // --- BUYER (UNDERLINED) ---
  page.drawText("2.", { x: 22, y: Y(180), size: 11, font: bold });
  page.drawText("Buyer/Customer:", { x: 33, y: Y(180), size: 11, font: bold });

  // Buyer fields - UNDERLINED
  const buyerNameW = reg.widthOfTextAtSize(contract.buyerName, 11);
  page.drawText("Name: ", { x: 21, y: Y(203), size: 11, font: reg });
  page.drawText(contract.buyerName, { x: 55, y: Y(203), size: 11, font: reg });
  page.drawLine({ start: { x: 55, y: Y(203) - 2 }, end: { x: 55 + buyerNameW, y: Y(203) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  const buyerIdW = reg.widthOfTextAtSize(contract.buyerId, 11);
  page.drawText("ID number: ", { x: 22, y: Y(225), size: 11, font: reg });
  page.drawText(contract.buyerId, { x: 82, y: Y(225), size: 11, font: reg });
  page.drawLine({ start: { x: 82, y: Y(225) - 2 }, end: { x: 82 + buyerIdW, y: Y(225) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  const buyerMobileW = reg.widthOfTextAtSize(contract.buyerMobile, 11);
  page.drawText("Mobile No: ", { x: 22, y: Y(248), size: 11, font: reg });
  page.drawText(contract.buyerMobile, { x: 82, y: Y(248), size: 11, font: reg });
  page.drawLine({ start: { x: 82, y: Y(248) - 2 }, end: { x: 82 + buyerMobileW, y: Y(248) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  const buyerBizW = reg.widthOfTextAtSize(contract.buyerBusinessName, 11);
  page.drawText("Business Name: ", { x: 22, y: Y(270), size: 11, font: reg });
  page.drawText(contract.buyerBusinessName, { x: 108, y: Y(270), size: 11, font: reg });
  page.drawLine({ start: { x: 108, y: Y(270) - 2 }, end: { x: 108 + buyerBizW, y: Y(270) - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });

  // Together line (sequential positioning, no overlap)
  let tx = 22;
  const tPart1 = 'Together referred to as ';
  const tPart2 = '"the Parties."';
  page.drawText(tPart1, { x: tx, y: Y(293), size: 11, font: reg });
  tx += reg.widthOfTextAtSize(tPart1, 11) + 1;
  page.drawText(tPart2, { x: tx, y: Y(293), size: 11, font: bold });

  // --- 1. Purpose (2 lines like original, fitting within margins) ---
  page.drawText("1. ", { x: 22, y: Y(340), size: 12, font: bold });
  page.drawText("Purpose of the Agreement", { x: 36, y: Y(340), size: 12, font: bold });
  // Line 1 (longer, fits within ~520pt usable width)
  page.drawText("The purpose of this Agreement is to outline the terms under which the Importer agrees to", { x: 22, y: Y(361), size: 11, font: reg });
  // Line 2
  page.drawText("import, ship, customs clear and supply the following machine(s) to the buyer/customer.", { x: 22, y: Y(378), size: 11, font: reg });

  // --- 2. Description of Machines ---
  page.drawText("2. ", { x: 22, y: Y(401), size: 12, font: bold });
  page.drawText("Description of the Machines", { x: 36, y: Y(401), size: 12, font: bold });

  // ===== DYNAMIC MACHINES (start immediately after heading) =====
  let machineY = 415; // small gap after heading, machine name starts right away

  for (let i = 0; i < contract.equipments.length; i++) {
    const eq = contract.equipments[i];
    const letter = String.fromCharCode(97 + i); // a, b, c, d...
    const bullets = eq.description ? eq.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq.quantity}`];

    // Check if we need a new page
    const machineHeight = 25 + bullets.length * 22 + (eq.imageData ? 180 : 10);
    if (machineY + machineHeight > 780) {
      page = doc.addPage([PW, PH]);
      machineY = 50; // start fresh on new page
    }

    // Machine name - BOLD, UPPERCASE, letter-numbered
    page.drawText(`${letter})`, { x: 22, y: Y(machineY), size: 11, font: bold });
    page.drawText(eq.name.toUpperCase(), { x: 45, y: Y(machineY), size: 11, font: bold });
    machineY += 22;

    // Bullet points
    for (const line of bullets) {
      page.drawText("\u2022", { x: 39, y: Y(machineY), size: 10, font: reg });
      page.drawText(line.trim(), { x: 57, y: Y(machineY), size: 11, font: reg });
      machineY += 22;
    }

    // Image
    if (eq.imageData) {
      try {
        let img;
        if (eq.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq.imageData);
        else if (eq.imageData.startsWith("data:image")) img = await doc.embedJpg(eq.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(380 / dims.width, 140 / dims.height, 1);
          page.drawImage(img, { x: 44, y: Y(machineY + 150), width: dims.width * scale, height: dims.height * scale });
          machineY += 150;
        }
      } catch (e) { /* ignore */ }
    }

    machineY += 15;
  }

  // ===== PAGE 3: PURCHASE TERMS + TABLE =====
  page = doc.addPage([PW, PH]);

  // 3. Purchase Price and Payment Terms
  page.drawText("3. ", { x: 22, y: Y(46), size: 11, font: bold });
  page.drawText("Purchase Price and Payment Terms", { x: 36, y: Y(46), size: 11, font: bold });

  // Bullet 1 - Total Price
  page.drawText("\u2022", { x: 39, y: Y(68), size: 10, font: reg });
  const totalPrefix = `Total Price/cost for the ${countWord} (${eqCount}) equipment: `;
  page.drawText(totalPrefix, { x: 57, y: Y(68), size: 11, font: reg });
  page.drawText(`KES ${fmt(totalBP)}`, { x: 57 + reg.widthOfTextAtSize(totalPrefix, 11), y: Y(68), size: 12, font: bold });

  // Bullet 2 - Payment Method
  page.drawText("\u2022", { x: 39, y: Y(91), size: 10, font: reg });
  page.drawText(`Payment Method: ${contract.paymentMethod}`, { x: 57, y: Y(91), size: 11, font: reg });

  // Bullet 3 - Payment Schedule
  page.drawText("\u2022", { x: 39, y: Y(114), size: 10, font: reg });
  page.drawText("Payment Schedule:", { x: 57, y: Y(114), size: 11, font: reg });

  // o - Upfront (split so "contract" is last word on first line, KES on same line as "signing standing at")
  page.drawText("o", { x: 76, y: Y(137), size: 10, font: reg });
  page.drawText("Upfront payment for the machines buying price cost + importers service fee on", { x: 85, y: Y(137), size: 11, font: reg });
  const signingLine = `contract signing standing at KES ${fmt(upfrontPayment)}.`;
  page.drawText(signingLine, { x: 85, y: Y(152), size: 11, font: reg });

  // o - Balance (reduced gap, tighter spacing)
  page.drawText("o", { x: 76, y: Y(172), size: 10, font: reg });
  page.drawText("Balance of shipping fee upon equipment arrival, at the point of collection", { x: 85, y: Y(172), size: 11, font: reg });
  page.drawText("standing at", { x: 85, y: Y(187), size: 11, font: reg });
  page.drawText(`KES ${fmt(totalShipping)}`, { x: 160, y: Y(187), size: 11, font: bold });
  page.drawText(".", { x: 160 + bold.widthOfTextAtSize(`KES ${fmt(totalShipping)}`, 11), y: Y(187), size: 11, font: reg });

  // Bullet 4 - Cost table intro
  page.drawText("\u2022", { x: 39, y: Y(210), size: 10, font: reg });
  page.drawText("Cost as outlined in the below table:", { x: 57, y: Y(210), size: 11, font: reg });

  // ===== DYNAMIC TABLE =====
  // Simple approach: one page at a time, borders first then text on same page
  const cols = [65, 171, 273, 357];
  const colEnd = 540;
  const minRowH = 28;
  const headerH = 22;

  // Table page manager
  const tablePages: { page: typeof page; headerY: number; bottomLimit: number }[] = [];

  function startTablePage(isFirst: boolean) {
    const p = isFirst ? page : doc.addPage([PW, PH]);
    if (!isFirst) p.drawText("Cost Table (continued)", { x: 22, y: Y(30), size: 12, font: bold });
    tablePages.push({ page: p, headerY: isFirst ? 252 : 55, bottomLimit: isFirst ? 680 : 690 });
    return tablePages[tablePages.length - 1];
  }

  let tp = startTablePage(true);
  let rowY = tp.headerY + headerH;

  // Draw each equipment
  for (let i = 0; i < contract.equipments.length; i++) {
    const eq = contract.equipments[i];
    const nameUpper = eq.name.toUpperCase();
    const needsWrap = bold.widthOfTextAtSize(nameUpper, 11) > (cols[1] - cols[0] - 10);
    const rowH = needsWrap ? minRowH + 16 : minRowH;

    // Page overflow check
    if (rowY + rowH > tp.bottomLimit) {
      tp = startTablePage(false);
      rowY = tp.headerY + headerH;
    }

    const baseY = rowY;

    // Name (wrap if needed)
    if (needsWrap) {
      const words = nameUpper.split(" ");
      let line1 = "", line2 = "";
      for (const w of words) {
        const test = line1 ? `${line1} ${w}` : w;
        if (bold.widthOfTextAtSize(test, 11) < (cols[1] - cols[0] - 10)) line1 = test;
        else line2 = line2 ? `${line2} ${w}` : w;
      }
      tp.page.drawText(line1, { x: cols[0], y: Y(baseY), size: 11, font: bold });
      if (line2) tp.page.drawText(line2, { x: cols[0], y: Y(baseY + 14), size: 11, font: bold });
    } else {
      tp.page.drawText(nameUpper, { x: cols[0], y: Y(baseY), size: 11, font: bold });
    }

    // Values
    tp.page.drawText(fmt(eq.buyingPrice), { x: cols[1], y: Y(baseY), size: 11, font: reg });
    tp.page.drawText(fmt(eq.shippingFee), { x: cols[2], y: Y(baseY), size: 11, font: reg });
    tp.page.drawText(fmt(eq.importerFee), { x: cols[3], y: Y(baseY), size: 11, font: reg });

    rowY += rowH;
  }

  // Totals
  const totalsY = rowY + 4;
  const tableEndY = totalsY + 26;
  const lastTp = tablePages[tablePages.length - 1];
  lastTp.page.drawText("TOTALS", { x: cols[0], y: Y(totalsY + 6), size: 12, font: bold });
  lastTp.page.drawText(fmt(totalBP), { x: cols[1], y: Y(totalsY + 6), size: 12, font: bold });
  lastTp.page.drawText(fmt(totalShipping), { x: cols[2], y: Y(totalsY + 6), size: 12, font: bold });
  lastTp.page.drawText(fmt(totalImporterFee), { x: cols[3], y: Y(totalsY + 6), size: 12, font: bold });

  // ---- Draw borders on all table pages (borders last = on top of white bg, under text is fine since text is black on white) ----
  // Actually, draw borders FIRST (before text) so text sits on top clean
  // We already drew text, so let's just make sure borders don't overlap.
  // Since text is black and borders are thin gray, it should be fine.
  // But to be safe, let's redraw text after borders? No, that's complex.
  // Instead: the borders are thin (0.5pt) and text is over them - visually fine.

  // Re-draw approach: clear and redraw properly
  // Actually, the cleanest fix is to NOT draw any horizontal lines through text.
  // Only draw: top border, header separator, bottom border. No row lines.
  // And vertical lines only at column boundaries, not through text (they're at edges).

  for (const tpi of tablePages) {
    const p = tpi.page;
    const hy = tpi.headerY;

    // Top border of table
    p.drawLine({ start: { x: 55, y: Y(hy - 2) }, end: { x: colEnd, y: Y(hy - 2) }, thickness: 0.5, color: rgb(0, 0, 0) });
    // Header bottom border
    p.drawLine({ start: { x: 55, y: Y(hy + headerH - 2) }, end: { x: colEnd, y: Y(hy + headerH - 2) }, thickness: 0.5, color: rgb(0, 0, 0) });

    // Header text
    p.drawText("EQUIPMENT NAME", { x: cols[0], y: Y(hy), size: 11, font: bold });
    p.drawText("BUYING PRICE", { x: cols[1], y: Y(hy), size: 11, font: bold });
    p.drawText("SHIPPING FEE", { x: cols[2], y: Y(hy), size: 11, font: bold });
    p.drawText("IMPORTERS SERVICE FEE", { x: cols[3], y: Y(hy), size: 11, font: bold });

    // Vertical column lines (full height of table area)
    const vLines = [55, cols[1] - 8, cols[2] - 8, cols[3] - 8, colEnd];
    const tableBottom = (tpi === lastTp) ? tableEndY : tpi.bottomLimit - 10;
    for (const vx of vLines) {
      p.drawLine({ start: { x: vx, y: Y(hy - 2) }, end: { x: vx, y: Y(tableBottom) }, thickness: 0.5, color: rgb(0, 0, 0) });
    }

    // Bottom border
    p.drawLine({ start: { x: 55, y: Y(tableBottom) }, end: { x: colEnd, y: Y(tableBottom) }, thickness: 0.5, color: rgb(0, 0, 0) });

    // Totals separator on last page
    if (tpi === lastTp) {
      p.drawLine({ start: { x: 55, y: Y(totalsY) }, end: { x: colEnd, y: Y(totalsY) }, thickness: 0.5, color: rgb(0, 0, 0) });
    }
  }

  // Set current page for sections after table
  page = lastTp.page;

  // ===== 4. Incoterms =====
  let sectionY = tableEndY + 30;
  if (sectionY > 650) {
    page = doc.addPage([PW, PH]);
    sectionY = 50;
  }

  page.drawText("4. ", { x: 22, y: Y(sectionY), size: 11, font: bold });
  page.drawText("Incoterms / Delivery Terms", { x: 36, y: Y(sectionY), size: 11, font: bold });
  sectionY += 22;
  page.drawText("\u2022", { x: 39, y: Y(sectionY), size: 10, font: reg });
  page.drawText("Lead-times: 35-45 days", { x: 57, y: Y(sectionY), size: 11, font: reg });
  sectionY += 22;
  page.drawText("\u2022", { x: 39, y: Y(sectionY), size: 10, font: reg });
  page.drawText("Shipping Method: via sea except for the handheld printer that's by air.", { x: 57, y: Y(sectionY), size: 11, font: reg });
  sectionY += 22;
  page.drawText("\u2022", { x: 39, y: Y(sectionY), size: 10, font: reg });
  page.drawText("Collection terms: self collection at the Mombasa Road warehouse.", { x: 57, y: Y(sectionY), size: 11, font: reg });

  // ===== 5. Inspection =====
  sectionY += 40;
  if (sectionY > 750) { page = doc.addPage([PW, PH]); sectionY = 50; }

  page.drawText("5. ", { x: 22, y: Y(sectionY), size: 11, font: bold });
  page.drawText("Inspection and Testing", { x: 36, y: Y(sectionY), size: 11, font: bold });
  sectionY += 22;
  page.drawText("\u2022", { x: 39, y: Y(sectionY), size: 10, font: reg });
  page.drawText("Pre-shipment inspection and testing (Yes/No): Yes", { x: 57, y: Y(sectionY), size: 11, font: reg });
  sectionY += 22;
  page.drawText("\u2022", { x: 39, y: Y(sectionY), size: 10, font: reg });
  page.drawText("Inspection conducted by: Importer in liaison with the Chinese equipment manufacturer/supplier", { x: 57, y: Y(sectionY), size: 11, font: reg });

  // ===== 6. Risk and Insurance =====
  sectionY += 40;
  if (sectionY > 780) { page = doc.addPage([PW, PH]); sectionY = 50; }

  page.drawText("6. ", { x: 22, y: Y(sectionY), size: 11, font: bold });
  page.drawText("Risk and Insurance", { x: 36, y: Y(sectionY), size: 11, font: bold });
  sectionY += 22;
  page.drawText("Insurance responsibility during shipping and risk of loss or damage passes to the Importer according to the chosen", { x: 22, y: Y(sectionY), size: 11, font: reg });
  sectionY += 14;
  page.drawText("Incoterm until the equipment is collected by the buyer.", { x: 23, y: Y(sectionY), size: 11, font: reg });

  // ===== PAGE 4: 7-10 =====
  const p4 = doc.addPage([PW, PH]);

  // 7. Dispute Resolution
  p4.drawText("7. ", { x: 22, y: Y(46), size: 11, font: bold });
  p4.drawText("Dispute Resolution", { x: 36, y: Y(46), size: 11, font: bold });
  p4.drawText("Any disputes arising from this Agreement shall be resolved through:", { x: 22, y: Y(69), size: 11, font: reg });
  p4.drawText("\u2022  Negotiation", { x: 39, y: Y(91), size: 11, font: reg });
  p4.drawText("\u2022  Mediation/Arbitration", { x: 39, y: Y(114), size: 11, font: reg });
  p4.drawText("\u2022  Courts of Kenya", { x: 39, y: Y(136), size: 11, font: reg });

  // 8. Termination
  p4.drawText("8. ", { x: 22, y: Y(173), size: 11, font: bold });
  p4.drawText("Termination", { x: 36, y: Y(173), size: 11, font: bold });
  p4.drawText("Either party may terminate this Agreement if the other party:", { x: 22, y: Y(196), size: 11, font: reg });
  p4.drawText("\u2022  breaches material terms,", { x: 39, y: Y(218), size: 11, font: reg });
  p4.drawText("\u2022  fails to deliver/pay within agreed timelines,", { x: 39, y: Y(241), size: 11, font: reg });
  p4.drawText("\u2022  becomes insolvent.", { x: 39, y: Y(263), size: 11, font: reg });
  p4.drawText("Monies already paid to the importer shall be refunded in full upon:", { x: 22, y: Y(286), size: 11, font: reg });
  p4.drawText("Failure to deliver the equipment as ordered, and of the specifications as ordered, and as", { x: 22, y: Y(309), size: 11, font: reg });
  p4.drawText("per the agreed lead times with any naturally unavoidable delays, shall be communicated to", { x: 22, y: Y(323), size: 11, font: reg });
  p4.drawText("the buyer immediately for alignment.", { x: 23, y: Y(337), size: 11, font: reg });

  // 9. Governing Law
  p4.drawText("9. ", { x: 22, y: Y(360), size: 11, font: bold });
  p4.drawText("Governing Law", { x: 36, y: Y(360), size: 11, font: bold });
  p4.drawText("This Agreement shall be governed by the laws of Kenya.", { x: 22, y: Y(383), size: 11, font: reg });

  // 10. Signatures
  p4.drawText("10. ", { x: 22, y: Y(427), size: 11, font: bold });
  p4.drawText("Signatures", { x: 43, y: Y(427), size: 11, font: bold });

  // Importer
  p4.drawText("Importer", { x: 22, y: Y(450), size: 11, font: bold });
  p4.drawText("Name: ______________________________", { x: 22, y: Y(465), size: 11, font: reg });
  p4.drawText("Signature: __________________________", { x: 22, y: Y(480), size: 11, font: reg });
  p4.drawText("Date: ______________________________", { x: 22, y: Y(495), size: 11, font: reg });

  // Buyer
  p4.drawText("Buyer", { x: 22, y: Y(518), size: 11, font: bold });
  p4.drawText("Name: ______________________________", { x: 22, y: Y(533), size: 11, font: reg });
  p4.drawText("Signature: __________________________", { x: 22, y: Y(548), size: 11, font: reg });
  p4.drawText("Date: ______________________________", { x: 22, y: Y(563), size: 11, font: reg });

  // Witness
  p4.drawText("Buyer's referee/witness", { x: 22, y: Y(586), size: 11, font: bold });
  p4.drawText("Name: ______________________________", { x: 22, y: Y(601), size: 11, font: reg });
  p4.drawText("Signature:  __________________________", { x: 22, y: Y(616), size: 11, font: reg });
  p4.drawText("Date: ______________________________", { x: 22, y: Y(631), size: 11, font: reg });
  p4.drawText("ID No.  ______________________________", { x: 22, y: Y(654), size: 11, font: reg });

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
