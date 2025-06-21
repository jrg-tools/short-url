import Base64 from 'crypto-js/enc-base64';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import sha256 from 'crypto-js/sha256';

export function generateAlias(originUrl: string, pk: string, length: number = 6): string {
  const hashDigest = sha256(originUrl);
  const hmacDigest = Base64.stringify(hmacSHA512(hashDigest, pk));

  return hmacDigest.replace(/[^a-z0-9]/gi, '').substring(0, length);
}
