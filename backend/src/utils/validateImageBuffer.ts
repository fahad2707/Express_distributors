const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function isJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

function isGif(buf: Buffer): boolean {
  const h = buf.slice(0, 6).toString('ascii');
  return h === 'GIF87a' || h === 'GIF89a';
}

function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.slice(0, 4).toString('ascii') === 'RIFF' &&
    buf.slice(8, 12).toString('ascii') === 'WEBP'
  );
}

/** Reject polyglot / executable uploads: require magic bytes to match an allowed image type. */
export function assertAllowedImageBuffer(buffer: Buffer, claimedMime: string): void {
  if (!buffer?.length || buffer.length < 12) {
    throw new Error('Invalid or empty file');
  }
  const mime = (claimedMime || '').toLowerCase();
  if (!ALLOWED_MIMES.has(mime)) {
    throw new Error('Unsupported image type');
  }
  const ok =
    (mime === 'image/jpeg' && isJpeg(buffer)) ||
    (mime === 'image/png' && isPng(buffer)) ||
    (mime === 'image/gif' && isGif(buffer)) ||
    (mime === 'image/webp' && isWebp(buffer));
  if (!ok) {
    throw new Error('File content does not match declared image type');
  }
}
