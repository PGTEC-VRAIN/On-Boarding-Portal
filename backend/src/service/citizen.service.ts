import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import crypto from 'crypto';
import { CitizenConfig } from "../type/app-config";
import { offerToUri, signLink, verifyLink } from "./citizen-offer";
import { createDpopKey, dpopFetch } from "./citizen-dpop";
import { AppError } from "../type/app-error";
import { configService } from "./config.service";
import { logger } from "./logger";

const PASSWORD_CHARSET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const DNI_REGEX = /^(\d{8})([A-Z])$/;
const NIE_REGEX = /^([XYZ])(\d{7})([A-Z])$/;

export interface CitizenAccount {
    username: string;
    password: string;
}

// Normaliza un DNI/NIE (mayusculas, sin espacios ni guiones). Devuelve null si no es
// valido (formato y letra de control).
export function normalizeNif(value: string): string | null {
    const nif = value.toUpperCase().replace(/[\s-]/g, '');
    const dni = DNI_REGEX.exec(nif);
    if (dni) {
        return DNI_LETTERS[Number(dni[1]) % 23] === dni[2] ? nif : null;
    }
    const nie = NIE_REGEX.exec(nif);
    if (nie) {
        const number = Number('XYZ'.indexOf(nie[1]) + nie[2]);
        return DNI_LETTERS[number % 23] === nie[3] ? nif : null;
    }
    return null;
}

class CitizenService {

    config: CitizenConfig;
    adminClient: KeycloakAdminClient;

    constructor(config: CitizenConfig) {
        this.config = config;
        this.adminClient = new KeycloakAdminClient({ baseUrl: config.keycloak.baseUrl, realmName: config.keycloak.authRealm });
    }

    // Enlace del correo: pagina del portal que genera una oferta nueva cada vez que se abre.
    credentialLink(registrationId: string, origin: string): string {
        const { secret, ttlDays } = this.config.link;
        if (!secret) {
            throw new AppError('citizen.link.secret is not configured', 500);
        }
        return `${origin}/credential?t=${signLink(registrationId, secret, ttlDays)}`;
    }

    // -> id de la solicitud a la que pertenece el enlace, o null si no es valido o caduco
    registrationFromLink(token: string): string | null {
        return this.config.link.secret ? verifyLink(token, this.config.link.secret) : null;
    }

    getAccountUrl(): string {
        const { baseUrl, realmName } = this.config.keycloak;
        return `${baseUrl}/realms/${realmName}/account`;
    }

    // Crea el usuario de la persona en el Keycloak de ciudadania: grupo, roles de
    // roles-dataspace, rol de ServiceCredential en el cliente del DID y la credencial asignada
    // para poder emitirla. Lleva una contraseña aleatoria (se envia por correo): al aceptar la
    // oferta, Lissi lleva a la persona a iniciar sesion en Keycloak. Si algun paso falla,
    // borra el usuario.
    async createUser(name: string, email: string, nif?: string): Promise<CitizenAccount> {
        const realm = this.config.keycloak.realmName;
        await this._authClient();

        if (nif) {
            const taken = await this.adminClient.users.find({ realm, q: `nif:${nif}` });
            if (taken.length) {
                throw new AppError('NIF already registered', 409);
            }
        }

        const password = this._generatePassword();
        const [firstName, ...rest] = name.trim().split(/\s+/);
        const user: UserRepresentation & { verifiableCredentials?: { credentialScopeName: string }[] } = {
            username: email,
            email,
            emailVerified: true,
            enabled: true,
            firstName,
            lastName: rest.join(' '),
            attributes: nif ? { nif: [nif] } : {},
            // Permanente: la persona puede cambiarla en su cuenta, pero no se le obliga a mitad de la oferta.
            credentials: [{ type: 'password', value: password, temporary: false }],
            // Mismo mecanismo que el usuario admin de cada realm (keycloak.service.ts).
            verifiableCredentials: [{ credentialScopeName: this.config.credentialScope }],
        };

        let id: string;
        try {
            ({ id } = await this.adminClient.users.create({ ...user, realm }));
        } catch (error: any) {
            if (error?.response?.status === 409) {
                throw new AppError('User already exists', 409);
            }
            throw error;
        }
        try {
            await this._assignAccess(id, realm);
        } catch (error) {
            logger.error(`Unable to set up citizen user '${email}', removing it`, error);
            await this.adminClient.users.del({ id, realm }).catch(() => undefined);
            throw error;
        }
        logger.info(`Created citizen user '${email}'${nif ? ' with NIF' : ''}`);
        return { username: email, password };
    }

