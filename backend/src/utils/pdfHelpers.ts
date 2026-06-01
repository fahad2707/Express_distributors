import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import StoreSettings from '../models/StoreSettings';

export const PDF_PAGE = { width: 595, height: 842 };
export const PDF_MARGIN = 48;
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGIN * 2;
export const PDF_TEAL = '#0f766e';
export const PDF_GRAY = '#374151';
export const PDF_MUTED = '#6b7280';
export const PDF_BORDER = '#e5e7eb';
export const PDF_LIGHT = '#f9fafb';

export const DEFAULT_COMPANY = {
  name: 'Express Distributors Inc.',
  address: '511 W Germantown Pike',
  cityLine: 'Plymouth Meeting, PA 19462-1303',
  phone: '+1 (267) 469-2156',
  email: 'expressinc511@gmail.com',
  website: 'www.expressdistributors.com',
};

export type CompanyInfo = typeof DEFAULT_COMPANY & { logoPath?: string };

export async function loadCompanyInfo(): Promise<CompanyInfo> {
  const settings = (await StoreSettings.findOne().lean().catch(() => null)) as {
    business_name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    website?: string;
    logo_url?: string;
  } | null;

  const uploadsRoot = path.join(__dirname, '../../uploads');
  let logoPath = resolveLogoPath(settings?.logo_url, uploadsRoot);

  const addressParts = [settings?.address, settings?.city, settings?.state, settings?.zip].filter(Boolean);
  const cityLine: string =
    addressParts.length >= 2
      ? addressParts.slice(1).join(', ')
      : DEFAULT_COMPANY.cityLine;

  return {
    name: settings?.business_name || DEFAULT_COMPANY.name,
    address: settings?.address || DEFAULT_COMPANY.address,
    cityLine:
      addressParts.length === 1
        ? String(addressParts[0])
        : addressParts.length > 1
          ? cityLine
          : DEFAULT_COMPANY.cityLine,
    phone: settings?.phone || DEFAULT_COMPANY.phone,
    email: DEFAULT_COMPANY.email,
    website: settings?.website || DEFAULT_COMPANY.website,
    logoPath,
  };
}

export function resolveLogoPath(logoUrl: string | undefined, uploadsRoot: string): string | undefined {
  const candidates: string[] = [];
  if (logoUrl) {
    candidates.push(
      path.isAbsolute(logoUrl) ? logoUrl : path.join(uploadsRoot, logoUrl.replace(/^\/+/, ''))
    );
  }
  candidates.push(
    path.join(process.cwd(), 'frontend/public/logo.png'),
    path.join(process.cwd(), '../frontend/public/logo.png'),
    path.join(__dirname, '../../../frontend/public/logo.png')
  );
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

/** Collect PDFKit output into a single buffer (avoids corrupt files from early download). */
export function pdfDocumentToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export function sendPdfResponse(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', String(buffer.length));
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
  res.send(buffer);
}

export function drawCompanyHeader(
  doc: PDFKit.PDFDocument,
  company: CompanyInfo,
  opts?: { rightTitle?: string; rightSubtitle?: string }
): number {
  const leftX = PDF_MARGIN;
  const rightColW = 220;
  const rightX = PDF_PAGE.width - PDF_MARGIN - rightColW;
  let y = PDF_MARGIN;
  const logoH = 52;
  const logoW = 110;

  if (company.logoPath) {
    try {
      doc.image(company.logoPath, leftX, y, { fit: [logoW, logoH] });
    } catch {
      /* skip broken logo */
    }
  }

  const textX = company.logoPath ? leftX + logoW + 14 : leftX;
  doc.fillColor(PDF_GRAY);
  doc.font('Helvetica-Bold').fontSize(16);
  doc.text(company.name, textX, y, { width: rightX - textX - 16 });
  doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED);
  let ty = y + 20;
  doc.text(company.address, textX, ty, { width: rightX - textX - 16 });
  ty += 12;
  doc.text(company.cityLine, textX, ty, { width: rightX - textX - 16 });
  ty += 12;
  if (company.phone) doc.text(`Tel: ${company.phone}`, textX, ty, { width: rightX - textX - 16 });
  ty += 12;
  doc.text(company.email, textX, ty, { width: rightX - textX - 16 });
  ty += 12;
  if (company.website) doc.text(company.website, textX, ty, { width: rightX - textX - 16 });

  const headerBottom = Math.max(y + logoH, ty + 14);

  if (opts?.rightTitle) {
    doc.fillColor(PDF_TEAL);
    doc.font('Helvetica-Bold').fontSize(20);
    doc.text(opts.rightTitle, rightX, y, { width: rightColW, align: 'right' });
    if (opts.rightSubtitle) {
      doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED);
      doc.text(opts.rightSubtitle, rightX, y + 26, { width: rightColW, align: 'right' });
    }
  }

  doc.fillColor('#000000');
  const lineY = headerBottom + 10;
  doc.strokeColor(PDF_TEAL).lineWidth(2);
  doc.moveTo(PDF_MARGIN, lineY).lineTo(PDF_PAGE.width - PDF_MARGIN, lineY).stroke();
  doc.strokeColor('#000000').lineWidth(1);
  return lineY + 16;
}
