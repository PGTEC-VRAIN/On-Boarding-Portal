import { Request, Response, Router } from "express";
import { registrationRepository, RegistrationUpdate } from "../repository/registration.repository";
import { logger } from "../service/logger";
import { isDuplicatedKeyError } from "../type/db-errors";
import emailService from "../service/email.service";
import { adminNotificationService } from "../service/admin-notification.service";
import { RegistrationStatus } from "../entity/registration.entity";
import { storageService } from "../service/storage.service";
import { uploadFiles } from "../middleware/storage.middleware";
import { MailContext } from "../type/main-context";
import { keycloakService } from "../service/keycloak.service";
import { citizenService, normalizeNif } from "../service/citizen.service";
import { configService } from "../service/config.service";
import { AppError } from "../type/app-error";

const router = Router()

// Solicitud sin DID: persona de la ciudadania. No pasa por el TIR/TIL (el DID es el del
// participante de ciudadania, ya registrado): se crea su usuario en el Keycloak de
// ciudadania y se le envian usuario y contraseña temporal por correo.
async function submitCitizen(req: Request, res: Response, data: any) {
    const { name, email } = data;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    let nif: string | undefined;
    if (data.nif) {
        nif = normalizeNif(String(data.nif)) ?? undefined;
        if (!nif) {
            return res.status(400).json({ error: 'Invalid NIF/NIE' });
        }
    }
    const { did } = configService.get().citizen;
    let registration;
    try {
        logger.info(`Processing citizen onboarding for: ${email}`);
        registration = await registrationRepository.save({
            name, email, nif, citizen: true, status: RegistrationStatus.ACTIVE,
            taxId: '', address: '', city: '', postCode: '', country: ''
        });
        // Antes de crear el usuario: sin secreto de enlaces el correo no podria llevar el QR.
        const credentialUrl = citizenService.credentialLink(registration.id, (req as any).serverOrigin);
        const account = await citizenService.createUser(name, email, nif);
        registration.did = did;
        res.status(201).json({ id: registration.id, did, citizen: true, timestamp: new Date().toISOString() });
        const mailContext: MailContext = { registration, serverOrigin: (req as any).serverOrigin, account, credentialUrl };
        emailService.sendCitizenEmail(email, mailContext).catch((error) => {
            logger.warn('Unable to send citizen email', error);
        });
    } catch (error) {
        logger.error('Citizen Submission Error:', error);
        if (registration) {
            await registrationRepository.delete(registration.id).catch(() => undefined);
        }
        if (isDuplicatedKeyError(error)) {
            return res.status(400).json({ error: `Email '${email}' has been already submitted` });
        }
        if (error instanceof AppError) {
            return res.status(error.status).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

router.post('/registrations/submit', uploadFiles('files', { maxCount: 5, allowedTypes: /pdf/ }), async (req, res) => {
    let filesPath, registration;
    let { file, ...data } = req.body;
    try {
        logger.info(`Processing onboarding for: ${data.name}`);

        const uploadedFiles = req.files as Express.Multer.File[];

        logger.debug(`Files received: ${uploadedFiles ? uploadedFiles.length : 0}`);


        if (!data.did && configService.get().citizen.enabled) {
            return await submitCitizen(req, res, data);
        }
        if (!data.did) {
            if (!keycloakService.config.didCreationEnabled) {
                return res.status(400).json({ error: 'DID is required' })
            }
            const did = keycloakService.createDidRealm();
            data.did = did;
            data.didGenerated = true;
        }
        filesPath = storageService.getFilesPath(data.did);
        registration = await registrationRepository.save({ ...data, filesPath });

        if (uploadedFiles && uploadedFiles.length != 0) {
            filesPath = await storageService.saveFiles(data.did, uploadedFiles)
        }

        res.status(201).json({
            id: registration.id,
            did: registration.did,
            timestamp: new Date().toISOString()
        });
        // TODO should send mail first?
        const mailContext: MailContext = {
            registration,
            serverOrigin: (req as any).serverOrigin
        }
        emailService.sendSubmitEmail(data.email, mailContext).catch((error) => {
            logger.warn('Unable to submit send email', error);
        })
        adminNotificationService.notify(mailContext).catch((error) => {
            logger.warn('Unable to send admin notification email', error);
        })
    } catch (error) {
        logger.error('Submission Error:', error);
        if (filesPath) {
            await storageService.removeFolder(filesPath);
        }
        if (isDuplicatedKeyError(error)) {
            res.status(400).json({ error: `DID '${data.did}' or email '${data.email}' has been already submitted` })
            return
        }
        res.status(500).json({ error: 'Internal Server Error' });
        if (registration) {
            await registrationRepository.delete(registration.id)
        }
    }
});

router.get('/registrations/submit/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const registration = await registrationRepository.findById(id);
        if (!registration) {
            res.status(404).json({
                message: `Registration '${id}' does not found`
            });
            return
        }
        res.json(registration);
    } catch (error) {
        logger.error(`Error getting registration '${id}'`, error)
        res.status(404).json({ message: `Registration '${id}' does not found` });
    }

})
router.put('/registrations/submit/:id', uploadFiles('files', { maxCount: 5, allowedTypes: /pdf/ }), async (req, res) => {
    const id = req.params.id as string;
    const data = req.body as RegistrationUpdate;
    const uploadedFiles = req.files as Express.Multer.File[];
    if (!data || !uploadedFiles) {
        return res.status(400).send({ error: 'Email, DID or file field is required' })
    }
    const allowedStatus = [RegistrationStatus.ACTION_REQUIRED, RegistrationStatus.SUBMITTED]
    const queryRunner = registrationRepository.transaction();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const prevRegistration = await registrationRepository.findById(id, queryRunner);
        if (!prevRegistration) {
            return res.status(404).json({
                message: `Registration with ID ${id} not found`
            });
        }
        if (!allowedStatus.includes(prevRegistration?.status)) {
            return res.status(404).json({
                message: `Registration with ID ${id} cannot be updated in the current state`
            });
        }

        if (data.did) {
            data.filesPath = storageService.getFilesPath(data.did);
        } else {
            delete data.filesPath;
        }

        const registration = (await registrationRepository.updateInfo(id, data, queryRunner))!;

        await queryRunner.commitTransaction();

        if (uploadedFiles?.length > 0 || data.did !== prevRegistration.did) {
            await storageService.updateFiles(prevRegistration.did, data.did || prevRegistration.did, uploadedFiles)
        }

        res.status(200).json(registration);
    } catch (error) {
        logger.error('Unable to update registration', error);
        await queryRunner.rollbackTransaction();
        res.status(500).send({ error: 'Error updating registration' });
    } finally {
        await queryRunner.release()
    }

})
export default router;