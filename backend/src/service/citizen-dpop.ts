import crypto from 'crypto';

// Pruebas DPoP (RFC 9449) para pedir tokens con el cliente de Lissi, que las exige ("DPoP proof is
// missing"). Piezas puras, sin dependencias de la config, para poder probarlas.

const b64url = (buf: Buffer) => buf.toString('base64url');

export interface DpopKey {
    privateKey: crypto.KeyObject;
    jwk: crypto.JsonWebKey;
}

// Clave efimera P-256: el token que se obtenga queda ligado a ella.
export function createDpopKey(): DpopKey {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    return { privateKey, jwk: publicKey.export({ format: 'jwk' }) };
}

export interface DpopOptions {
    // Con un access token se añade `ath` (hash del token), obligatorio al usarlo contra un recurso.
    accessToken?: string;
    // Nonce que el servidor pide (cabecera DPoP-Nonce, error use_dpop_nonce).
    nonce?: string;
    now?: number;
}

// Prueba para una peticion: ligada al metodo y a la URL sin query ni fragmento.
export function dpopProof(key: DpopKey, method: string, url: string, options: DpopOptions = {}): string {
    const header = b64url(Buffer.from(JSON.stringify({ typ: 'dpop+jwt', alg: 'ES256', jwk: key.jwk })));
    const claims: Record<string, unknown> = {
        jti: crypto.randomUUID(),
        htm: method.toUpperCase(),
        htu: url.split('#')[0].split('?')[0],
        iat: Math.floor((options.now ?? Date.now()) / 1000),
    };
    if (options.accessToken) {
        claims.ath = b64url(crypto.createHash('sha256').update(options.accessToken).digest());
    }
    if (options.nonce) {
        claims.nonce = options.nonce;
    }
    const payload = b64url(Buffer.from(JSON.stringify(claims)));
    const signature = crypto.sign('sha256', Buffer.from(`${header}.${payload}`), { key: key.privateKey, dsaEncoding: 'ieee-p1363' });
    return `${header}.${payload}.${b64url(signature)}`;
}

// Peticion con DPoP; si el servidor pide un nonce se repite una sola vez con el.
export async function dpopFetch(
    key: DpopKey, method: string, url: string,
    init: { headers?: Record<string, string>; body?: URLSearchParams | string } = {},
    options: Omit<DpopOptions, 'nonce'> = {},
): Promise<Response> {
    let nonce: string | undefined;
    for (let attempt = 0; ; attempt++) {
        const res = await fetch(url, {
            method, body: init.body,
            headers: { ...init.headers, DPoP: dpopProof(key, method, url, { ...options, nonce }) },
        });
        const next = res.headers.get('dpop-nonce');
        if (!res.ok && next && attempt === 0) {
            nonce = next;
            continue;
        }
        return res;
    }
}
