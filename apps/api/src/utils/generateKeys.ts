// ============================================================
// OneFlesh — RSA Key-Pair Generator
// Run: npm run keys:generate -w apps/api
// Outputs base64-encoded PEM values ready to paste into .env
// ============================================================

import { generateKeyPairSync } from 'crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const toBase64 = (pem: string) => Buffer.from(pem).toString('base64');

console.log('='.repeat(60));
console.log('OneFlesh — Generated RSA-2048 Key Pair');
console.log('Add these to your .env file:');
console.log('='.repeat(60));
console.log('');
console.log(`JWT_PRIVATE_KEY=${toBase64(privateKey)}`);
console.log('');
console.log(`JWT_PUBLIC_KEY=${toBase64(publicKey)}`);
console.log('');
console.log('='.repeat(60));
console.log('Keep JWT_PRIVATE_KEY secret. JWT_PUBLIC_KEY can be shared.');
