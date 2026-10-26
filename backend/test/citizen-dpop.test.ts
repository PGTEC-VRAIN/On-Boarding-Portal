import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { createDpopKey, dpopProof } from '../src/service/citizen-dpop.ts';

const parse = (jwt: string) => {
    const [h, p, s] = jwt.split('.');
    return { header: JSON.parse(Buffer.from(h, 'base64url').toString()), claims: JSON.parse(Buffer.from(p, 'base64url').toString()), signed: `${h}.${p}`, sig: Buffer.from(s, 'base64url') };
};

test('la prueba lleva typ dpop+jwt, ES256 y la clave publica', () => {
    const key = createDpopKey();
    const { header } = parse(dpopProof(key, 'post', 'https://k/token'));
    assert.strictEqual(header.typ, 'dpop+jwt');
    assert.strictEqual(header.alg, 'ES256');
    assert.ok(header.jwk.x && header.jwk.y && !header.jwk.d, 'solo clave publica');
});

test('htm en mayusculas y htu sin query ni fragmento', () => {
    const { claims } = parse(dpopProof(createDpopKey(), 'get', 'https://k/o?a=1&b=2#f'));
    assert.strictEqual(claims.htm, 'GET');
    assert.strictEqual(claims.htu, 'https://k/o');
});

test('ath es el hash SHA-256 del access token, y solo si hay token', () => {
    const key = createDpopKey();
    assert.strictEqual(parse(dpopProof(key, 'GET', 'https://k/o')).claims.ath, undefined);
    const ath = parse(dpopProof(key, 'GET', 'https://k/o', { accessToken: 'tok' })).claims.ath;
    assert.strictEqual(ath, crypto.createHash('sha256').update('tok').digest('base64url'));
});

test('el nonce del servidor se incluye', () => {
    assert.strictEqual(parse(dpopProof(createDpopKey(), 'POST', 'https://k/t', { nonce: 'N1' })).claims.nonce, 'N1');
});

test('cada prueba tiene un jti distinto', () => {
    const key = createDpopKey();
    assert.notStrictEqual(parse(dpopProof(key, 'GET', 'https://k')).claims.jti, parse(dpopProof(key, 'GET', 'https://k')).claims.jti);
});

test('la firma se verifica con la clave publica del propio jwk', () => {
    const jwt = dpopProof(createDpopKey(), 'GET', 'https://k/o', { now: 1_700_000_000_000 });
    const { header, signed, sig, claims } = parse(jwt);
    assert.strictEqual(claims.iat, 1_700_000_000);
    const pub = crypto.createPublicKey({ key: header.jwk, format: 'jwk' });
    assert.ok(crypto.verify('sha256', Buffer.from(signed), { key: pub, dsaEncoding: 'ieee-p1363' }, sig));
    assert.ok(!crypto.verify('sha256', Buffer.from(signed + 'x'), { key: pub, dsaEncoding: 'ieee-p1363' }, sig));
});
