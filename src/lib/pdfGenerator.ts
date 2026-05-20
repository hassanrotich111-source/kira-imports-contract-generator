import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Contract, Settings } from "./storage";
import { calcTotals, numberToWord } from "./storage";

const PW = 595;
const PH = 842;

function fmt(n: number): string {
  return n === 0 ? "" : n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

// Convert PyMuPDF y (top-origin) to pdf-lib y (bottom-origin)
function y(py: number): number {
  return PH - py;
}

export async function generateContractPdf(contract: Contract, settings: Settings): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { totalBP, totalShipping, totalImporterFee, upfrontPayment } = calcTotals(contract.equipments);
  const countWord = numberToWord(contract.equipments.length);
  const eqCount = contract.equipments.length;

  const now = new Date();
  const day = now.getDate();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";

  const page = doc.addPage([PW, PH]);

  // ===== TITLE =====
  // x=138.6 y=24.9 → pdf y=817.1
  const title = "MACHINES IMPORT CONTRACT";
  page.drawText(title, { x: 138, y: y(24.9), size: 16, font: bold });

  // ===== DATE LINE =====
  // Original: x=320.1 y=44.9
  page.drawText(`${day}`, { x: 320.1, y: y(44.9), size: 11, font: reg });
  page.drawText(suffix, { x: 332, y: y(46), size: 7, font: reg });
  page.drawText(`day of ${months[now.getMonth()]} ${now.getFullYear()}`, { x: 345, y: y(44.9), size: 11, font: reg });

  // ===== IMPORTER (x≈55, y≈90-157) =====
  page.drawText(`Name: ${settings.importerName}`, { x: 55, y: y(90), size: 11, font: reg });
  page.drawText(`ID number: ${settings.importerId}`, { x: 78, y: y(112), size: 11, font: reg });
  page.drawText(`Mobile No: ${settings.importerMobile}`, { x: 77, y: y(135), size: 11, font: reg });
  page.drawText(`Business Name: ${settings.importerBusinessName}`, { x: 86, y: y(157), size: 11, font: reg });

  // ===== BUYER (x≈55-107, y≈203-270) =====
  page.drawText(`Name: ${contract.buyerName}`, { x: 88, y: y(203), size: 11, font: reg });
  page.drawText(`ID number: ${contract.buyerId}`, { x: 73, y: y(225), size: 11, font: reg });
  page.drawText(`Mobile No: ${contract.buyerMobile}`, { x: 78, y: y(248), size: 11, font: reg });
  page.drawText(`Business Name: ${contract.buyerBusinessName}`, { x: 107, y: y(270), size: 11, font: reg });

  // ===== MACHINE A (y≈422-603) =====
  const eq0 = contract.equipments[0];
  if (eq0) {
    // Machine title
    page.drawText(`a)  ${eq0.name.toUpperCase()}`, { x: 22, y: y(422), size: 11, font: bold });

    // Bullets (y≈445-603)
    const lines = eq0.description ? eq0.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq0.quantity}`];
    let by = 445;
    for (const line of lines) {
      page.drawText("\u2022", { x: 39, y: y(by), size: 10, font: reg });
      page.drawText(line.trim(), { x: 57, y: y(by), size: 11, font: reg });
      by += 22;
    }

    // Image at y≈623
    if (eq0.imageData) {
      try {
        let img;
        if (eq0.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq0.imageData);
        else if (eq0.imageData.startsWith("data:image")) img = await doc.embedJpg(eq0.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(260 / dims.width, 170 / dims.height, 1);
          page.drawImage(img, { x: 44, y: y(640), width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // ===== PAGE 2 =====
  const p2 = doc.addPage([PW, PH]);

  // Machine b (y≈46-268)
  const eq1 = contract.equipments[1];
  if (eq1) {
    p2.drawText(`b)  ${eq1.name.toUpperCase()}`, { x: 51, y: y(46), size: 11, font: bold });
    const lines = eq1.description ? eq1.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq1.quantity}`];
    let by = 75;
    for (const line of lines) {
      p2.drawText("\u2022", { x: 58, y: y(by), size: 10, font: reg });
      p2.drawText(line.trim(), { x: 58, y: y(by) - 2, size: 11, font: reg });
      by += 22;
    }
    if (eq1.imageData) {
      try {
        let img;
        if (eq1.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq1.imageData);
        else if (eq1.imageData.startsWith("data:image")) img = await doc.embedJpg(eq1.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(260 / dims.width, 200 / dims.height, 1);
          p2.drawImage(img, { x: 43, y: y(370), width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // Machine c (y≈562-589)
  const eq2 = contract.equipments[2];
  if (eq2) {
    p2.drawText(`c)  ${eq2.name.toUpperCase()}`, { x: 45, y: y(562), size: 11, font: bold });
    const lines = eq2.description ? eq2.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq2.quantity}`];
    let by = 585;
    for (const line of lines) {
      p2.drawText("\u2022", { x: 39, y: y(by), size: 10, font: reg });
      p2.drawText(line.trim(), { x: 57, y: y(by), size: 11, font: reg });
      by += 22;
    }
    if (eq2.imageData) {
      try {
        let img;
        if (eq2.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq2.imageData);
        else if (eq2.imageData.startsWith("data:image")) img = await doc.embedJpg(eq2.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(280 / dims.width, 190 / dims.height, 1);
          p2.drawImage(img, { x: 22, y: y(710), width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // ===== PAGE 3 =====
  const p3 = doc.addPage([PW, PH]);

  // Machine d (y≈46-64)
  const eq3 = contract.equipments[3];
  if (eq3) {
    p3.drawText(`d)  ${eq3.name.toUpperCase()}`, { x: 37, y: y(46), size: 11, font: bold });
    const lines = eq3.description ? eq3.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq3.quantity}`];
    let by = 68;
    for (const line of lines) {
      p3.drawText("\u2022", { x: 38, y: y(by), size: 10, font: reg });
      p3.drawText(line.trim(), { x: 56, y: y(by), size: 11, font: reg });
      by += 22;
    }
    if (eq3.imageData) {
      try {
        let img;
        if (eq3.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq3.imageData);
        else if (eq3.imageData.startsWith("data:image")) img = await doc.embedJpg(eq3.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(256 / dims.width, 164 / dims.height, 1);
          p3.drawImage(img, { x: 36, y: y(175), width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // ===== PAYMENT TERMS (y≈276-420) =====
  // Total price
  const totalPrefix = `Total Price/cost for the ${countWord} (${eqCount}) equipment shall be`;
  p3.drawText(totalPrefix, { x: 57, y: y(300), size: 11, font: reg });
  p3.drawText(`KES ${fmt(totalBP)}`, { x: 258, y: y(300), size: 12, font: bold });

  // Payment method
  p3.drawText(`Payment Method: ${contract.paymentMethod}`, { x: 150, y: y(323), size: 11, font: reg });

  // Upfront payment
  p3.drawText(`KES ${fmt(upfrontPayment)}`, { x: 85, y: y(386), size: 11, font: bold });

  // Balance
  p3.drawText(`KES ${fmt(totalShipping)}`, { x: 465, y: y(409), size: 11, font: bold });

  // ===== TABLE (y≈464-640) =====
  // White out table area
  p3.drawRectangle({ x: 55, y: y(640), width: 480, height: 180, color: rgb(1,1,1) });

  // Headers
  const cols = [65, 171, 273, 357];
  p3.drawText("EQUIPMENT NAME", { x: cols[0], y: y(464), size: 11, font: bold });
  p3.drawText("BUYING PRICE", { x: cols[1], y: y(464), size: 11, font: bold });
  p3.drawText("SHIPPING FEE", { x: cols[2], y: y(464), size: 11, font: bold });
  p3.drawText("IMPORTERS SERVICE FEE", { x: cols[3], y: y(464), size: 11, font: bold });

  // Rows
  const rowYs = [494, 526, 557, 589];
  for (let i = 0; i < contract.equipments.length && i < 4; i++) {
    const eq = contract.equipments[i];
    const ry = rowYs[i];
    const words = eq.name.toUpperCase().split(" ");
    if (words.length > 2) {
      p3.drawText(words.slice(0, 2).join(" "), { x: cols[0], y: y(ry), size: 11, font: bold });
      p3.drawText(words.slice(2).join(" "), { x: cols[0], y: y(ry + 14), size: 11, font: bold });
    } else {
      p3.drawText(eq.name.toUpperCase(), { x: cols[0], y: y(ry), size: 11, font: bold });
    }
    p3.drawText(fmt(eq.buyingPrice), { x: cols[1], y: y(ry), size: 11, font: reg });
    p3.drawText(fmt(eq.shippingFee), { x: cols[2], y: y(ry), size: 11, font: reg });
    p3.drawText(fmt(eq.importerFee), { x: cols[3], y: y(ry), size: 11, font: reg });
  }

  // Totals
  p3.drawText("TOTALS", { x: cols[0], y: y(614), size: 12, font: bold });
  p3.drawText(fmt(totalBP), { x: cols[1], y: y(614), size: 12, font: bold });
  p3.drawText(fmt(totalShipping), { x: cols[2], y: y(614), size: 12, font: bold });
  p3.drawText(fmt(totalImporterFee), { x: cols[3], y: y(614), size: 12, font: bold });

  // ===== PAGE 4: STATIC CONTENT =====
  const p4 = doc.addPage([PW, PH]);

  // 6. Risk and Insurance (y≈46-83)
  p4.drawText("6. Risk and Insurance", { x: 22, y: y(46), size: 12, font: bold });
  p4.drawText("Insurance responsibility during shipping and risk of loss or damage passes to the", { x: 22, y: y(69), size: 11, font: reg });
  p4.drawText("Importer according to the chosen Incoterm until the equipment is collected by the buyer.", { x: 22, y: y(83), size: 11, font: reg });

  // 7. Dispute Resolution (y≈128-218)
  p4.drawText("7. Dispute Resolution", { x: 22, y: y(128), size: 12, font: bold });
  p4.drawText("Any disputes arising from this Agreement shall be resolved through:", { x: 22, y: y(151), size: 11, font: reg });
  p4.drawText("\u2022  Negotiation", { x: 39, y: y(173), size: 11, font: reg });
  p4.drawText("\u2022  Mediation/Arbitration", { x: 39, y: y(196), size: 11, font: reg });
  p4.drawText("\u2022  Courts of Kenya", { x: 39, y: y(218), size: 11, font: reg });

  // 8. Termination (y≈255-405)
  p4.drawText("8. Termination", { x: 22, y: y(255), size: 12, font: bold });
  p4.drawText("Either party may terminate this Agreement if the other party:", { x: 22, y: y(278), size: 11, font: reg });
  p4.drawText("\u2022  breaches material terms,", { x: 39, y: y(300), size: 11, font: reg });
  p4.drawText("\u2022  fails to deliver/pay within agreed timelines,", { x: 39, y: y(323), size: 11, font: reg });
  p4.drawText("\u2022  becomes insolvent.", { x: 39, y: y(345), size: 11, font: reg });
  p4.drawText("Monies already paid to the importer shall be refunded in full upon:", { x: 22, y: y(368), size: 11, font: reg });
  p4.drawText("Failure to deliver the equipment as ordered, and of the specifications as ordered, and as", { x: 22, y: y(391), size: 11, font: reg });
  p4.drawText("per the agreed lead times with any naturally unavoidable delays, shall be communicated to", { x: 22, y: y(405), size: 11, font: reg });

  // 9. Governing Law (y≈428-450)
  p4.drawText("9. Governing Law", { x: 22, y: y(428), size: 12, font: bold });
  p4.drawText("This Agreement shall be governed by the laws of Kenya.", { x: 22, y: y(450), size: 11, font: reg });

  // 10. Signatures (y≈495-694)
  p4.drawText("10.  Signatures", { x: 22, y: y(495), size: 12, font: bold });
  p4.drawText("Importer", { x: 22, y: y(510), size: 12, font: bold });
  p4.drawText("Name: ______________________________", { x: 22, y: y(525), size: 11, font: reg });
  p4.drawText("Signature: __________________________", { x: 22, y: y(540), size: 11, font: reg });
  p4.drawText("Date: ______________________________", { x: 22, y: y(555), size: 11, font: reg });

  p4.drawText("Buyer", { x: 22, y: y(577), size: 12, font: bold });
  p4.drawText("Name: ______________________________", { x: 22, y: y(592), size: 11, font: reg });
  p4.drawText("Signature: __________________________", { x: 22, y: y(607), size: 11, font: reg });
  p4.drawText("Date: ______________________________", { x: 22, y: y(622), size: 11, font: reg });

  p4.drawText("Buyer's referee/witness", { x: 22, y: y(645), size: 12, font: bold });
  p4.drawText("Name: ______________________________", { x: 22, y: y(660), size: 11, font: reg });
  p4.drawText("Signature:  __________________________", { x: 22, y: y(675), size: 11, font: reg });
  p4.drawText("Date: ______________________________", { x: 22, y: y(690), size: 11, font: reg });

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
