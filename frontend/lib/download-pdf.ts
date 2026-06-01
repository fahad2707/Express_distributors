import toast from 'react-hot-toast';

function toUint8Array(data: BlobPart): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Uint8Array) return data;
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return new Uint8Array(data as unknown as ArrayBuffer);
}

/** Download a PDF blob from an admin API response (validates %PDF header). */
export function downloadPdfFromResponse(
  data: BlobPart,
  filename: string,
  contentType?: string | null
): boolean {
  const buf = toUint8Array(data);
  const isPdf =
    buf.length >= 4 &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46;

  if (!isPdf) {
    try {
      const text = new TextDecoder().decode(buf.slice(0, 500));
      const parsed = JSON.parse(text);
      toast.error(parsed?.error || 'Server did not return a valid PDF');
    } catch {
      toast.error('Download failed — file is not a valid PDF');
    }
    return false;
  }

  const blob = new Blob([data], { type: contentType || 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
}

export function openPdfFromResponse(data: BlobPart, contentType?: string | null): boolean {
  const buf = toUint8Array(data);
  if (buf.length < 4 || buf[0] !== 0x25 || buf[1] !== 0x50) {
    toast.error('Could not open PDF — invalid file');
    return false;
  }
  const blob = new Blob([data], { type: contentType || 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  return true;
}
