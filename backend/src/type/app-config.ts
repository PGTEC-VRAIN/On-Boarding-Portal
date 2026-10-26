import ClientScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientScopeRepresentation";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import { Credentials } from "@keycloak/keycloak-admin-client/lib/utils/auth";
import { CorsOptions } from "cors";
import SMTPPool from "nodemailer/lib/smtp-pool";
import { DataSourceOptions } from "typeorm";
import { IssuerCredentials } from "./truster-issuer";

export interface AppConfig {
    server: ServerConfig
    logging: Logging
    app: AppCfg
    database: DataSourceOptions;
    email: EmailConfig;
    documentToSignUrl: string;
    didGenerator: DidGeneratorConfig
    citizen: CitizenConfig
}

export interface ServerConfig {
    port: number;
    staticPath: string;
    cors: CorsOptions;
    storage: StorageConfig;
    trustProxy: number | boolean;
    jsonBodyLimit: string;
}

export interface Logging {
    level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
}

export interface TilConfig {
    url: string;
    credentials?: IssuerCredentials[]
}
export interface AppCfg {
    login: LoginConfig;
    tir: TirConfig;
    til: TilConfig[];
    keycloak: KeycloakConfig;
    browserTitle: string;
    enableThemeToggle: boolean;
    documentToSignUrl: string;
    projectWebsiteUrl: string;
    marketplaceUrl: string;
    keycloakAdminUrl: string;
}

export interface LoginConfig {
    openIdUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    serverHost: string;
    defaultNamespace: string;
    codeChallenge: boolean;
}

export interface TirConfig {
    url: string;
}

export interface KeycloakConfig {
    didCreationEnabled: boolean;
    baseUrl: string;
    realmName: string;
    defaultRealmConfig: Omit<RealmRepresentation, 'realm' | 'id'>;
    auth: Credentials;
    keys: { curveType: string };
    realmNameLength: number;
    additionalClientScopes: ClientScope[];
    adminPasswordLength: number;
    adminEmailLifespan: string;
    adminUserConfig: UserRepresentation;
}

export interface StorageConfig {
    destFolder: string;
    maxSizeMB: number;
}

export interface MailTemplate {
    subject: string;
    html: string
}

export interface AdminNotificationConfig extends MailTemplate {
    enabled: boolean;
    // If set, notifications are sent to this address only. Otherwise, users of the admin
    // panel's login realm (parsed from `app.login.openIdUrl`) with an email are notified:
    // members of `keycloakGroup` if set, or every user in the realm if not.
    email?: string;
    keycloakGroup?: string;
}
export interface BaseEmailConfig {
    enabled: boolean;
    from: string;
    // Dirección a la que llegan las respuestas de los participantes (Reply-To).
    // Vacía: las respuestas van a `from`.
    replyTo?: string;
    update: MailTemplate
    submit: MailTemplate
    active: MailTemplate
    citizen: MailTemplate
    adminNotification: AdminNotificationConfig
}

export interface NodemailerConfig extends BaseEmailConfig {
    type: 'nodemailer';
    config: SMTPPool | SMTPPool.Options
}

export type EmailConfig = NodemailerConfig;

export interface DidGeneratorConfig {
    didWebHost: string
}

export interface ClientScope extends ClientScopeRepresentation {
    type?: 'default' | 'optional' | 'none'
}


// Flujo de ciudadania: una solicitud sin DID entra como persona fisica asociada a un
// unico participante ya registrado (`did`), y el portal le crea un usuario en el
// Keycloak de ese participante con la ServiceCredential y los roles configurados.
export interface CitizenConfig {
    enabled: boolean;
    // did:web del participante de ciudadania (registrado a mano en el TIR).
    did: string;
    keycloak: {
        baseUrl: string;
        // Realm donde se crean los usuarios.
        realmName: string;
        // Realm contra el que se autentica `auth` (master si es el admin de Keycloak).
        authRealm: string;
        auth: Credentials;
    };
    // Roles del cliente `roles-dataspace` que se asignan a cada ciudadano.
    dataspaceRoles: string[];
    credentialScope: string;
    group: string;
    // Longitud de la contraseña aleatoria que se envia por correo: Lissi lleva al ciudadano a
    // iniciar sesion en Keycloak al aceptar la credencial (flujo de codigo de autorizacion).
    passwordLength: number;
    // Ofertas de credencial: se crean con el cliente de Lissi (Keycloak ata la oferta al cliente que
    // la crea y Lissi inicia sesion con el suyo), con un usuario tecnico que se prepara solo.
    offer: {
        // Cliente con el que Lissi inicia sesion (en el realm es "Lissi ID Wallet").
        clientId: string;
        // Usuario tecnico que crea las ofertas, y su contraseña.
        botUser: string;
        botPassword: string;
        // Rol de realm que se le asigna.
        role: string;
        // true: oferta pre-autorizada (sin login). Lissi no la acepta (se detiene tras el token);
        // false: codigo de autorizacion, la wallet lleva al ciudadano a Keycloak a autenticarse.
        preAuthorized: boolean;
        // La oferta caduca dentro de tantos segundos. Keycloak espera en `expire` una fecha (Unix,
        // segundos): el portal envia ahora + expireSeconds.
        expireSeconds: number;
    };
    // Enlace "obtener mi credencial" del correo: firmado con `secret`, valido `ttlDays` dias.
    link: { secret: string; ttlDays: number };
}
