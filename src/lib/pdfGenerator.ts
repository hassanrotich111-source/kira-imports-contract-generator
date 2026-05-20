import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Contract, Settings } from "./storage";
import { calcTotals, numberToWord } from "./storage";

const fmt = (n: number): string =>
  n === 0 ? "" : n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
const kes = (n: number): string => `KES${fmt(n)}`;

export async function generateContractPdf(
  contract: Contract,
  settings: Settings
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const PW = 595;
  // const PH = 842;

  const { totalBP, totalShipping, totalImporterFee, upfrontPayment } =
    calcTotals(contract.equipments);
  const countWord = numberToWord(contract.equipments.length);
  const eqCount = contract.equipments.length;

  // Parse contract date
  const dateParts = contract.contractDate
    ? contract.contractDate.split("-")
    : [];
  const contractYear = dateParts[0]
    ? parseInt(dateParts[0])
    : new Date().getFullYear();
  const contractMonth = dateParts[1]
    ? parseInt(dateParts[1]) - 1
    : new Date().getMonth();
  const contractDay = dateParts[2]
    ? parseInt(dateParts[2])
    : new Date().getDate();

  const day = contractDay;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const suffix =
    day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";

  // ===== PAGE 1 =====
  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MACHINES IMPORT CONTRACT.", PW / 2, 30, { align: "center" });
  doc.setLineWidth(0.8);
  doc.line(155, 33, 440, 33);

  // Date line
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  let dx = 22;
  const dy = 48;
  doc.text("This ", dx, dy);
  dx += doc.getTextWidth("This ");
  doc.setFont("helvetica", "bold");
  doc.text("Machine Importation Contract", dx, dy);
  dx += doc.getTextWidth("Machine Importation Contract");
  doc.setFont("helvetica", "normal");
  doc.text(' ("Agreement") is made on the ', dx, dy);
  dx += doc.getTextWidth(' ("Agreement") is made on the ');
  doc.setFont("helvetica", "bold");
  doc.text(`${day}`, dx, dy);
  dx += doc.getTextWidth(`${day}`);
  doc.setFontSize(7);
  doc.text(suffix, dx + 1, dy - 3);
  dx += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("day of ", dx, dy);
  dx += doc.getTextWidth("day of ");
  doc.setFont("helvetica", "bold");
  doc.text(`${months[contractMonth]} `, dx, dy);
  dx += doc.getTextWidth(`${months[contractMonth]} `);
  doc.text(`${contractYear}`, dx, dy);
  dx += doc.getTextWidth(`${contractYear}`);
  doc.setFont("helvetica", "normal");
  doc.text(", between:", dx, dy);

  // Importer
  doc.setFont("helvetica", "bold");
  doc.text("1.", 22, 70);
  doc.text("Importer:", 33, 70);

  doc.setFont("helvetica", "normal");
  doc.text("Name: ", 21, 92);
  const impNameW = doc.getTextWidth(settings.importerName);
  doc.text(settings.importerName, 55, 92);
  doc.setLineWidth(0.5);
  doc.line(55, 94, 55 + impNameW, 94);

  doc.text("ID number: ", 22, 114);
  const impIdW = doc.getTextWidth(settings.importerId);
  doc.text(settings.importerId, 82, 114);
  doc.line(82, 116, 82 + impIdW, 116);

  doc.text("Mobile No: ", 22, 136);
  const impMobW = doc.getTextWidth(settings.importerMobile);
  doc.text(settings.importerMobile, 82, 136);
  doc.line(82, 138, 82 + impMobW, 138);

  doc.text("Business Name: ", 22, 158);
  const impBizW = doc.getTextWidth(settings.importerBusinessName);
  doc.text(settings.importerBusinessName, 108, 158);
  doc.line(108, 160, 108 + impBizW, 160);

  // Buyer
  doc.setFont("helvetica", "bold");
  doc.text("2.", 22, 180);
  doc.text("Buyer/Customer:", 33, 180);

  doc.setFont("helvetica", "normal");
  doc.text("Name: ", 21, 202);
  const bNameW = doc.getTextWidth(contract.buyerName);
  doc.text(contract.buyerName, 55, 202);
  doc.line(55, 204, 55 + bNameW, 204);

  doc.text("ID number: ", 22, 224);
  const bIdW = doc.getTextWidth(contract.buyerId);
  doc.text(contract.buyerId, 82, 224);
  doc.line(82, 226, 82 + bIdW, 226);

  doc.text("Mobile No: ", 22, 246);
  const bMobW = doc.getTextWidth(contract.buyerMobile);
  doc.text(contract.buyerMobile, 82, 246);
  doc.line(82, 248, 82 + bMobW, 248);

  doc.text("Business Name: ", 22, 268);
  const bBizW = doc.getTextWidth(contract.buyerBusinessName);
  doc.text(contract.buyerBusinessName, 108, 268);
  doc.line(108, 270, 108 + bBizW, 270);

  // Together line
  let tx = 22;
  doc.text("Together referred to as ", tx, 290);
  tx += doc.getTextWidth("Together referred to as ");
  doc.setFont("helvetica", "bold");
  doc.text('"the Parties."', tx, 290);

  // Purpose
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1.", 22, 330);
  doc.text("Purpose of the Agreement", 36, 330);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    "The purpose of this Agreement is to outline the terms under which the Importer agrees to",
    22,
    352
  );
  doc.text(
    "import, ship, customs clear and supply the following machine(s) to the buyer/customer.",
    22,
    370
  );

  // Machines heading
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2.", 22, 398);
  doc.text("Description of the Machines", 36, 398);

  // Dynamic machines
  let my = 415;
  for (let i = 0; i < contract.equipments.length; i++) {
    const eq = contract.equipments[i];
    const letter = String.fromCharCode(97 + i);
    const bullets = eq.description
      ? eq.description.split("\n").filter((l) => l.trim())
      : [`Quantity: ${eq.quantity}`];

    const mHeight =
      25 + bullets.length * 16 + (eq.imageData ? 160 : 0);

    if (my + mHeight > 780) {
      doc.addPage();
      my = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${letter})`, 22, my);
    doc.text(eq.name.toUpperCase(), 45, my);
    my += 16;

    doc.setFont("helvetica", "normal");
    for (const line of bullets) {
      doc.text("\u2022", 39, my);
      doc.text(line.trim(), 57, my);
      my += 16;
    }

    if (eq.imageData) {
      try {
        const imgType = eq.imageData.includes("image/png")
          ? "PNG"
          : "JPEG";
        const base64 = eq.imageData.split(",")[1];
        doc.addImage(base64, imgType, 44, my, 200, 130);
        my += 145;
      } catch (e) {
        /* ignore */
      }
    }
    my += 10;
  }

  // ===== PAGE 2/3: TERMS + TABLE =====
  doc.addPage();

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("3.", 22, 46);
  doc.text("Purchase Price and Payment Terms", 36, 46);

  // Bullet 1
  doc.setFont("helvetica", "normal");
  doc.text("\u2022", 39, 66);
  const totalPrefix = `Total Price/cost for the ${countWord} (${eqCount}) equipment: `;
  doc.text(totalPrefix, 57, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(kes(totalBP), 57 + doc.getTextWidth(totalPrefix), 66);

  // Bullet 2
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("\u2022", 39, 88);
  doc.text(`Payment Method: ${contract.paymentMethod}`, 57, 88);

  // Bullet 3
  doc.text("\u2022", 39, 110);
  doc.text("Payment Schedule:", 57, 110);

  // o upfront
  doc.text("o", 76, 132);
  doc.text(
    "Upfront payment for the machines buying price cost + importers service fee on",
    85,
    132
  );
  const upfrontLine = `contract signing standing at ${kes(upfrontPayment)}.`;
  doc.text(upfrontLine, 85, 148);

  // o balance
  doc.text("o", 76, 172);
  doc.text(
    "Balance of shipping fee upon equipment arrival, at the point of collection",
    85,
    172
  );
  doc.text("standing at", 85, 188);
  doc.setFont("helvetica", "bold");
  doc.text(kes(totalShipping), 160, 188);
  doc.setFont("helvetica", "normal");
  doc.text(".", 160 + doc.getTextWidth(kes(totalShipping)), 188);

  // Bullet 4
  doc.text("\u2022", 39, 210);
  doc.text("Cost as outlined in the below table:", 57, 210);

  // ===== AUTOTABLE =====
  const tableBody = contract.equipments.map((eq) => [
    eq.name.toUpperCase(),
    kes(eq.buyingPrice),
    kes(eq.shippingFee),
    kes(eq.importerFee),
  ]);

  autoTable(doc, {
    startY: 225,
    head: [["EQUIPMENT NAME", "BUYING PRICE", "SHIPPING FEE", "IMPORTERS SERVICE FEE"]],
    body: tableBody,
    foot: [["TOTALS", kes(totalBP), kes(totalShipping), kes(totalImporterFee)]],
    theme: "grid",
    styles: {
      fontSize: 11,
      font: "helvetica",
      cellPadding: 6,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "left",
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: "bold" },
      1: { cellWidth: 85, halign: "right" },
      2: { cellWidth: 85, halign: "right" },
      3: { cellWidth: 110, halign: "right" },
    },
    margin: { left: 55, right: 55 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Cost Table (continued)", 22, 30);
      }
    },
  });

  // Get final Y after table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 400;

  // ===== 4. Incoterms =====
  let sy = finalY + 30;
  if (sy > 730) {
    doc.addPage();
    sy = 50;
  }
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("4.", 22, sy);
  doc.text("Incoterms / Delivery Terms", 36, sy);
  sy += 20;
  doc.setFont("helvetica", "normal");
  doc.text("\u2022", 39, sy);
  doc.text("Lead-times: 35-45 days", 57, sy);
  sy += 18;
  doc.text("\u2022", 39, sy);
  doc.text(
    "Shipping Method: via sea except for the handheld printer that's by air.",
    57,
    sy
  );
  sy += 18;
  doc.text("\u2022", 39, sy);
  doc.text(
    "Collection terms: self collection at the Mombasa Road warehouse.",
    57,
    sy
  );

  // 5. Inspection
  sy += 35;
  if (sy > 750) {
    doc.addPage();
    sy = 50;
  }
  doc.setFont("helvetica", "bold");
  doc.text("5.", 22, sy);
  doc.text("Inspection and Testing", 36, sy);
  sy += 20;
  doc.setFont("helvetica", "normal");
  doc.text("\u2022", 39, sy);
  doc.text(
    "Pre-shipment inspection and testing (Yes/No): Yes",
    57,
    sy
  );
  sy += 18;
  doc.text("\u2022", 39, sy);
  doc.text(
    "Inspection conducted by: Importer in liaison with the Chinese equipment manufacturer/supplier",
    57,
    sy
  );

  // 6. Risk
  sy += 35;
  if (sy > 760) {
    doc.addPage();
    sy = 50;
  }
  doc.setFont("helvetica", "bold");
  doc.text("6.", 22, sy);
  doc.text("Risk and Insurance", 36, sy);
  sy += 20;
  doc.setFont("helvetica", "normal");
  doc.text(
    "Insurance responsibility during shipping and risk of loss or damage passes to the Importer according to the chosen",
    22,
    sy
  );
  sy += 14;
  doc.text(
    "Incoterm until the equipment is collected by the buyer.",
    23,
    sy
  );

  // ===== PAGE 4: 7-10 =====
  doc.addPage();

  doc.setFont("helvetica", "bold");
  doc.text("7.", 22, 46);
  doc.text("Dispute Resolution", 36, 46);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Any disputes arising from this Agreement shall be resolved through:",
    22,
    68
  );
  doc.text("\u2022  Negotiation", 39, 88);
  doc.text("\u2022  Mediation/Arbitration", 39, 108);
  doc.text("\u2022  Courts of Kenya", 39, 128);

  doc.setFont("helvetica", "bold");
  doc.text("8.", 22, 165);
  doc.text("Termination", 36, 165);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Either party may terminate this Agreement if the other party:",
    22,
    185
  );
  doc.text("\u2022  breaches material terms,", 39, 205);
  doc.text("\u2022  fails to deliver/pay within agreed timelines,", 39, 225);
  doc.text("\u2022  becomes insolvent.", 39, 245);
  doc.text(
    "Monies already paid to the importer shall be refunded in full upon:",
    22,
    270
  );
  doc.text(
    "Failure to deliver the equipment as ordered, and of the specifications as ordered, and as",
    22,
    290
  );
  doc.text(
    "per the agreed lead times with any naturally unavoidable delays, shall be communicated to",
    22,
    305
  );
  doc.text("the buyer immediately for alignment.", 23, 320);

  doc.setFont("helvetica", "bold");
  doc.text("9.", 22, 355);
  doc.text("Governing Law", 36, 355);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This Agreement shall be governed by the laws of Kenya.",
    22,
    375
  );

  doc.setFont("helvetica", "bold");
  doc.text("10.", 22, 415);
  doc.text("Signatures", 43, 415);

  doc.text("Importer", 22, 445);
  doc.setFont("helvetica", "normal");
  doc.text("Name: ______________________________", 22, 465);
  doc.text("Signature: __________________________", 22, 485);
  doc.text("Date: ______________________________", 22, 505);

  doc.setFont("helvetica", "bold");
  doc.text("Buyer", 22, 540);
  doc.setFont("helvetica", "normal");
  doc.text("Name: ______________________________", 22, 560);
  doc.text("Signature: __________________________", 22, 580);
  doc.text("Date: ______________________________", 22, 600);

  doc.setFont("helvetica", "bold");
  doc.text("Buyer's referee/witness", 22, 635);
  doc.setFont("helvetica", "normal");
  doc.text("Name: ______________________________", 22, 655);
  doc.text("Signature:  __________________________", 22, 675);
  doc.text("Date: ______________________________", 22, 695);
  doc.text("ID No.  ______________________________", 22, 720);

  return new Uint8Array(doc.output("arraybuffer"));
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
