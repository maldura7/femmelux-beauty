import crypto from 'crypto';

/**
 * Generate a unique order number
 *
 * Format: ORD-YYYYMMDD-XXXX
 * - ORD: Order prefix
 * - YYYYMMDD: Current date
 * - XXXX: Random 4-character alphanumeric string
 *
 * @returns A unique order number string
 *
 * @example
 * generateOrderNumber() // "ORD-20240115-A7B3"
 */
export function generateOrderNumber(): string {
  const date = new Date();

  // Format date as YYYYMMDD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;

  // Generate random 4-character alphanumeric string
  const randomPart = crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase();

  return `ORD-${dateString}-${randomPart}`;
}

/**
 * Generate a unique invoice number
 *
 * Format: INV-YYYYMMDD-XXXX
 *
 * @returns A unique invoice number string
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;

  const randomPart = crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase();

  return `INV-${dateString}-${randomPart}`;
}

/**
 * Generate a unique tracking number
 *
 * Format: TRK-XXXXXXXXXXXX (12 random characters)
 *
 * @returns A unique tracking number string
 */
export function generateTrackingNumber(): string {
  const randomPart = crypto
    .randomBytes(6)
    .toString('hex')
    .toUpperCase();

  return `TRK-${randomPart}`;
}

/**
 * Generate a unique SKU
 *
 * Format: SKU-BRANDPREFIX-XXXXX
 *
 * @param brandPrefix - 3-character brand prefix
 * @returns A unique SKU string
 */
export function generateSKU(brandPrefix: string = 'GEN'): string {
  const prefix = brandPrefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
  const randomPart = crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase();

  return `SKU-${prefix}-${randomPart}`;
}

export default generateOrderNumber;