    async removeUser(email: string): Promise<void> {
        const realm = this.config.keycloak.realmName;
        await this._authClient();
        const users = await this.adminClient.users.find({ realm, username: email, exact: true });
        for (const { id } of users) {
            await this.adminClient.users.del({ id: id!, realm });
            logger.info(`Deleted citizen user '${email}'`);
        }
    }

    private async _assignAccess(userId: string, realm: string): Promise<void> {
        const { dataspaceRoles, credentialScope, group } = this.config;

        const [groupMatch] = await this.adminClient.groups.find({ realm, search: group, exact: true });
        if (!groupMatch?.id) {
            throw new Error(`Group '${group}' not found in realm '${realm}'`);
        }
        await this.adminClient.users.addToGroup({ id: userId, realm, groupId: groupMatch.id });

        await this._addClientRoles(userId, realm, 'roles-dataspace', dataspaceRoles);
        // Como en el realm de los participantes: el rol de la credencial va en el cliente del did:web.
        await this._addClientRoles(userId, realm, this.config.did, [credentialScope]);
    }

    private async _addClientRoles(userId: string, realm: string, clientId: string, names: string[]): Promise<void> {
        const [client] = await this.adminClient.clients.find({ realm, clientId });
        if (!client?.id) {
            throw new Error(`Client '${clientId}' not found in realm '${realm}'`);
        }
        const available = await this.adminClient.clients.listRoles({ id: client.id, realm });
        const roles = names.map(name => {
            const role = available.find(r => r.name === name);
            if (!role) {
                throw new Error(`Role '${name}' not found in client '${clientId}' of realm '${realm}'`);
            }
            return { id: role.id!, name: role.name! };
        });
        await this.adminClient.users.addClientRoleMappings({ id: userId, realm, clientUniqueId: client.id, roles });
    }

    private _generatePassword(): string {
        const bytes = crypto.randomBytes(this.config.passwordLength);
        return Array.from(bytes).map(byte => PASSWORD_CHARSET[byte % PASSWORD_CHARSET.length]).join('');
    }

    private async _authClient() {
        await this.adminClient.auth(this.config.keycloak.auth);
    }

