import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import crypto from 'crypto';
import { CitizenConfig } from "../type/app-config";
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
    accountUrl: string;
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

    getAccountUrl(): string {
        const { baseUrl, realmName } = this.config.keycloak;
        return `${baseUrl}/realms/${realmName}/account`;
    }

    // Crea el usuario de la persona en el Keycloak de ciudadania: contraseña temporal,
    // grupo, roles de roles-dataspace, rol de ServiceCredential en el cliente del DID y
    // la credencial asignada para poder emitirla. Si algun paso falla, borra el usuario.
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
            credentials: [{ type: 'password', value: password, temporary: true }],
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
        return { username: email, password, accountUrl: this.getAccountUrl() };
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

    private async _authClient() {
        await this.adminClient.auth(this.config.keycloak.auth);
    }

    private _generatePassword(): string {
        const bytes = crypto.randomBytes(this.config.passwordLength);
        return Array.from(bytes).map(byte => PASSWORD_CHARSET[byte % PASSWORD_CHARSET.length]).join('');
    }
}

export const citizenService = new CitizenService(configService.get().citizen);
