import { AfterLoad, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FileMetadata } from "../type/file-metadata";
import { configService } from "../service/config.service";
import { keycloakService } from "../service/keycloak.service";

const dbType = configService.get().database.type;
const DATE_COLUMN_TYPE = dbType === 'mysql' ? 'datetime' : 'timestamptz';

export enum RegistrationStatus {
    SUBMITTED = "submitted",
    UNDER_REVIEW = "under_review",
    ACTION_REQUIRED = "action_required",
    ACTIVE = "active",
    REJECTED = "rejected"
}

@Entity()
export class Registration {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    email!: string;

    // Null en las solicitudes de ciudadania (varias personas comparten un unico DID, que el
    // portal rellena al cargarlas); NULL no choca con la restriccion unique.
    @Column({ unique: true, nullable: true })
    did!: string;
    @Column({
        type: "enum",
        enum: RegistrationStatus,
        default: RegistrationStatus.SUBMITTED
    })
    status!: RegistrationStatus;

    @Column()
    name!: string;
    @Column()
    taxId!: string;
    @Column()
    address!: string;
    @Column()
    city!: string;
    @Column()
    postCode!: string;
    @Column()
    country!: string;

    @Column({ nullable: true })
    filesPath?: string;

    @Column({ default: false })
    didGenerated!: boolean

    // Persona de la ciudadania (sin DID propio ni organizacion).
    @Column({ default: false })
    citizen!: boolean
    // NIF/NIE opcional: permite entrar con certificado digital.
    @Column({ nullable: true })
    nif?: string
    @Column({ nullable: true, type: 'text' })
    reason?: string;
    @CreateDateColumn({ type: DATE_COLUMN_TYPE })
    createdAt?: Date;

    @UpdateDateColumn({ type: DATE_COLUMN_TYPE })
    updatedAt?: Date;

    files?: FileMetadata[];

    @AfterLoad()
    fillCitizenDid() {
        if (this.citizen && !this.did) {
            this.did = configService.get().citizen.did;
        }
    }

    adminUrl?: string;

    toJSON() {
        const { filesPath, ...registration } = this;
        if (this.status === RegistrationStatus.ACTIVE && this.didGenerated) {
            registration.adminUrl = keycloakService.getAdminUrl(this.did)
        }
        return registration;
    }
}