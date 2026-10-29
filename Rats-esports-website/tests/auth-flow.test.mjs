import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerifier, pkceChallenge, loginDestination } from '../lib/auth-flow.ts';
test('PKCE matches the RFC 7636 S256 example', () => {
  assert.equal(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});
test('each login gets a separate 256-bit verifier', () => {
  const a = createVerifier(), b = createVerifier();
  assert.match(a,/^[A-Za-z0-9_-]{43}$/); assert.notEqual(a,b);
});
test('return URLs only allow explicit local destinations', () => {
  assert.equal(loginDestination('/soloq/admin'),'/soloq/admin');
  for (const value of ['https://evil.example','//evil.example','/\\evil.example','/auth/callback',null]) assert.equal(loginDestination(value),'/soloq');
});
