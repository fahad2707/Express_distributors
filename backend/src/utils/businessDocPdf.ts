import PDFDocument from 'pdfkit';
import {
  PDF_MARGIN,
  PDF_PAGE,
  PDF_CONTENT_WIDTH,
  PDF_TEAL,
  PDF_GRAY,
  PDF_MUTED,
  PDF_BORDER,
  PDF_LIGHT,
  loadCompanyInfo,
  pdfDocumentToBuffer,
  drawCompanyHeader,
} from './pdfHelpers';

type LineItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  productId?: string;
};

type DocMeta = { label: string; value: string }[];

export async function buildBusinessDocumentPdf(opts: {
  title: string;
  subtitle?: string;
  partyLabel: string;
  partyName: string;
  partyLines?: string[];
  meta: DocMeta;
  items: LineItem[];
  totals: { label: string; value: string; bold?: boolean }[];
  itemColumns?: { showProductId?: boolean };
}): Promise<Buffer> {
  const company = await loadCompanyInfo();
  const doc = new PDFDocument({ margin: PDF_MARGIN, size: 'A4', bufferPages: true });
  const bufferPromise = pdfDocumentToBuffer(doc);

  let y = drawCompanyHeader(doc, company, {
    rightTitle: opts.title,
    rightSubtitle: opts.subtitle,
  });

  const colW = (PDF_CONTENT_WIDTH - 24) / 2;
  const leftX = PDF_MARGIN;
  const rightX = PDF_MARGIN + colW + 24;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PDF_TEAL);
  doc.text('FROM', leftX, y);
  doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED);
  let ly = y + 14;
  doc.text(company.name, leftX, ly, { width: colW });
  ly += 12;
  doc.text(`${company.address}, ${company.cityLine}`, leftX, ly, { width: colW });
  ly += 12;
  doc.text(`Tel: ${company.phone} · ${company.email}`, leftX, ly, { width: colW });

  doc.font('Helvetica-Bold').fontSize(9).fillColor(PDF_TEAL);
  doc.text(opts.partyLabel.toUpperCase(), rightX, y);
  doc.font('Helvetica').fontSize(10).fillColor(PDF_GRAY);
  let ry = y + 14;
  doc.text(opts.partyName || '—', rightX, ry, { width: colW });
  ry += 14;
  doc.fontSize(9).fillColor(PDF_MUTED);
  for (const line of opts.partyLines || []) {
    doc.text(line, rightX, ry, { width: colW });
    ry += 11;
  }

  y = Math.max(ly, ry) + 16;
  opts.meta.forEach((row) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(PDF_GRAY);
    doc.text(`${row.label}:`, leftX, y, { continued: true, width: 90 });
    doc.font('Helvetica').fillColor('#000000').text(` ${row.value}`, { width: PDF_CONTENT_WIDTH - 90 });
    y += 13;
  });

  y += 8;
  doc.strokeColor(PDF_BORDER).moveTo(PDF_MARGIN, y).lineTo(PDF_PAGE.width - PDF_MARGIN, y).stroke();
  y += 14;

  const showId = opts.itemColumns?.showProductId !== false;
  const rowH = 22;
  const tableW = PDF_CONTENT_WIDTH;
  const col = {
    qty: PDF_MARGIN,
    id: PDF_MARGIN + 34,
    name: showId ? PDF_MARGIN + 92 : PDF_MARGIN + 40,
    unit: PDF_PAGE.width - PDF_MARGIN - 118,
    total: PDF_PAGE.width - PDF_MARGIN - 56,
  };

  doc.fillColor(PDF_TEAL).rect(PDF_MARGIN, y, tableW, rowH).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('QTY', col.qty + 4, y + 7);
  if (showId) doc.text('ID', col.id, y + 7);
  doc.text('DESCRIPTION', col.name, y + 7);
  doc.text('UNIT', col.unit, y + 7, { width: 50, align: 'right' });
  doc.text('AMOUNT', col.total, y + 7, { width: 52, align: 'right' });
  y += rowH;

  doc.font('Helvetica').fontSize(8).fillColor('#000000');
  opts.items.forEach((item, idx) => {
    if (y > PDF_PAGE.height - PDF_MARGIN - 100) {
      doc.addPage();
      y = PDF_MARGIN;
    }
    if (idx % 2 === 1) doc.fillColor(PDF_LIGHT).rect(PDF_MARGIN, y, tableW, rowH).fill();
    doc.fillColor('#000000');
    doc.text(String(item.qty), col.qty + 4, y + 7);
    if (showId) doc.text((item.productId || '—').slice(0, 10), col.id, y + 7, { width: 50 });
    doc.text(item.name, col.name, y + 7, { width: col.unit - col.name - 6 });
    doc.text(item.unitPrice.toFixed(2), col.unit, y + 7, { width: 50, align: 'right' });
    doc.text(item.lineTotal.toFixed(2), col.total, y + 7, { width: 52, align: 'right' });
    y += rowH;
  });

  y += 10;
  const sumX = PDF_PAGE.width - PDF_MARGIN - 180;
  doc.fillColor('#f0fdfa').rect(sumX, y, 180, 14 + opts.totals.length * 14).fill();
  doc.strokeColor(PDF_TEAL).rect(sumX, y, 180, 14 + opts.totals.length * 14).stroke();
  let sy = y + 8;
  opts.totals.forEach((t) => {
    doc.font(t.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(t.bold ? 11 : 9).fillColor(t.bold ? PDF_TEAL : PDF_MUTED);
    doc.text(t.label, sumX + 10, sy, { width: 80 });
    doc.fillColor('#000000').text(t.value, sumX + 90, sy, { width: 80, align: 'right' });
    sy += t.bold ? 18 : 14;
  });

  doc.end();
  return bufferPromise;
}
