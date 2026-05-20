import { PDFDocument, StandardFonts } from "pdf-lib";
import type { Contract, Settings } from "./storage";
import { calcTotals, numberToWord } from "./storage";

const PW = 595.32;
const PH = 841.92;

function fmt(n: number): string {
  return n === 0 ? "" : n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
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

  // ===== PAGE 1 =====
  let page = doc.addPage([PW, PH]);

  // Title
  const title = "MACHINES IMPORTATION CONTRACT.";
  const tw = bold.widthOfTextAtSize(title, 16);
  page.drawText(title, { x: (PW - tw) / 2, y: 24.9, size: 16, font: bold });

  // Date line
  page.drawText('This ', { x: 22.3, y: 44.9, size: 11, font: reg });
  page.drawText('Machine Importation Contract', { x: 42.8, y: 44.9, size: 11, font: bold });
  page.drawText(' ("Agreement") is made on the ', { x: 181.3, y: 44.9, size: 11, font: reg });
  page.drawText(`${day}`, { x: 320.1, y: 44.9, size: 11, font: bold });
  page.drawText(suffix, { x: 331.3, y: 44.8, size: 6.5, font: bold });
  page.drawText('day of ', { x: 339.5, y: 44.9, size: 11, font: reg });
  page.drawText(`${months[now.getMonth()]} `, { x: 369.4, y: 44.9, size: 11, font: bold });
  page.drawText(` ${now.getFullYear()}`, { x: 391.9, y: 44.9, size: 11, font: bold });
  page.drawText(', between:   ', { x: 416.7, y: 44.9, size: 11, font: reg });

  // 1. Importer
  page.drawText("1.", { x: 21.6, y: 67.4, size: 11, font: bold });
  page.drawText("Importer: ", { x: 33.1, y: 67.4, size: 11, font: bold });
  page.drawText(`Name: ${settings.importerName}   `, { x: 20.9, y: 89.9, size: 11, font: reg });
  page.drawText(`ID number: ${settings.importerId}        `, { x: 21.6, y: 112.3, size: 11, font: reg });
  page.drawText(`Mobile No: ${settings.importerMobile}   `, { x: 21.6, y: 134.9, size: 11, font: reg });
  page.drawText(`Business Name: ${settings.importerBusinessName}   `, { x: 21.6, y: 157.5, size: 11, font: reg });

  // 2. Buyer
  page.drawText("2.", { x: 21.6, y: 180.0, size: 11, font: bold });
  page.drawText("Buyer/Customer: ", { x: 33.1, y: 180.0, size: 11, font: bold });
  page.drawText(`Name: ${contract.buyerName}  `, { x: 20.9, y: 202.6, size: 11, font: reg });
  page.drawText(`ID number: ${contract.buyerId}   `, { x: 21.6, y: 224.9, size: 11, font: reg });
  page.drawText(`Mobile No: ${contract.buyerMobile}   `, { x: 22.3, y: 247.6, size: 11, font: reg });
  page.drawText(`Business Name: ${contract.buyerBusinessName}  `, { x: 20.9, y: 270.2, size: 11, font: reg });

  // Together line
  page.drawText('Together referred to as ', { x: 22.3, y: 292.5, size: 11, font: reg });
  page.drawText('"the Parties."', { x: 127.2, y: 292.5, size: 11, font: bold });

  // 1. Purpose
  page.drawText("1. Purpose of the Agreement ", { x: 21.6, y: 339.5, size: 12, font: bold });
  page.drawText("The purpose of this Agreement is to outline the terms under which the Importer agrees to import, ship, customs clear and ",
    { x: 22.3, y: 361.0, size: 11, font: reg });
  page.drawText("supply the following machine(s) to the buyer/customer.   ",
    { x: 22.8, y: 379.1, size: 11, font: reg });

  // 2. Description
  page.drawText("2. Description of the Machines ", { x: 21.6, y: 400.5, size: 12, font: bold });

  // Machine a)
  const eq0 = contract.equipments[0];
  if (eq0) {
    page.drawText("    a) ", { x: 21.6, y: 422.0, size: 11, font: bold });
    page.drawText(eq0.name.toUpperCase(), { x: 21.6 + bold.widthOfTextAtSize("    a) ", 11), y: 422.0, size: 11, font: bold });

    const lines = eq0.description ? eq0.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq0.quantity}`];
    let by = 443.8;
    for (const line of lines) {
      page.drawText("\u2022 ", { x: 38.9, y: by, size: 10, font: reg });
      page.drawText(line.trim(), { x: 56.9, y: by + 0.7, size: 11, font: reg });
      by += 22.6;
    }

    // Image
    if (eq0.imageData) {
      try {
        let img;
        if (eq0.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq0.imageData);
        else if (eq0.imageData.startsWith("data:image")) img = await doc.embedJpg(eq0.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(263 / dims.width, 174 / dims.height, 1);
          page.drawImage(img, { x: 43.8, y: 623.0, width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // ===== PAGE 2 =====
  page = doc.addPage([PW, PH]);

  // Machine b)
  const eq1 = contract.equipments[1];
  if (eq1) {
    page.drawText("b) ", { x: 39.6, y: 46.0, size: 11, font: reg });
    page.drawText(` ${eq1.name.toUpperCase()}  `, { x: 51.2, y: 46.0, size: 11, font: bold });

    const lines = eq1.description ? eq1.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq1.quantity}`];
    let by = 73.8;
    for (const line of lines) {
      page.drawText("\u2022 ", { x: 50.4, y: by, size: 10, font: reg });
      page.drawText(line.trim(), { x: 57.6, y: by + 0.7, size: 11, font: reg });
      by += 21.6;
    }

    if (eq1.imageData) {
      try {
        let img;
        if (eq1.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq1.imageData);
        else if (eq1.imageData.startsWith("data:image")) img = await doc.embedJpg(eq1.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(263 / dims.width, 204 / dims.height, 1);
          page.drawImage(img, { x: 42.6, y: 308.2, width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // Machine c)
  const eq2 = contract.equipments[2];
  if (eq2) {
    page.drawText("     c) ", { x: 21.6, y: 562.3, size: 11, font: reg });
    page.drawText(`${eq2.name.toUpperCase()}   `, { x: 44.5, y: 562.3, size: 11, font: bold });

    const lines = eq2.description ? eq2.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq2.quantity}`];
    let by = 584.0;
    for (const line of lines) {
      page.drawText("\u2022 ", { x: 38.9, y: by, size: 10, font: reg });
      page.drawText(line.trim(), { x: 56.9, y: by + 0.7, size: 11, font: reg });
      by += 22.6;
    }

    if (eq2.imageData) {
      try {
        let img;
        if (eq2.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq2.imageData);
        else if (eq2.imageData.startsWith("data:image")) img = await doc.embedJpg(eq2.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(284 / dims.width, 191 / dims.height, 1);
          page.drawImage(img, { x: 22.3, y: 605.2, width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // ===== PAGE 3 =====
  page = doc.addPage([PW, PH]);

  // Machine d)
  const eq3 = contract.equipments[3];
  if (eq3) {
    page.drawText("d)  ", { x: 22.3, y: 46.2, size: 11, font: reg });
    page.drawText(eq3.name.toUpperCase(), { x: 36.5, y: 46.2, size: 11, font: bold });

    const lines = eq3.description ? eq3.description.split("\n").filter(l => l.trim()) : [`Quantity: ${eq3.quantity}`];
    let by = 68.0;
    for (const line of lines) {
      page.drawText("\u2022 ", { x: 38.9, y: by, size: 10, font: reg });
      page.drawText(line.trim(), { x: 56.9, y: by + 0.7, size: 11, font: reg });
      by += 22.6;
    }

    if (eq3.imageData) {
      try {
        let img;
        if (eq3.imageData.startsWith("data:image/png")) img = await doc.embedPng(eq3.imageData);
        else if (eq3.imageData.startsWith("data:image")) img = await doc.embedJpg(eq3.imageData);
        if (img) {
          const dims = img.scale(1);
          const scale = Math.min(259 / dims.width, 169 / dims.height, 1);
          page.drawImage(img, { x: 35.7, y: 81.9, width: dims.width * scale, height: dims.height * scale });
        }
      } catch (e) { /* ignore */ }
    }
  }

  // 3. Purchase Price and Payment Terms
  page.drawText("3. Purchase Price and Payment Terms   ", { x: 21.6, y: 276.3, size: 11, font: bold });

  // Bullet 1 - Total Price
  page.drawText("\u2022 ", { x: 38.9, y: 299.0, size: 10, font: reg });
  page.drawText(`Total Price/cost for the ${countWord} (${eqCount}) equipment: `, { x: 56.9, y: 299.7, size: 11, font: reg });
  page.drawText("KES ", { x: 237.9, y: 299.7, size: 11, font: bold });
  page.drawText(`${fmt(totalBP)} `, { x: 256.9, y: 299.0, size: 12, font: bold });

  // Bullet 2 - Payment Method
  page.drawText("\u2022 ", { x: 38.9, y: 321.9, size: 10, font: reg });
  page.drawText(`Payment Method: ${contract.paymentMethod}   `, { x: 56.9, y: 322.6, size: 11, font: reg });

  // Bullet 3 - Payment Schedule
  page.drawText("\u2022 ", { x: 38.9, y: 344.6, size: 10, font: reg });
  page.drawText("Payment Schedule:   ", { x: 56.9, y: 345.3, size: 11, font: reg });

  // Sub-item o - Upfront
  page.drawText("o", { x: 76.3, y: 368.0, size: 10, font: reg });
  page.drawText("Upfront payment for the machines buying price cost + importers service fee on contract signing standing at ",
    { x: 85.0, y: 368.0, size: 11, font: reg });
  page.drawText(`KES ${fmt(upfrontPayment)}`, { x: 76.8, y: 386.4, size: 11, font: bold });
  page.drawText(" . ", { x: 76.8 + bold.widthOfTextAtSize(`KES ${fmt(upfrontPayment)}`, 11), y: 386.4, size: 11, font: reg });

  // Sub-item o - Balance
  page.drawText("o", { x: 76.3, y: 409.0, size: 10, font: reg });
  page.drawText("Balance of shipping fee upon equipment arrival, at the point of collection standing at ",
    { x: 85.1, y: 409.0, size: 11, font: reg });
  page.drawText(`KES ${fmt(totalShipping)}`, { x: 465.3, y: 409.0, size: 11, font: bold });
  page.drawText(".   ", { x: 520.7, y: 409.0, size: 11, font: reg });

  // Bullet 4 - Cost table intro
  page.drawText("\u2022 ", { x: 38.9, y: 430.9, size: 10, font: reg });
  page.drawText("Cost as outlined in the below table:   ", { x: 56.9, y: 431.6, size: 11, font: reg });

  // Table headers
  page.drawText("EQUIPMENT NAME ", { x: 64.5, y: 463.6, size: 11, font: bold });
  page.drawText("BUYING PRICE ", { x: 170.3, y: 463.6, size: 11, font: bold });
  page.drawText("SHIPPING FEE ", { x: 272.7, y: 463.6, size: 11, font: bold });
  page.drawText("IMPORTERS SERVICE FEE ", { x: 356.5, y: 463.6, size: 11, font: bold });

  // Table rows
  const rows: { name: string; bp: string; ship: string; fee: string }[] = [];
  for (const eq of contract.equipments) {
    rows.push({
      name: eq.name.toUpperCase(),
      bp: fmt(eq.buyingPrice),
      ship: fmt(eq.shippingFee),
      fee: fmt(eq.importerFee),
    });
  }

  // Row positions exactly from template
  const rowYs = [494.1, 526.1, 556.6, 588.7];
  for (let i = 0; i < rows.length && i < 4; i++) {
    const r = rows[i];
    const ry = rowYs[i];
    const words = r.name.split(" ");
    if (words.length > 1 && r.name.length > 12) {
      const mid = Math.ceil(words.length / 2);
      page.drawText(words.slice(0, mid).join(" ") + " ", { x: 64.5, y: ry, size: 11, font: bold });
      page.drawText(words.slice(mid).join(" ") + " ", { x: 64.5, y: ry + 14.5, size: 11, font: bold });
    } else {
      page.drawText(r.name + "  ", { x: 64.5, y: ry, size: 11, font: bold });
    }
    page.drawText(r.bp + " ", { x: 170.9, y: ry, size: 11, font: reg });
    page.drawText(r.ship + " ", { x: 272.7, y: ry, size: 11, font: reg });
    // Format fee with leading spaces to match original
    const feeStr = r.fee === "" ? "-" : r.fee;
    page.drawText(feeStr + " ", { x: 356.4, y: ry, size: 11, font: r.fee === "" ? bold : reg });
  }

  // Totals
  page.drawText("TOTALS  ", { x: 64.5, y: 613.7, size: 11, font: bold });
  page.drawText(`${fmt(totalBP)} `, { x: 170.2, y: 613.9, size: 12, font: bold });
  page.drawText(`${fmt(totalShipping)} `, { x: 272.7, y: 613.9, size: 12, font: bold });
  page.drawText(`${fmt(totalImporterFee)} `, { x: 356.5, y: 613.9, size: 12, font: bold });

  // 4. Incoterms
  page.drawText("4. Incoterms / Delivery Terms   ", { x: 21.6, y: 664.2, size: 11, font: bold });
  page.drawText("\u2022 ", { x: 38.9, y: 686.0, size: 10, font: reg });
  page.drawText("Lead-times: 35-45 days   ", { x: 56.9, y: 686.7, size: 11, font: reg });
  page.drawText("\u2022 ", { x: 38.9, y: 708.6, size: 10, font: reg });
  page.drawText("Shipping Method: via sea except for the handheld printer that's by air.   ", { x: 56.9, y: 709.3, size: 11, font: reg });
  page.drawText("\u2022 ", { x: 38.9, y: 731.1, size: 10, font: reg });
  page.drawText("Collection terms: self-collection at the Mombasa Road warehouse.   ", { x: 56.9, y: 731.9, size: 11, font: reg });

  // 5. Inspection
  page.drawText("5. Inspection and Testing   ", { x: 21.6, y: 754.4, size: 11, font: bold });
  page.drawText("\u2022 ", { x: 38.9, y: 776.2, size: 10, font: reg });
  page.drawText("Pre-shipment inspection and testing (Yes/No): Yes   ", { x: 56.9, y: 777.0, size: 11, font: reg });
  page.drawText("\u2022 ", { x: 38.9, y: 798.8, size: 10, font: reg });
  page.drawText("Inspection conducted by: Importer in liaison with the Chinese equipment manufacturer/supplier   ",
    { x: 56.9, y: 799.6, size: 11, font: reg });

  // ===== PAGE 4 =====
  page = doc.addPage([PW, PH]);

  // 6. Risk and Insurance
  page.drawText("6. Risk and Insurance   ", { x: 21.6, y: 46.0, size: 11, font: bold });
  page.drawText("Insurance responsibility during shipping and risk of loss or damage passes to the Importer according to the chosen ",
    { x: 22.3, y: 68.5, size: 11, font: reg });
  page.drawText("Incoterm until the equipment is collected by the buyer.   ",
    { x: 22.8, y: 82.9, size: 11, font: reg });

  // 7. Dispute Resolution
  page.drawText("7. Dispute Resolution   ", { x: 21.6, y: 128.1, size: 11, font: bold });
  page.drawText("Any disputes arising from this Agreement shall be resolved through:   ",
    { x: 22.3, y: 150.6, size: 11, font: reg });
  const disputeItems = [
    { y: 172.4, text: "Negotiation   " },
    { y: 195.0, text: "Mediation/Arbitration   " },
    { y: 217.7, text: "Courts of  Kenya    " },
  ];
  for (const item of disputeItems) {
    page.drawText("\u2022 ", { x: 38.9, y: item.y, size: 10, font: reg });
    page.drawText(item.text, { x: 56.9, y: item.y + 0.7, size: 11, font: reg });
  }

  // 8. Termination
  page.drawText("8. Termination   ", { x: 21.6, y: 255.4, size: 11, font: bold });
  page.drawText("Either party may terminate this Agreement if the other party:   ",
    { x: 22.3, y: 278.0, size: 11, font: reg });
  const termItems = [
    { y: 299.8, text: "breaches material terms,   " },
    { y: 322.4, text: "fails to deliver/pay within agreed timelines,   " },
    { y: 345.0, text: "becomes insolvent.   " },
  ];
  for (const item of termItems) {
    page.drawText("\u2022 ", { x: 38.9, y: item.y, size: 10, font: reg });
    page.drawText(item.text, { x: 56.9, y: item.y + 0.7, size: 11, font: reg });
  }
  page.drawText("Monies already paid to the importer shall be refunded in full upon: ",
    { x: 22.3, y: 368.3, size: 11, font: reg });
  page.drawText("Failure to deliver the equipment as ordered, and of the specifications as ordered, and as per the agreed lead times with ",
    { x: 22.3, y: 390.9, size: 11, font: reg });
  page.drawText("any naturally unavoidable delays, shall be communicated to the buyer immediately for alignment.   ",
    { x: 22.8, y: 405.3, size: 11, font: reg });

  // 9. Governing Law
  page.drawText("9. Governing Law ", { x: 21.6, y: 427.8, size: 11, font: bold });
  page.drawText("This Agreement shall be governed by the laws of Kenya.   ",
    { x: 22.3, y: 450.4, size: 11, font: reg });

  // 10. Signatures
  page.drawText("10. Signatures Importer", { x: 21.6, y: 495.2, size: 11, font: bold });
  page.drawText("Name: ______________________________   ", { x: 22.3, y: 509.7, size: 11, font: reg });
  page.drawText("Signature: __________________________   ", { x: 22.3, y: 524.2, size: 11, font: reg });
  page.drawText("Date: ______________________________   ", { x: 22.3, y: 538.7, size: 11, font: reg });

  page.drawText("Buyer", { x: 21.6, y: 561.3, size: 11, font: bold });
  page.drawText("Name: ______________________________   ", { x: 22.3, y: 575.8, size: 11, font: reg });
  page.drawText("Signature: __________________________   ", { x: 22.3, y: 590.2, size: 11, font: reg });
  page.drawText("Date: ______________________________   ", { x: 22.3, y: 604.7, size: 11, font: reg });

  page.drawText("Buyer's referee/witness", { x: 21.6, y: 627.3, size: 11, font: bold });
  page.drawText("Name: ______________________________   ", { x: 22.3, y: 641.9, size: 11, font: reg });
  page.drawText("Signature:  ", { x: 21.6, y: 657.0, size: 11, font: reg });
  page.drawText("__________________________  ", { x: 90.0, y: 657.0, size: 11, font: reg });
  page.drawText("Date: ______________________________   ", { x: 22.8, y: 671.4, size: 11, font: reg });
  page.drawText("ID No.  ______________________________ ", { x: 21.6, y: 694.1, size: 11, font: reg });

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
