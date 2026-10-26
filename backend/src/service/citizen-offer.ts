import crypto from 'crypto';

// Piezas puras del enlace "obtener mi credencial" (sin dependencias de la config, para poder
// probarlas): firma del enlace y conversion de la respuesta de Keycloak en la URI que lee la wallet.

const b64url = (buf: Buffer) => buf.toString('base64url');

function mac(secret: string, payload: string): string {
    return b64url(crypto.createHmac('sha256', secret).update(payload).digest());
}

// <id>.<exp>.<firma>: el id del registro y su caducidad, firmados. Revocar un enlace es
// borrar la solicitud: verifyLink solo comprueba la firma, quien lo usa busca el registro.
export function signLink(id: string, secret: string, ttlDays: number, now: number = Date.now()): string {
    const exp = Math.floor(now / 1000) + Math.round(ttlDays * 86400);
    const payload = `${id}.${exp}`;
    return `${payload}.${mac(secret, payload)}`;
}

// -> id del registro, o null si el enlace esta mal formado, manipulado o caducado
export function verifyLink(token: string, secret: string, now: number = Date.now()): string | null {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const [id, exp, sig] = parts;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !/^\d+$/.test(exp)) return null;
    const expected = mac(secret, `${id}.${exp}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    if (Number(exp) < Math.floor(now / 1000)) return null;
    return id;
}

const OFFER_SCHEME = 'openid-credential-offer://';
const asByReference = (url: string) => `${OFFER_SCHEME}?credential_offer_uri=${encodeURIComponent(url)}`;

// Respuesta de create-credential-offer -> URI openid-credential-offer:// (la del QR y la del
// boton "abrir en la wallet"). La forma de la respuesta depende de la version de Keycloak:
// se aceptan las variantes conocidas y, si no encaja ninguna, falla con las claves que llegaron.
export function offerToUri(resp: any): string {
    if (typeof resp === 'string') {
        if (resp.startsWith('openid-credential-offer:')) return resp;
        if (/^https?:\/\//.test(resp)) return asByReference(resp);
    }
    if (resp && typeof resp === 'object') {
        for (const key of ['credential_offer_uri', 'uri', 'url', 'offer_uri']) {
            const v = resp[key];
            if (typeof v !== 'string') continue;
            if (v.startsWith('openid-credential-offer:')) return v;
            if (/^https?:\/\//.test(v)) return asByReference(v);
        }
        if (resp.credential_offer && typeof resp.credential_offer === 'object') {
            return `${OFFER_SCHEME}?credential_offer=${encodeURIComponent(JSON.stringify(resp.credential_offer))}`;
        }
        // Variante de la imagen SEAMWARE: { issuer: <.../credential-offer>, nonce }
        if (typeof resp.issuer === 'string' && typeof resp.nonce === 'string') {
            return asByReference(`${resp.issuer.replace(/\/$/, '')}/${resp.nonce}`);
        }
    }
    const keys = resp && typeof resp === 'object' ? Object.keys(resp).join(', ') : typeof resp;
    throw new Error(`respuesta de create-credential-offer no reconocida (claves: ${keys})`);
}
