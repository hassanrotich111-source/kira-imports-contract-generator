import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Contract, Settings } from "./storage";
import { calcTotals, numberToWord } from "./storage";

const TEMPLATE_URL = "./template/contract-template.pdf";

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export async function generateContractPdf(
  contract: Contract,
  settings: Settings
): Promise<Uint8Array> {
  // Load template from public folder
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error("Template PDF not found");
  const templateBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { totalBP, totalShipping, totalImporterFee, upfrontPayment } =
    calcTotals(contract.equipments);

  const countWord = numberToWord(contract.equipments.length);
  const PH = 841.92; // page height

  // ========== PAGE 1 ==========
  const p1 = pages[0];

  // Date
  const now = new Date();
  const day = now.getDate();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";

  p1.drawRectangle({ x: 320, y: PH - 56, width: 180, height: 16, color: rgb(1,1,1) });
  p1.drawText(`${day}`, { x: 320, y: PH - 56, size: 11, font: helvetica });
  p1.drawText(suffix, { x: 332, y: PH - 53, size: 6.5, font: helvetica });
  p1.drawText(`day of ${months[now.getMonth()]}  ${now.getFullYear()}`, { x: 342, y: PH - 56, size: 11, font: helvetica });

  // Importer details
  const impFields = [
    { label: "Name: ", val: settings.importerName, y: PH - 101 },
    { label: "ID number: ", val: settings.importerId, y: PH - 124 },
    { label: "Mobile No: ", val: settings.importerMobile, y: PH - 147 },
    { label: "Business Name: ", val: settings.importerBusinessName, y: PH - 169 },
  ];
  for (const f of impFields) {
    p1.drawRectangle({ x: 55, y: f.y - 3, width: 250, height: 16, color: rgb(1,1,1) });
    p1.drawText(`${f.label}${f.val}`, { x: 55, y: f.y, size: 11, font: helvetica });
  }

  // Buyer details
  const buyFields = [
    { label: "Name: ", val: contract.buyerName, y: PH - 214 },
    { label: "ID number: ", val: contract.buyerId, y: PH - 237 },
    { label: "Mobile No: ", val: contract.buyerMobile, y: PH - 259 },
    { label: "Business Name: ", val: contract.buyerBusinessName, y: PH - 282 },
  ];
  for (const f of buyFields) {
    p1.drawRectangle({ x: 55, y: f.y - 3, width: 350, height: 16, color: rgb(1,1,1) });
    p1.drawText(`${f.label}${f.val}`, { x: 55, y: f.y, size: 11, font: helvetica });
  }

  // ========== MACHINE DESCRIPTIONS ==========
  const machines: { page: number; titleY: number; imgArea?: { x: number; y: number; w: number; h: number } }[] = [
    { page: 0, titleY: PH - 433, imgArea: { x: 44, y: 623, w: 263, h: 175 } },
    { page: 1, titleY: PH - 57,  imgArea: { x: 43, y: 308, w: 262, h: 204 } },
    { page: 1, titleY: PH - 573, imgArea: { x: 22, y: 605, w: 284, h: 192 } },
    { page: 2, titleY: PH - 57,  imgArea: { x: 36, y: 82,  w: 260, h: 170 } },
  ];

  for (let i = 0; i < contract.equipments.length; i++) {
    const m = machines[i];
    if (!m) break; // only support up to 4 machines in template positions
    const eq = contract.equipments[i];
    const page = pages[m.page];
    if (!page || !eq) continue;

    // Machine label
    const letter = String.fromCharCode(97 + i);
    page.drawRectangle({ x: 22, y: m.titleY - 3, width: 200, height: 16, color: rgb(1,1,1) });
    page.drawText(`${letter})  ${eq.name.toUpperCase()}`, { x: 22, y: m.titleY, size: 11, font: helveticaBold });

    // Bullets
    const bullets = eq.description
      ? eq.description.split("\n").filter((l) => l.trim())
      : [`Quantity: ${eq.quantity}`];

    page.drawRectangle({
      x: 38, y: m.titleY - 20 - bullets.length * 22,
      width: 400, height: bullets.length * 22 + 25,
      color: rgb(1,1,1),
    });

    let by = m.titleY - 22;
    for (const b of bullets) {
      page.drawText("\u2022", { x: 39, y: by, size: 10, font: helvetica });
      page.drawText(b.trim(), { x: 57, y: by, size: 11, font: helvetica });
      by -= 22;
    }

    // Embed image if available
    if (eq.imageData && m.imgArea) {
      try {
        let img;
        if (eq.imageData.startsWith("data:image/png")) {
          img = await pdfDoc.embedPng(eq.imageData);
        } else if (eq.imageData.startsWith("data:image")) {
          img = await pdfDoc.embedJpg(eq.imageData);
        }
        if (img && m.imgArea) {
          const area = m.imgArea;
          const dims = img.scale(1);
          const scale = Math.min(area.w / dims.width, area.h / dims.height);
          const sw = dims.width * scale;
          const sh = dims.height * scale;
          page.drawImage(img, {
            x: area.x + (area.w - sw) / 2,
            y: area.y + (area.h - sh) / 2,
            width: sw,
            height: sh,
          });
        }
      } catch (e) {
        console.error("Image embed error:", e);
      }
    }
  }

  // ========== PAGE 3: PAYMENT & TABLE ==========
  const p3 = pages[2];

  // Total price
  p3.drawRectangle({ x: 258, y: PH - 311, width: 150, height: 16, color: rgb(1,1,1) });
  p3.drawText(formatKES(totalBP), { x: 258, y: PH - 311, size: 12, font: helveticaBold });

  // Equipment count
  p3.drawRectangle({ x: 57, y: PH - 311, width: 200, height: 16, color: rgb(1,1,1) });
  p3.drawText(`Total Price/cost for the ${countWord} equipment:`, { x: 57, y: PH - 311, size: 11, font: helvetica });

  // Payment method
  p3.drawRectangle({ x: 150, y: PH - 334, width: 200, height: 16, color: rgb(1,1,1) });
  p3.drawText(`Payment Method: ${contract.paymentMethod}`, { x: 57, y: PH - 334, size: 11, font: helvetica });

  // Upfront
  p3.drawRectangle({ x: 77, y: PH - 398, width: 200, height: 16, color: rgb(1,1,1) });
  p3.drawText(formatKES(upfrontPayment), { x: 77, y: PH - 398, size: 11, font: helveticaBold });

  // Balance
  p3.drawRectangle({ x: 465, y: PH - 420, width: 150, height: 16, color: rgb(1,1,1) });
  p3.drawText(formatKES(totalShipping), { x: 465, y: PH - 420, size: 11, font: helveticaBold });

  // ===== REDRAW TABLE =====
  p3.drawRectangle({ x: 55, y: PH - 640, width: 420, height: 180, color: rgb(1,1,1) });

  const cols = [65, 171, 273, 357];
  const hy = PH - 464;

  // Headers
  ["EQUIPMENT NAME", "BUYING PRICE", "SHIPPING FEE", "IMPORTERS SERVICE FEE"].forEach((h, i) => {
    p3.drawText(h, { x: cols[i], y: hy, size: 11, font: helveticaBold });
  });

  // Rows
  let ry = hy - 30;
  for (const eq of contract.equipments) {
    const nameWords = eq.name.toUpperCase().split(" ");
    let l1 = nameWords[0] || "";
    let l2 = nameWords.slice(1).join(" ") || "";
    if (nameWords.length > 2 && nameWords.slice(0, 2).join(" ").length < 20) {
      l1 = nameWords.slice(0, 2).join(" ");
      l2 = nameWords.slice(2).join(" ");
    }
    p3.drawText(l1, { x: cols[0], y: ry, size: 11, font: helvetica });
    if (l2) p3.drawText(l2, { x: cols[0], y: ry - 14, size: 11, font: helvetica });

    const bp = eq.buyingPrice || 0;
    const sf = eq.shippingFee || 0;
    const imf = eq.importerFee || 0;
    p3.drawText(bp > 0 ? bp.toLocaleString("en-KE") : "-", { x: cols[1], y: ry, size: 11, font: helvetica });
    p3.drawText(sf > 0 ? sf.toLocaleString("en-KE") : "-", { x: cols[2], y: ry, size: 11, font: helvetica });
    p3.drawText(imf > 0 ? imf.toLocaleString("en-KE") : "-", { x: cols[3], y: ry, size: 11, font: helvetica });
    ry -= 32;
  }

  // Totals
  ry -= 5;
  p3.drawText("TOTALS", { x: cols[0], y: ry, size: 11, font: helveticaBold });
  p3.drawText(totalBP.toLocaleString("en-KE"),     { x: cols[1], y: ry, size: 12, font: helveticaBold });
  p3.drawText(totalShipping.toLocaleString("en-KE"), { x: cols[2], y: ry, size: 12, font: helveticaBold });
  p3.drawText(totalImporterFee.toLocaleString("en-KE"), { x: cols[3], y: ry, size: 12, font: helveticaBold });

  return await pdfDoc.save();
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