    // Crea una oferta de credencial y devuelve la URI openid-credential-offer:// (la del QR).
    //
    // Keycloak ata cada oferta al cliente que la crea y, al canjearla, exige que sea el mismo con el
    // que se inicia sesion ("Credential offer target client ... different from login client"). Lissi
    // inicia sesion siempre con su cliente, asi que la oferta se crea con ese cliente: un usuario
    // tecnico (`offer.botUser`) pide un token con el y crea la oferta, anonima y con codigo de
    // autorizacion. La puede canjear cualquier usuario que inicie sesion; Keycloak emite la
    // credencial de quien se autentica. El cliente de Lissi exige DPoP.
    async createOffer(): Promise<string> {
        const { clientId, botUser, botPassword, preAuthorized, expireSeconds } = this.config.offer;
        const realmUrl = `${this.config.keycloak.baseUrl}/realms/${this.config.keycloak.realmName}`;
        const clientSecret = await this._ensureOfferBot();
        const key = createDpopKey();

        const form = new URLSearchParams({ grant_type: 'password', client_id: clientId, username: botUser, password: botPassword });
        if (clientSecret) {
            form.set('client_secret', clientSecret);
        }
        const tokenRes = await dpopFetch(key, 'POST', `${realmUrl}/protocol/openid-connect/token`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
        const token = await tokenRes.json().catch(() => ({})) as { access_token?: string; token_type?: string };
        if (!tokenRes.ok || !token.access_token) {
            logger.error(`Offer bot token request failed: HTTP ${tokenRes.status} ${JSON.stringify(token).slice(0, 300)}`);
            throw new AppError(`Keycloak rejected the offer user token request (HTTP ${tokenRes.status})`, 502);
        }

        const url = new URL(`${realmUrl}/protocol/oid4vc/create-credential-offer`);
        url.searchParams.set('credential_configuration_id', this.config.credentialScope);
        url.searchParams.set('pre_authorized', String(preAuthorized));
        url.searchParams.set('type', 'uri');
        // `expire` es una fecha (Unix, segundos), no una duracion.
        url.searchParams.set('expire', String(Math.floor(Date.now() / 1000) + expireSeconds));
        const dpopBound = token.token_type?.toLowerCase() === 'dpop';
        const res = await dpopFetch(key, 'GET', url.href,
            { headers: { Authorization: `${dpopBound ? 'DPoP' : 'Bearer'} ${token.access_token}` } },
            dpopBound ? { accessToken: token.access_token } : {});
        const text = await res.text();
        if (!res.ok) {
            logger.error(`create-credential-offer failed: HTTP ${res.status} ${text.slice(0, 300)}`);
            throw new AppError(`Keycloak could not create the credential offer (HTTP ${res.status})`, 502);
        }
        let body: any = text;
        try { body = JSON.parse(text); } catch { /* respuesta en texto plano */ }
        try {
            return offerToUri(body);
        } catch (error) {
            logger.error(`Unrecognised create-credential-offer response: ${text.slice(0, 300)}`);
            throw new AppError((error as Error).message, 502);
        }
    }

    // Deja listo, la primera vez (idempotente), lo que necesita createOffer en Keycloak: el cliente
    // de Lissi con login por contraseña (direct access grants), el usuario tecnico con su contraseña y el
    // rol de crear ofertas. Devuelve el secreto del cliente si no fuera publico.
    private offerBotReady = false;
    private offerClientSecret?: string;
    private async _ensureOfferBot(): Promise<string | undefined> {
        if (this.offerBotReady) {
            return this.offerClientSecret;
        }
        const realm = this.config.keycloak.realmName;
        const { clientId, botUser, botPassword, role: roleName } = this.config.offer;
        if (!botPassword) {
            throw new AppError('citizen.offer.botPassword is not configured', 500);
        }
        await this._authClient();

        const [client] = await this.adminClient.clients.find({ realm, clientId });
        if (!client?.id) {
            throw new Error(`Client '${clientId}' not found in realm '${realm}'`);
        }
        if (!client.directAccessGrantsEnabled) {
            await this.adminClient.clients.update({ realm, id: client.id }, { ...client, directAccessGrantsEnabled: true });
            logger.info(`Enabled direct access grants on client '${clientId}'`);
        }
        if (!client.publicClient) {
            this.offerClientSecret = (await this.adminClient.clients.getClientSecret({ realm, id: client.id })).value;
        }

        let [user] = await this.adminClient.users.find({ realm, username: botUser, exact: true });
        if (!user?.id) {
            await this.adminClient.users.create({
                realm, username: botUser, enabled: true, emailVerified: true,
                firstName: 'Onboarding', lastName: 'Offer bot', email: `${botUser}@invalid.local`,
            });
            [user] = await this.adminClient.users.find({ realm, username: botUser, exact: true });
            logger.info(`Created offer user '${botUser}' in realm '${realm}'`);
        }
        await this.adminClient.users.resetPassword({
            realm, id: user.id!, credential: { type: 'password', value: botPassword, temporary: false },
        });
        const role = await this.adminClient.roles.findOneByName({ realm, name: roleName });
        if (role?.id) {
            await this.adminClient.users.addRealmRoleMappings({ realm, id: user.id!, roles: [{ id: role.id, name: role.name! }] });
        }
        this.offerBotReady = true;
        return this.offerClientSecret;
    }
}

export const citizenService = new CitizenService(configService.get().citizen);
