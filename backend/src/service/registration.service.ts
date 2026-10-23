import { Registration } from "../entity/registration.entity";
import { citizenService } from "./citizen.service";
import { AppError } from "../type/app-error";
import { TrusterIssuer } from "../type/truster-issuer";
import { keycloakService } from "./keycloak.service";
import { logger } from "./logger";
import { tirService } from "./tir.service";
import { tilService } from "./til.service";

class RegistrationService {

    async register(registration: Registration) {
        if (registration.citizen) {
            // Su usuario se crea al enviar la solicitud (la contraseña solo se conoce entonces).
            throw new AppError('Citizen registrations are activated automatically', 409);
        }
        if (registration.didGenerated) {
            await keycloakService.createRealm(registration);
        }
        const tirIssuer: TrusterIssuer = {
            did: registration.did,
            credentials: []
        }
        try {
            await tirService.registerDid(tirIssuer);
            await tilService.registerDid(tirIssuer);
        } catch(error) {
            logger.info('Remove realm because register DID failed');
            if (registration.didGenerated) {
                await keycloakService.removeRealm(registration.did);
            }
            throw error;
        }
    }
    async unregister({ did, didGenerated, citizen, email }: Registration) {
        if (citizen) {
            // El DID es el de la ciudadania, compartido: solo se borra el usuario, nunca el TIR/TIL.
            await citizenService.removeUser(email);
            return;
        }
        if (didGenerated) {
            await keycloakService.removeRealm(did);
        }
        await Promise.all([
            tirService.deleteDid(did),
            tilService.deleteDid(did),
        ]);
    }
}

export const registrationService = new RegistrationService();