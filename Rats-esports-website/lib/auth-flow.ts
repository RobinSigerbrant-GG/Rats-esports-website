import { createHash, randomBytes } from 'node:crypto';
export function pkceChallenge(verifier: string) { return createHash('sha256').update(verifier).digest('base64url'); }
export function createVerifier() { return randomBytes(32).toString('base64url'); }
export function loginDestination(value: string | null) { return value === '/soloq/admin' ? '/soloq/admin' : '/soloq'; }
export const flowCookie = 'rats-discord-flow';
