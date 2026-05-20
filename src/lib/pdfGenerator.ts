import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Contract, Settings } from "./storage";
import { calcTotals, numberToWord } from "./storage";

const TEMPLATE_URL = "./template/contract-template.pdf";

function fmt(n: number): string {
  return n === 0 ? "" : n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

export async function generateContractPdf(contract: Contract, settings: Settings): Promise<Uint8Array> {
  // 1. Load the original template
  const resp = await fetch(TEMPLATE_URL);
  if (!resp.ok) throw new Error("Contract template not found. Please upload a template in Settings.");
  const templateBytes = await resp.arrayBuffer();
  const doc = await PDFDocument.load(templateBytes);
  const pages = doc.getPages();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const PH = 841.92;

  const { totalBP, totalShipping, totalImporterFee, upfrontPayment } = calcTotals(contract.equipments);
  const countWord = numberToWord(contract.equipments.length);
  const eqCount = contract.equipments.length;

  // ========== PAGE 1 ==========
  const p1 = pages[0];

  // --- Title area: "MACHINES IMPORT CONTRACT" ---
  // White out
  p1.drawRectangle({ x: 138, y: 799, width: 320, height: 20, color: rgb(1,1,1) });
  p1.drawText("MACHINES IMPORT CONTRACT", { x: 138, y: 799, size: 16, font: helvBold });

  // --- Date: "20th day of May 2026" ---
  p1.drawRectangle({ x: 308, y: 779, width: 200, height: 16, color: rgb(1,1,1) });
  const now = new Date();
  const day = now.getDate();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
  p1.drawText(`${day}${suffix} day of ${months[now.getMonth()]}  ${now.getFullYear()}`, { x: 308, y: 779, size: 11, font: helv });

  // --- Importer Details (white out + rewrite) ---
  // Name
  p1.drawRectangle({ x: 55, y: 739, width: 250, height: 14, color: rgb(1,1,1) });
  p1.drawText(settings.importerName, { x: 92, y: 739, size: 11, font: helv });
  // ID
  p1.drawRectangle({ x: 78, y: 717, width: 200, height: 14, color: rgb(1,1,1) });
  p1.drawText(settings.importerId, { x: 137, y: 717, size: 11, font: helv });
  // Mobile
  p1.drawRectangle({ x: 77, y: 694, width: 200, height: 14, color: rgb(1,1,1) });
  p1.drawText(settings.importerMobile, { x: 136, y: 694, size: 11, font: helv });
  // Business
  p1.drawRectangle({ x: 86, y: 672, width: 250, height: 14, color: rgb(1,1,1) });
  p1.drawText(settings.importerBusinessName, { x: 175, y: 672, size: 11, font: helv });

  // --- Buyer Details (white out + rewrite) ---
  // Name
  p1.drawRectangle({ x: 88, y: 627, width: 300, height: 14, color: rgb(1,1,1) });
  p1.drawText(contract.buyerName, { x: 125, y: 627, size: 11, font: helv });
  // ID
  p1.drawRectangle({ x: 73, y: 605, width: 200, height: 14, color: rgb(1,1,1) });
  p1.drawText(contract.buyerId, { x: 132, y: 605, size: 11, font: helv });
  // Mobile
  p1.drawRectangle({ x: 78, y: 582, width: 200, height: 14, color: rgb(1,1,1) });
  p1.drawText(contract.buyerMobile, { x: 137, y: 582, size: 11, font: helv });
  // Business
  p1.drawRectangle({ x: 107, y: 560, width: 300, height: 14, color: rgb(1,1,1) });
  p1.drawText(contract.buyerBusinessName, { x: 196, y: 560, size: 11, font: helv });

  // ========== MACHINE DESCRIPTIONS (Page 1) ==========
  // Machine a) - clear and rewrite
  const eq0 = contract.equipments[0];
  if (eq0) {
    // Clear machine name
    p1.drawRectangle({ x: 22, y: PH - 433, width: 250, height: 16, color: rgb(1,1,1) });
    p1.drawText(`a)  ${eq0.name.toUpperCase()}`, { x: 22, y: PH - 433, size: 11, font: helvBold });

    // Clear bullet area
    const descLines0 = eq0.description ? eq0.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq0.quantity}`];
    p1.drawRectangle({ x: 38, y: PH - 445 - descLines0.length * 22, width: 400, height: descLines0.length * 22 + 15, color: rgb(1,1,1) });

    let by = PH - 455;
    for (const line of descLines0) {
      p1.drawText("\u2022", { x: 40, y: by, size: 10, font: helv });
      p1.drawText(line.trim(), { x: 58, y: by, size: 11, font: helv });
      by -= 22;
    }

    // Embed image if available
    if (eq0.imageData) {
      try {
        let img;
        if (eq0.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq0.imageData);
        else if (eq0.imageData.startsWith("data:image")) img = await doc.embedJpg(eq0.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(260 / dims.width, 170 / dims.height, 1);
          p1.drawImage(img, { x: 44, y: 641, width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore image errors */ }
    }
  }

  // ========== PAGE 2 ==========
  if (pages.length > 1) {
    const p2 = pages[1];

    // Machine b)
    const eq1 = contract.equipments[1];
    if (eq1) {
      p2.drawRectangle({ x: 51, y: PH - 57, width: 250, height: 16, color: rgb(1,1,1) });
      p2.drawText(`b)  ${eq1.name.toUpperCase()}`, { x: 51, y: PH - 57, size: 11, font: helvBold });

      const descLines1 = eq1.description ? eq1.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq1.quantity}`];
      p2.drawRectangle({ x: 58, y: PH - 75 - descLines1.length * 22, width: 400, height: descLines1.length * 22 + 20, color: rgb(1,1,1) });

      let by = PH - 82;
      for (const line of descLines1) {
        p2.drawText("\u2022", { x: 60, y: by, size: 10, font: helv });
        p2.drawText(line.trim(), { x: 78, y: by, size: 11, font: helv });
        by -= 22;
      }

      if (eq1.imageData) {
        try {
          let img;
          if (eq1.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq1.imageData);
          else if (eq1.imageData.startsWith("data:image")) img = await doc.embedJpg(eq1.imageData);
          if (img) {
            const dims = img.scale(1);
            const scale = Math.min(258 / dims.width, 198 / dims.height, 1);
            p2.drawImage(img, { x: 43, y: 317, width: dims.width * scale, height: dims.height * scale });
          }
        } catch (e) { /* ignore */ }
      }
    }

    // Machine c)
    const eq2 = contract.equipments[2];
    if (eq2) {
      p2.drawRectangle({ x: 45, y: PH - 573, width: 250, height: 16, color: rgb(1,1,1) });
      p2.drawText(`c)  ${eq2.name.toUpperCase()}`, { x: 45, y: PH - 573, size: 11, font: helvBold });

      const descLines2 = eq2.description ? eq2.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq2.quantity}`];
      p2.drawRectangle({ x: 38, y: PH - 588 - descLines2.length * 22, width: 400, height: descLines2.length * 22 + 15, color: rgb(1,1,1) });

      let by = PH - 593;
      for (const line of descLines2) {
        p2.drawText("\u2022", { x: 40, y: by, size: 10, font: helv });
        p2.drawText(line.trim(), { x: 58, y: by, size: 11, font: helv });
        by -= 22;
      }

      if (eq2.imageData) {
        try {
          let img;
          if (eq2.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq2.imageData);
          else if (eq2.imageData.startsWith("data:image")) img = await doc.embedJpg(eq2.imageData);
          if (img) {
            const dims = img.scale(1);
            const scale = Math.min(280 / dims.width, 186 / dims.height, 1);
            p2.drawImage(img, { x: 22, y: 614, width: dims.width * scale, height: dims.height * scale });
          }
        } catch (e) { /* ignore */ }
      }
    }
  }

  // ========== PAGE 3 (Purchase Terms + Table) ==========
  if (pages.length > 2) {
    const p3 = pages[2];

    // Machine d)
    const eq3 = contract.equipments[3];
    if (eq3) {
      p3.drawRectangle({ x: 37, y: PH - 57, width: 250, height: 16, color: rgb(1,1,1) });
      p3.drawText(`d)  ${eq3.name.toUpperCase()}`, { x: 37, y: PH - 57, size: 11, font: helvBold });

      const descLines3 = eq3.description ? eq3.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq3.quantity}`];
      p3.drawRectangle({ x: 36, y: PH - 73 - descLines3.length * 22, width: 400, height: descLines3.length * 22 + 15, color: rgb(1,1,1) });

      let by = PH - 78;
      for (const line of descLines3) {
        p3.drawText("\u2022", { x: 38, y: by, size: 10, font: helv });
        p3.drawText(line.trim(), { x: 56, y: by, size: 11, font: helv });
        by -= 22;
      }

      if (eq3.imageData) {
        try {
          let img;
          if (eq3.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq3.imageData);
          else if (eq3.imageData.startsWith("data:image")) img = await doc.embedJpg(eq3.imageData);
          if (img) {
            const dims = img.scale(1);
            const scale = Math.min(256 / dims.width, 164 / dims.height, 1);
            p3.drawImage(img, { x: 36, y: 92, width: dims.width * scale, height: dims.height * scale });
          }
        } catch (e) { /* ignore */ }
      }
    }

    // --- Total Price Line ---
    p3.drawRectangle({ x: 57, y: PH - 311, width: 360, height: 16, color: rgb(1,1,1) });
    const totalPrefix = `Total Price/cost for the ${countWord} (${eqCount}) equipment shall be  `;
    p3.drawText("\u2022", { x: 57, y: PH - 311, size: 11, font: helv });
    p3.drawText(totalPrefix, { x: 72, y: PH - 311, size: 11, font: helv });
    p3.drawText(`KES ${fmt(totalBP)}`, { x: 72 + helv.widthOfTextAtSize(totalPrefix, 11), y: PH - 311, size: 12, font: helvBold });

    // Payment Method
    p3.drawRectangle({ x: 57, y: PH - 334, width: 300, height: 16, color: rgb(1,1,1) });
    p3.drawText("\u2022", { x: 57, y: PH - 334, size: 11, font: helv });
    p3.drawText(`Payment Method: ${contract.paymentMethod}`, { x: 72, y: PH - 334, size: 11, font: helv });

    // Upfront payment
    p3.drawRectangle({ x: 77, y: PH - 398, width: 200, height: 16, color: rgb(1,1,1) });
    p3.drawText(`KES ${fmt(upfrontPayment)}`, { x: 85, y: PH - 398, size: 11, font: helvBold });

    // Balance
    p3.drawRectangle({ x: 465, y: PH - 420, width: 130, height: 16, color: rgb(1,1,1) });
    p3.drawText(`KES ${fmt(totalShipping)}`, { x: 465, y: PH - 420, size: 11, font: helvBold });

    // ========== TABLE ==========
    // Clear entire table area
    p3.drawRectangle({ x: 55, y: PH - 650, width: 480, height: 190, color: rgb(1,1,1) });

    // Table headers
    const colX = [65, 171, 273, 357];
    const headers = ["EQUIPMENT NAME", "BUYING PRICE", "SHIPPING FEE", "IMPORTERS SERVICE FEE"];
    headers.forEach((h, i) => p3.drawText(h, { x: colX[i], y: PH - 464, size: 11, font: helvBold }));

    // Table rows
    let rowY = PH - 494;
    for (let i = 0; i < contract.equipments.length; i++) {
      const eq = contract.equipments[i];
      const words = eq.name.toUpperCase().split(" ");
      let l1 = words.slice(0, 2).join(" ");
      let l2 = words.slice(2).join(" ");
      if (words.length <= 2) { l1 = words.join(" "); l2 = ""; }

      p3.drawText(l1, { x: colX[0], y: rowY, size: 11, font: helv });
      if (l2) {
        rowY -= 14;
        p3.drawText(l2, { x: colX[0], y: rowY, size: 11, font: helv });
        rowY += 14;
      }

      p3.drawText(fmt(eq.buyingPrice), { x: colX[1], y: rowY, size: 11, font: helv });
      p3.drawText(fmt(eq.shippingFee), { x: colX[2], y: rowY, size: 11, font: helv });
      p3.drawText(fmt(eq.importerFee), { x: colX[3], y: rowY, size: 11, font: helv });

      rowY -= 32;
    }

    // Totals
    rowY -= 5;
    p3.drawText("TOTALS", { x: colX[0], y: rowY, size: 12, font: helvBold });
    p3.drawText(fmt(totalBP), { x: colX[1], y: rowY, size: 12, font: helvBold });
    p3.drawText(fmt(totalShipping), { x: colX[2], y: rowY, size: 12, font: helvBold });
    p3.drawText(fmt(totalImporterFee), { x: colX[3], y: rowY, size: 12, font: helvBold });
  }

  // Page 4 stays exactly as-is from template (signatures, no changes)

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
