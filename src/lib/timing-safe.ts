import { timingSafeEqual } from 'node:crypto';

export function timingSafeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  const compareLength = Math.max(leftBuffer.length, rightBuffer.length, 1);
  const leftPadded = Buffer.alloc(compareLength);
  const rightPadded = Buffer.alloc(compareLength);

  leftBuffer.copy(leftPadded);
  rightBuffer.copy(rightPadded);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftPadded, rightPadded)
  );
}
