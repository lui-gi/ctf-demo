import { describe, it, expect } from 'vitest';
import { standaloneSign, standaloneVerify } from '../src/auth/jwt.js';

const SECRET = 'unit-test-secret-must-be-long-enough-1234567890';

describe('jwt — standalone HS256', () => {
  it('signs and verifies a token round-trip', () => {
    const tok = standaloneSign({ sub: 'pirate-1', role: 'pirate' }, SECRET, 60);
    const claims = standaloneVerify<{ sub: string; role: string }>(tok, SECRET);
    expect(claims.sub).toBe('pirate-1');
    expect(claims.role).toBe('pirate');
  });

  it('rejects a token signed with a different secret', () => {
    const tok = standaloneSign({ sub: 'pirate-1' }, SECRET, 60);
    expect(() => standaloneVerify(tok, 'other-secret-1234567890abcdef')).toThrow(/bad signature/);
  });

  it('rejects an expired token', () => {
    const tok = standaloneSign({ sub: 'pirate-1' }, SECRET, -1); // immediately expired
    expect(() => standaloneVerify(tok, SECRET)).toThrow(/expired/);
  });

  it('rejects a malformed token', () => {
    expect(() => standaloneVerify('not.a.real.token.too.many', SECRET)).toThrow(/malformed/);
    expect(() => standaloneVerify('justonepart', SECRET)).toThrow(/malformed/);
  });

  it('preserves role claim through round-trip — admin role gating depends on it', () => {
    const tok = standaloneSign({ sub: 'pirate-2', role: 'admin', typ: 'access' }, SECRET, 60);
    const claims = standaloneVerify<{ sub: string; role: string; typ: string }>(tok, SECRET);
    expect(claims.role).toBe('admin');
    expect(claims.typ).toBe('access');
  });

  it('rejects tampered payload (signature no longer matches)', () => {
    const tok = standaloneSign({ sub: 'pirate-1', role: 'pirate' }, SECRET, 60);
    const parts = tok.split('.');
    // Swap the payload to claim admin role.
    const evilPayload = Buffer.from(JSON.stringify({ sub: 'pirate-1', role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 }))
      .toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const tampered = `${parts[0]}.${evilPayload}.${parts[2]}`;
    expect(() => standaloneVerify(tampered, SECRET)).toThrow(/bad signature/);
  });
});
