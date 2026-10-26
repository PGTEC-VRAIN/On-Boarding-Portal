import { Router } from "express";
import QRCode from "qrcode";
import { registrationRepository } from "../repository/registration.repository";
import { RegistrationStatus } from "../entity/registration.entity";
import { citizenService } from "../service/citizen.service";
import { AppError } from "../type/app-error";
import { logger } from "../service/logger";

const router = Router()

// Cada apertura del enlace (y cada "generar nuevo QR") crea una oferta en Keycloak: se limita
// por solicitud para que un enlace filtrado no se use para generar ofertas sin freno.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();
function allow(id: string): boolean {
    const now = Date.now();
    const recent = (hits.get(id) ?? []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
        hits.set(id, recent);
        return false;
    }
    recent.push(now);
    hits.set(id, recent);
    return true;
}

// Enlace del correo de ciudadania -> oferta de credencial nueva (URI + QR). Publico: la
// autorizacion es el propio enlace firmado. Un enlace malo, caducado o de una solicitud
// borrada da el mismo 404, para no revelar cual de las tres cosas es.
router.get('/citizen/credential', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const id = citizenService.registrationFromLink(String(req.query.t ?? ''));
    if (!id) {
        return res.status(404).json({ error: 'Link not valid' });
    }
    try {
        const registration = await registrationRepository.findById(id);
        if (!registration?.citizen || registration.status !== RegistrationStatus.ACTIVE) {
            return res.status(404).json({ error: 'Link not valid' });
        }
        if (!allow(id)) {
            return res.status(429).json({ error: 'Too many requests' });
        }
        const uri = await citizenService.createOffer();
        const qr = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
        res.json({ name: registration.name, uri, qr });
    } catch (error) {
        logger.error(`Unable to create credential offer for registration ${id}`, error);
        const status = error instanceof AppError ? error.status : 500;
        res.status(status).json({ error: 'Unable to create the credential offer' });
    }
});

export default router;
