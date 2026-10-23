import { CitizenAccount } from "../service/citizen.service";
import { Registration, RegistrationStatus } from "../entity/registration.entity";

export interface MailContext {
    registration: Registration;
    previousState?: RegistrationStatus;
    serverOrigin: string;
    accountUrl?: string;
    adminUrl?: string;
    account?: CitizenAccount;
}