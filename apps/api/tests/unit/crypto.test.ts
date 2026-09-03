// ============================================================
// OneFlesh — Crypto Utility Unit Tests
// ============================================================

import { encrypt, decrypt } from '../../src/utils/crypto.js';

describe('AES-256-GCM Encryption', () => {
  const testKey = '0'.repeat(64); // 32-byte hex key for tests

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });

  it('encrypts and decrypts a string round-trip', () => {
    const plaintext = 'test@example.com';
    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toBe(plaintext);
    expect(ciphertext).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const plaintext = 'same-input';
    const ct1 = encrypt(plaintext);
    const ct2 = encrypt(plaintext);

    expect(ct1).not.toBe(ct2);
    expect(decrypt(ct1)).toBe(plaintext);
    expect(decrypt(ct2)).toBe(plaintext);
  });

  it('throws on tampered ciphertext', () => {
    const original = encrypt('sensitive data');
    const parts = original.split(':');
    // Flip a byte in the encrypted data
    parts[2] = parts[2].replace(/.$/, parts[2].slice(-1) === 'f' ? '0' : 'f');
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });

  it('encrypts and decrypts Indian phone numbers', () => {
    const phone = '+91 98765 43210';
    expect(decrypt(encrypt(phone))).toBe(phone);
  });

  it('handles empty string gracefully', () => {
    const ciphertext = encrypt('');
    expect(decrypt(ciphertext)).toBe('');
  });
});

// ─── C-03: Hardcoded Fallback Encryption Key ──────────────────
// When ENCRYPTION_KEY is not set in env, crypto.ts falls back to a
// hardcoded key derived from 'oneflesh-dev-key' + 'oneflesh-salt'.
// This means all PII in production is encrypted with a publicly-known key.

describe('C-03 · crypto — hardcoded fallback key when ENCRYPTION_KEY is unset', () => {
  const originalKey = process.env['ENCRYPTION_KEY'];

  afterEach(() => {
    // Restore the original key after each test
    if (originalKey === undefined) {
      delete process.env['ENCRYPTION_KEY'];
    } else {
      process.env['ENCRYPTION_KEY'] = originalKey;
    }
    jest.resetModules(); // Force re-evaluation of getEncryptionKey()
  });

  it('⚠️  SECURITY RISK — when ENCRYPTION_KEY is unset, falls back to hardcoded dev key', async () => {
    // Remove the encryption key from env
    delete process.env['ENCRYPTION_KEY'];
    jest.resetModules();

    // Re-import after clearing the key to get fresh module evaluation
    const { encrypt: encryptNoKey, decrypt: decryptNoKey } = await import('../../src/utils/crypto.js');

    // The fallback key is deterministic — anyone who reads the source code knows it.
    // Encryption still works (no crash), which hides the misconfiguration.
    const plaintext = 'sensitive-pii-data@example.com';
    const ciphertext = encryptNoKey(plaintext);
    const decrypted = decryptNoKey(ciphertext);

    // This PASSES — encryption works, but with a known-bad key.
    // The real test is that the app should CRASH at startup if ENCRYPTION_KEY is missing.
    expect(decrypted).toBe(plaintext);

    // After fix: this should throw or the env validation should prevent startup.
    // The fix is to add ENCRYPTION_KEY to cleanEnv() in config/env.ts so that
    // a missing key raises an EnvMissingError at process startup.
  });

  it('⚠️  SECURITY RISK — ciphertext encrypted with dev key decrypts across module reloads', async () => {
    // This test demonstrates the key is deterministic (not random per-process)
    delete process.env['ENCRYPTION_KEY'];
    jest.resetModules();

    const { encrypt: enc1 } = await import('../../src/utils/crypto.js');

    jest.resetModules();
    const { decrypt: dec2 } = await import('../../src/utils/crypto.js');

    // The same deterministic key means ciphertext from one process decrypts in another
    // — exactly what an attacker with DB access would exploit.
    const ciphertext = enc1('secret-data');
    const decrypted = dec2(ciphertext);
    expect(decrypted).toBe('secret-data');
  });

  it('✅ uses the correct key when ENCRYPTION_KEY is set (32+ chars)', async () => {
    process.env['ENCRYPTION_KEY'] = '0'.repeat(64); // 32-byte hex key
    jest.resetModules();

    const { encrypt: encWithKey, decrypt: decWithKey } = await import('../../src/utils/crypto.js');

    const plaintext = 'properly-encrypted@example.com';
    expect(decWithKey(encWithKey(plaintext))).toBe(plaintext);
  });
});
