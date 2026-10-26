import test from 'node:test';
import assert from 'node:assert';
import { signLink, verifyLink, offerToUri } from '../src/service/citizen-offer.ts';

const ID = '50607a9e-2662-48f9-b712-7446dee6d300';
const SECRET = 'secreto-de-prueba';
const T0 = Date.UTC(2026, 9, 26);

test('un enlace firmado se verifica y devuelve el id', () => {
    assert.strictEqual(verifyLink(signLink(ID, SECRET, 30, T0), SECRET, T0 + 1000), ID);
});

test('un enlace caducado no vale', () => {
    const token = signLink(ID, SECRET, 1, T0);
    assert.strictEqual(verifyLink(token, SECRET, T0 + 2 * 86400 * 1000), null);
});

test('un enlace manipulado o con otro secreto no vale', () => {
    const token = signLink(ID, SECRET, 30, T0);
    assert.strictEqual(verifyLink(token, 'otro-secreto', T0), null);
    const other = '11111111-2222-3333-4444-555555555555';
    assert.strictEqual(verifyLink(token.replace(ID, other), SECRET, T0), null);
    const [i, e, s] = token.split('.');
    assert.strictEqual(verifyLink(`${i}.${Number(e) + 99999}.${s}`, SECRET, T0), null);
});

test('entradas mal formadas se rechazan sin lanzar', () => {
    for (const bad of ['', 'abc', 'a.b.c', undefined as any, null as any, `${ID}.x.y`]) {
        assert.strictEqual(verifyLink(bad, SECRET, T0), null);
    }
});

test('offerToUri acepta una URI ya hecha', () => {
    const u = 'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fk%2Fo%2F1';
    assert.strictEqual(offerToUri({ uri: u }), u);
    assert.strictEqual(offerToUri(u), u);
});

test('offerToUri envuelve una URL https como credential_offer_uri', () => {
    assert.strictEqual(offerToUri({ credential_offer_uri: 'https://k/realms/p/oid4vc/credential-offer/abc' }),
        'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fk%2Frealms%2Fp%2Foid4vc%2Fcredential-offer%2Fabc');
});

test('offerToUri compone issuer + nonce (variante SEAMWARE)', () => {
    assert.strictEqual(offerToUri({ issuer: 'https://k/realms/p/protocol/oid4vc/credential-offer', nonce: 'N1' }),
        'openid-credential-offer://?credential_offer_uri=' + encodeURIComponent('https://k/realms/p/protocol/oid4vc/credential-offer/N1'));
});

test('offerToUri incrusta una oferta completa por valor', () => {
    const uri = offerToUri({ credential_offer: { credential_issuer: 'https://k', credential_configuration_ids: ['ServiceCredential'] } });
    assert.ok(uri.startsWith('openid-credential-offer://?credential_offer='));
    assert.ok(decodeURIComponent(uri.split('credential_offer=')[1]).includes('ServiceCredential'));
});

test('offerToUri falla diciendo qué claves llegaron', () => {
    assert.throws(() => offerToUri({ foo: 1, bar: 2 }), /foo, bar/);
});
