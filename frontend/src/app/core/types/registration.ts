import { RegistrationStatus } from "./registration-status";

export interface Registration {
    id: string;
    email: string;
    did: string;
    status: RegistrationStatus;
    name: string;
    taxId: string;
    address: string;
    city: string;
    postCode: string;
    country: string;
    files?: FileMetadata[];
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
    adminUrl?: string;
    // true si el portal creó el realm y el DID (didCreationEnabled); false si el
    // DID lo aportó la organización.
    didGenerated?: boolean;
    // Persona de la ciudadania (sin organizacion ni conector).
    citizen?: boolean;
}

export interface FileMetadata {
    name: string;
    size: number;
    extension: string;
    createdAt: Date;
}