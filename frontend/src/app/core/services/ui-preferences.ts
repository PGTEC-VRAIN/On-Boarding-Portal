import { Injectable, signal } from '@angular/core';
import { getMetadata, getMetadataAsBoolean } from '../../../environments/metadata.service';

type ThemeMode = 'light' | 'dark';
type Language = 'en' | 'es';

type TranslationDict = Record<Language, Record<string, string>>;

@Injectable({
    providedIn: 'root',
})
export class UiPreferencesService {
    private static readonly THEME_STORAGE_KEY = 'onboarding.theme';
    private static readonly LANGUAGE_STORAGE_KEY = 'onboarding.lang';

    // Follows the operating system until the user picks a theme explicitly.
    private readonly systemDarkQuery =
        typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    private readonly currentTheme = signal<ThemeMode>(this.systemTheme());
    private followSystem = true;
    private readonly currentLanguage = signal<Language>('es');

    readonly projectWebsiteUrl =
        getMetadata<string>('projectWebsiteUrl', 'https://pgtec.webs.upv.es/') || 'https://pgtec.webs.upv.es/';
    // Empty by default: the catalogue link is only shown when it is configured.
    readonly marketplaceUrl = getMetadata<string>('marketplaceUrl', '') || '';
    readonly connectorRepositoryUrl = 'https://github.com/PGTEC-VRAIN';
    readonly keycloakAdminUrl = getMetadata<string>('keycloakAdminUrl', '') || '';
    readonly enableThemeToggle = getMetadataAsBoolean('enableThemeToggle', true) ?? true;

    readonly theme = this.currentTheme.asReadonly();
    readonly language = this.currentLanguage.asReadonly();

    private readonly translations: TranslationDict = {
        en: {
            'toolbar.portal': 'Data space onboarding portal',
            'toolbar.home': 'PGTEC, go to the home page',
            'toolbar.mainNav': 'Main',
            'toolbar.menu': 'Menu',
            'toolbar.navHow': 'How it works',
            'toolbar.navGovernance': 'Governance Framework',
            'toolbar.marketplace': 'Marketplace',
            'toolbar.admin': 'Sign in',
            'toolbar.adminAria': 'Sign in for data space administrators',
            'toolbar.start': 'Apply to join',
            'toolbar.logout': 'Logout',
            'toolbar.keycloakAdmin': 'Keycloak Admin',
            'toolbar.theme': 'Switch theme',
            'toolbar.themeLight': 'Switch to light mode',
            'toolbar.themeDark': 'Switch to dark mode',
            'toolbar.language': 'Language',
            'toolbar.langEnglish': 'English',
            'toolbar.langSpanish': 'Spanish',
            'common.newTab': '(opens in a new tab)',

            'landing.badge': 'Trusted data space',
            'landing.trustBadge': 'Listed in the CRED Trust List',
            'landing.trustLogoAlt': 'Trusted data space',
            'landing.title': 'Join the data space for climate emergency prevention',
            'landing.subtitle':
                'Share and consume meteorological, hydrological and environmental data with guarantees: a common Governance Framework, interoperable connectors and control over how your data is used.',
            'landing.ctaStart': 'Apply to join',
            'landing.ctaRequirements': 'What do I need?',
            'market.eyebrow': 'Also at PGTEC',
            'market.title': 'Marketplace',
            'market.desc': 'Catalogue of data and services in the data space. It is a service independent from joining.',
            'landing.governance':
                'Governance Framework v1.0 · approved on 02/02/2026 by the data space Governance Authority',
            'landing.logoAlt': 'PGTEC logo',
            'landing.rolesEyebrow': 'Participant profiles',
            'landing.rolesTitle': 'Two ways to take part in the data space',
            'landing.providerTitle': 'Data and service provider',
            'landing.providerDesc':
                'Publish data and services in the catalogue, set their terms of use and keep control over your assets.',
            'landing.providerPoint1': 'Publishing data and services in the catalogue',
            'landing.providerPoint2': 'Terms of use defined by you for each asset',
            'landing.providerPoint3': 'Audits and data quality checks',
            'landing.consumerTitle': 'Data and service consumer',
            'landing.consumerDesc':
                'Access meteorological, hydrological and environmental data to anticipate and manage climate emergencies.',
            'landing.consumerPoint1': 'Finding data and services in the catalogue',
            'landing.consumerPoint2': "Access under each provider's terms of use",
            'landing.consumerPoint3': 'Consumption through the data space connector',
            'landing.sameProcessTitle': 'A single joining process',
            'landing.sameProcessDesc':
                'Registration is the same for every organisation and everyone signs the same accession agreement, whether you will offer data, consume it or both.',
            'landing.howEyebrow': 'How it works',
            'landing.howTitle': 'Joining, in four steps',
            'landing.step1Title': 'Register your organisation',
            'landing.step1Desc': 'Entity details, contact email and digital identifier (DID).',
            'landing.step2Title': 'Sign the accession agreement',
            'landing.step2Desc': 'Review the agreement, sign it electronically and upload it to the portal.',
            'landing.step3Title': 'Verification',
            'landing.step3Desc': 'The data space Governance Authority reviews your application.',
            'landing.step4Title': 'Credentials and connection',
            'landing.step4Desc': 'Receive your credentials and connect your connector to the data space.',
            'landing.reqEyebrow': 'Before you start',
            'landing.reqTitle': 'Have this at hand',
            'landing.reqDownload': 'Download the accession agreement',
            'landing.reqEntityTitle': 'Entity details',
            'landing.reqEntityDesc': 'Legal name, tax ID and full postal address.',
            'landing.reqContactTitle': 'Contact email',
            'landing.reqContactDesc': 'It will receive the application notifications and, once approved, the credentials.',
            'landing.reqSignTitle': 'Electronic signature',
            'landing.reqSignDesc': "The legal representative's digital certificate to sign the PDF agreement.",
            'landing.reqDidTitle': 'DID identifier',
            'landing.reqDidDescOptional': 'Optional: if your organisation does not have one, we will generate it for you.',
            'landing.reqDidDescRequired': 'Decentralised identifier of your organisation (e.g. did:web).',

            'footer.logosLabel': 'Funding and institutions',
            'footer.links': 'Footer',
            'footer.funding': 'Funded by the European Union – NextGenerationEU.',
            'footer.governance': 'Governance Framework',
            'footer.agreement': 'Accession agreement (PDF)',
            'footer.status': 'Check an application',
            'footer.admin': 'Administration',
            'footer.project': 'Project website',
            'footer.rights': 'VRAIN · Universitat Politècnica de València',
            'footer.altEu': 'Funded by the European Union - NextGenerationEU',
            'footer.altSedia':
                'Government of Spain - Ministry of Economic Affairs and Digital Transformation - Secretary of State for Digitalisation and Artificial Intelligence',
            'footer.altPrtr': 'Recovery, Transformation and Resilience Plan',
            'footer.altUpv': 'Universitat Politècnica de València',
            'footer.altEdc': 'Trusted data space - CRED',

            'wizard.stepOf': 'Step {{current}} of {{total}}',
            'wizard.yourApplication': 'Your application',
            'wizard.step1': 'Organisation',
            'wizard.step1Desc': 'Entity details',
            'wizard.step2': 'Contact',
            'wizard.step2Desc': 'Email and digital identity',
            'wizard.step3': 'Agreement',
            'wizard.step3Desc': 'Signing the accession',
            'wizard.step4': 'Verification',
            'wizard.step4Desc': 'Review and credentials',
            'wizard.done': 'Completed',
            'wizard.current': 'In progress',
            'wizard.pending': 'Pending',
            'wizard.helpPrefix': 'Questions about joining? Visit the',
            'wizard.helpLink': 'PGTEC project website',
            'wizard.newPrompt': 'Registering another organisation?',
            'wizard.newLink': 'Start a new application',
            'wizard.orgTitle': 'Your organisation details',
            'wizard.orgLead':
                'These details identify your entity in the data space and will be reviewed together with the accession agreement.',
            'wizard.contactTitle': 'Contact and digital identity',
            'wizard.contactLead':
                'Tell us who to notify during the review and the identifier your organisation will use in the data space.',
            'wizard.contractTitle': 'Sign the accession agreement',
            'wizard.contractLead': 'Download the agreement, sign it electronically and upload it here.',
            'wizard.statusTitle': 'Your application status',
            'wizard.statusLead':
                'Follow the review of your application here and get your organisation ready to connect.',

            'submit.trackingId': 'Application ID',
            'submit.notFound': 'Registration request {{id}} not found',

            'form.entityGroup': 'Entity details',
            'form.name': 'Legal name of the entity',
            'form.namePlaceholder': 'Full legal name',
            'form.taxId': 'Tax ID (VAT / CIF)',
            'form.taxIdPlaceholder': 'e.g. ESQ4618002B',
            'form.country': 'Country',
            'form.countryPlaceholder': 'Spain',
            'form.address': 'Postal address',
            'form.addressPlaceholder': 'Street and number',
            'form.city': 'City',
            'form.cityPlaceholder': 'Valencia',
            'form.postCode': 'Postal code',
            'form.postCodePlaceholder': '46022',
            'form.contactGroup': 'Application contact',
            'form.adminEmail': 'Contact email',
            'form.emailPlaceholder': 'name@organisation.eu',
            'form.emailHint': 'It will receive the application notifications and, once approved, access to the credentials.',
            'form.didGroup': 'Digital identity',
            'form.did': 'Decentralised identifier (DID)',
            'form.optional': '(optional)',
            'form.didHint': 'Leave it empty and a DID will be generated automatically.',
            'form.didHintRequired': 'Format did:method:id, e.g. did:web:organisation.eu',
            'form.required': 'This field is required.',
            'form.minLength': 'Enter at least {{min}} characters.',
            'form.invalidEmail': 'Please enter a valid email address.',
            'form.invalidDid': 'Invalid DID format. It should follow did:method:id (e.g. did:web:example.com).',
            'form.contractTitle': 'PGTEC data space accession agreement',
            'form.contractMeta':
                'PDF · Includes the Governance Framework (Annex I), its procedures (Annex II) and the participant obligations (Annex III)',
            'form.viewContract': 'View agreement',
            'form.downloadPdf': 'Download PDF',
            'form.essentialsTitle': 'The essentials of what you sign',
            'form.essential1': 'Only publish data and services you are legitimately entitled to share.',
            'form.essential2': 'Register and keep the metadata of your assets in the catalogue up to date.',
            'form.essential3': 'Ensure the quality, consistency and freshness of the data you offer.',
            'form.essential4': 'Accept audits and verifications, and apply any resulting corrective measures.',
            'form.essential5': 'Comply with the security and privacy management procedure, especially for personal data.',
            'form.essentialsNote':
                'Accession is valid indefinitely and is subject to the procedures for participant continuity, review and exit.',
            'form.uploadTitle': 'Upload the signed agreement',
            'form.fileRequired': 'Attach the signed agreement in PDF format.',
            'form.accept1':
                'I have read and accept the data space Governance Framework (v1.0, approved on 02/02/2026) and the procedures that implement it.',
            'form.accept2':
                'I declare that the legal representative who signs the agreement is duly authorised to do so on behalf of the entity.',
            'form.acceptRequired': 'You must accept this statement to submit the application.',
            'form.next': 'Continue',
            'form.back': 'Back',
            'form.submit': 'Submit application',
            'form.submitting': 'Submitting…',
            'form.submitSuccessTitle': 'Application received',
            'form.submitSuccessDesc':
                'We have sent a confirmation email to the contact address. Keep this ID to check the status of your application.',
            'form.copyLabel': 'Application ID',
            'form.copyHint': 'Use this ID to check your application status.',
            'form.submitError': 'Error submitting the application',

            'track.calloutTitle': 'Already applied?',
            'track.calloutDesc': 'Check where your application stands using the ID you received by email.',
            'track.calloutAction': 'Check status',
            'track.searchTitle': 'Look up your application',
            'track.searchDesc': 'Enter the ID you received when you submitted your application.',
            'track.searchBtn': 'Look up',
            'track.application': 'Application {{id}}',
            'track.another': 'Look up another application',
            'track.detailsTitle': 'Application details',
            'track.meanwhile': 'In the meantime',
            'track.connectorTitle': 'Get your connector ready',
            'track.connectorDesc': 'Deployment guide for the data space FIWARE connector.',
            'track.connectorLink': 'View repository',
            'track.governanceTitle': 'Review the Governance Framework',
            'track.governanceDesc': 'Publication, catalogue and data quality procedures.',
            'track.governanceLink': 'Read the agreement',
            'track.projectTitle': 'Learn about PGTEC',
            'track.projectDesc': 'Data models, use cases and news from the data space.',
            'track.projectLink': 'Visit the website',
            'track.headline.submitted': 'We have received your application',
            'track.headline.under_review': 'Your application is under review',
            'track.headline.action_required': 'Your application needs changes',
            'track.headline.rejected': 'Your application has not been approved',
            'track.headline.active': 'Your organisation is now part of the data space',
            'track.note.default':
                'We will email you when the Governance Authority resolves your application. If more information is needed, you will be asked for it through this portal.',
            'track.note.action_required':
                'Click “Review” in the application details to correct the information or attach the agreement again.',
            'track.note.rejected': 'If you think this is a mistake, you can start a new application.',
            'track.note.active':
                'Check your inbox: you will find the links to manage the users of your organisation.',

            'status.submitted': 'Submitted',
            'status.under_review': 'Under review',
            'status.action_required': 'Action required',
            'status.rejected': 'Rejected',
            'status.active': 'Active',

            'timeline.sent': 'Application submitted',
            'timeline.sentDesc': '{{date}} · Organisation details registered',
            'timeline.contract': 'Signed agreement received',
            'timeline.contractDesc': '{{count}} document(s) attached',
            'timeline.contractMissing': 'The signed agreement has not been attached yet',
            'timeline.verification': 'Verification by the Governance Authority',
            'timeline.verificationPending': 'In progress · We will email you once it is resolved',
            'timeline.verificationAction': 'Changes needed: check the reason and update your application',
            'timeline.verificationRejected': 'Application rejected',
            'timeline.verificationDone': 'Application approved',
            'timeline.reason': 'Reason: {{reason}}',
            'timeline.credentials': 'Credential issuance',
            'timeline.credentialsPending': 'They will be sent to the contact email',
            'timeline.credentialsDone': 'Sent to the contact email',
            'timeline.connection': 'Connecting to the data space',
            'timeline.connectionDesc': 'Deploy your connector and publish your first assets',

            'upload.dropTitle': 'Drag the signed PDF here or browse',
            'upload.dropHint': 'Electronically signed by the legal representative · PDF, max {{size}} MB',
            'upload.remove': 'Remove {{name}}',
            'upload.preview': 'Preview {{name}}',
            'upload.select': 'Select',
            'upload.addMore': 'Add more',
            'upload.previewTooltip': 'Click to preview PDF',
            'upload.invalidType': 'File {{name}} is not a valid type.',
            'upload.invalidSize': 'File {{name}} exceeds {{size}}MB.',
            'upload.allowPopups': 'Please allow pop-ups to preview the PDF',

            'dashboard.title': 'Registration Requests',
            'dashboard.subtitle': 'Manage and monitor all onboarding applications',
            'dashboard.colEmail': 'Email address',
            'dashboard.colStatus': 'Status',
            'dashboard.colCreatedAt': 'Registration date',
            'dashboard.colUpdatedAt': 'Last update',
            'dashboard.colFiles': 'No. files',
            'dashboard.deleteTitle': 'Delete registration',
            'dashboard.deleteMessage': 'Are you sure you want to delete the registration for {{email}}? This action cannot be undone.',
            'dashboard.deleteConfirm': 'Delete',
            'dashboard.deleteSuccess': 'Registration deleted successfully',
            'dashboard.deleteError': 'Failed to delete registration',

            'review.back': 'Back to previous step',
            'review.title': 'Review Requests',
            'review.notFoundTitle': 'No request found',
            'review.notFoundBody':
                'We could not find details for the provided ID. It may have been deleted or you may not have permission to view it.',
            'review.backToDashboard': 'Back to dashboard',

            'details.summary': 'Summary',
            'details.companyInfo': 'Company Information',
            'details.registrationId': 'Registration ID',
            'details.did': 'Decentralized Identifier (DID)',
            'details.adminEmail': 'Administrative Email',
            'details.submissionDate': 'Submission date',
            'details.lastUpdate': 'Last update',
            'details.attachedDocs': 'Attached documents',
            'details.remove': 'Remove',
            'details.reasonLabel': 'This application needs review. Please update the information to resolve the issue.',
            'details.reasonRequired': 'A reason is required when status needs review.',
            'details.reasonRevision': 'Reason for revision',
            'details.reasonPlaceholder': 'Describe the action required from the organization',
            'details.reasonHint': 'Explain why this submission should be revised',
            'details.review': 'Review',
            'details.save': 'Save',
            'details.cancel': 'Cancel',
            'details.manageUsers': 'Manage Users & Groups',
            'details.updatedOk': 'Registration updated',
            'details.updatedFail': 'Registration update failed',
            'details.previewPdf': 'Click to preview PDF',

            'table.search': 'Search...',
            'table.clearFilters': 'Clear Filters',
            'table.noRecords': 'No records found.',

            'copy.label': 'Registration ID',
            'copy.notification': 'Copied to clipboard',
            'copy.tooltip': 'Copy to clipboard',

            'pdf.previewTitle': 'PDF preview',
            'pdf.openNewTab': 'Open in new tab',
            'pdf.openNewTabAria': 'Open PDF in new tab',
            'pdf.closeDialogAria': 'Close dialog',
            'pdf.invalid': 'The PDF file could not be loaded or is invalid.',
        },
        es: {
            'toolbar.portal': 'Portal de adhesión al espacio de datos',
            'toolbar.home': 'PGTEC, ir a la página de inicio',
            'toolbar.mainNav': 'Principal',
            'toolbar.menu': 'Menú',
            'toolbar.navHow': 'Cómo funciona',
            'toolbar.navGovernance': 'Marco de Gobernanza',
            'toolbar.marketplace': 'Marketplace',
            'toolbar.admin': 'Acceder',
            'toolbar.adminAria': 'Acceso para administradores del espacio de datos',
            'toolbar.start': 'Solicitar adhesión',
            'toolbar.logout': 'Cerrar sesión',
            'toolbar.keycloakAdmin': 'Admin Keycloak',
            'toolbar.theme': 'Cambiar tema',
            'toolbar.themeLight': 'Cambiar a modo claro',
            'toolbar.themeDark': 'Cambiar a modo oscuro',
            'toolbar.language': 'Idioma',
            'toolbar.langEnglish': 'Inglés',
            'toolbar.langSpanish': 'Español',
            'common.newTab': '(se abre en una pestaña nueva)',

            'landing.badge': 'Espacio de datos de confianza',
            'landing.trustBadge': 'Incluido en la Lista de confianza del CRED',
            'landing.trustLogoAlt': 'Espacio de datos de confianza',
            'landing.title': 'Únete al espacio de datos para la prevención de emergencias climáticas',
            'landing.subtitle':
                'Comparte y consume datos meteorológicos, hidrológicos y ambientales con garantías: un Marco de Gobernanza común, conectores interoperables y control sobre el uso de tus datos.',
            'landing.ctaStart': 'Solicitar adhesión',
            'landing.ctaRequirements': 'Qué necesito',
            'market.eyebrow': 'También en PGTEC',
            'market.title': 'Marketplace',
            'market.desc': 'Catálogo de datos y servicios del espacio de datos. Es un servicio independiente de la adhesión.',
            'landing.governance':
                'Marco de Gobernanza v1.0 · aprobado el 02/02/2026 por la Autoridad de Gobierno del espacio de datos',
            'landing.logoAlt': 'Logo de PGTEC',
            'landing.rolesEyebrow': 'Perfiles de participación',
            'landing.rolesTitle': 'Dos formas de participar en el espacio de datos',
            'landing.providerTitle': 'Proveedor de datos y servicios',
            'landing.providerDesc':
                'Publica datos y servicios en el catálogo, define sus condiciones de uso y mantén el control sobre tus activos.',
            'landing.providerPoint1': 'Publicación de datos y servicios en el catálogo',
            'landing.providerPoint2': 'Condiciones de uso definidas por ti para cada activo',
            'landing.providerPoint3': 'Auditorías y verificación de calidad del dato',
            'landing.consumerTitle': 'Consumidor de datos y servicios',
            'landing.consumerDesc':
                'Accede a datos meteorológicos, hidrológicos y ambientales para anticipar y gestionar emergencias climáticas.',
            'landing.consumerPoint1': 'Búsqueda de datos y servicios en el catálogo',
            'landing.consumerPoint2': 'Acceso según las condiciones de uso de cada proveedor',
            'landing.consumerPoint3': 'Consumo a través del conector del espacio de datos',
            'landing.sameProcessTitle': 'Un único proceso de adhesión',
            'landing.sameProcessDesc':
                'El registro es igual para todas las organizaciones y todas firman el mismo contrato de adhesión, tanto si vais a ofrecer datos como a consumirlos o ambas cosas.',
            'landing.howEyebrow': 'Cómo funciona',
            'landing.howTitle': 'La adhesión, en cuatro pasos',
            'landing.step1Title': 'Registra tu organización',
            'landing.step1Desc': 'Datos de la entidad, correo de contacto e identificador digital (DID).',
            'landing.step2Title': 'Firma el contrato de adhesión',
            'landing.step2Desc': 'Revisa el contrato, fírmalo electrónicamente y súbelo al portal.',
            'landing.step3Title': 'Verificación',
            'landing.step3Desc': 'La Autoridad de Gobierno del espacio de datos revisa tu solicitud.',
            'landing.step4Title': 'Credenciales y conexión',
            'landing.step4Desc': 'Recibe tus credenciales y conecta tu conector al espacio de datos.',
            'landing.reqEyebrow': 'Antes de empezar',
            'landing.reqTitle': 'Ten esto a mano',
            'landing.reqDownload': 'Descargar el contrato de adhesión',
            'landing.reqEntityTitle': 'Datos de la entidad',
            'landing.reqEntityDesc': 'Denominación, NIF/CIF y dirección postal completa.',
            'landing.reqContactTitle': 'Correo de contacto',
            'landing.reqContactDesc': 'Recibirá los avisos de la solicitud y, una vez aprobada, las credenciales.',
            'landing.reqSignTitle': 'Firma electrónica',
            'landing.reqSignDesc': 'Certificado digital del representante legal para firmar el contrato en PDF.',
            'landing.reqDidTitle': 'Identificador DID',
            'landing.reqDidDescOptional': 'Opcional: si tu organización no tiene uno, lo generamos por ti.',
            'landing.reqDidDescRequired': 'Identificador descentralizado de tu organización (por ejemplo, did:web).',

            'footer.logosLabel': 'Financiación e instituciones',
            'footer.links': 'Pie de página',
            'footer.funding': 'Financiado por la Unión Europea – NextGenerationEU.',
            'footer.governance': 'Marco de Gobernanza',
            'footer.agreement': 'Contrato de adhesión (PDF)',
            'footer.status': 'Consultar una solicitud',
            'footer.admin': 'Acceso administración',
            'footer.project': 'Web del proyecto',
            'footer.rights': 'VRAIN · Universitat Politècnica de València',
            'footer.altEu': 'Financiado por la Unión Europea - NextGenerationEU',
            'footer.altSedia':
                'Gobierno de España - Ministerio de Asuntos Económicos y Transformación Digital - Secretaría de Estado de Digitalización e Inteligencia Artificial',
            'footer.altPrtr': 'Plan de Recuperación, Transformación y Resiliencia',
            'footer.altUpv': 'Universitat Politècnica de València',
            'footer.altEdc': 'Espacio de datos de confianza - CRED',

            'wizard.stepOf': 'Paso {{current}} de {{total}}',
            'wizard.yourApplication': 'Tu solicitud',
            'wizard.step1': 'Organización',
            'wizard.step1Desc': 'Datos de la entidad',
            'wizard.step2': 'Contacto',
            'wizard.step2Desc': 'Correo e identidad digital',
            'wizard.step3': 'Contrato',
            'wizard.step3Desc': 'Firma de la adhesión',
            'wizard.step4': 'Verificación',
            'wizard.step4Desc': 'Revisión y credenciales',
            'wizard.done': 'Completado',
            'wizard.current': 'En curso',
            'wizard.pending': 'Pendiente',
            'wizard.helpPrefix': '¿Dudas con la adhesión? Visita la',
            'wizard.helpLink': 'web del proyecto PGTEC',
            'wizard.newPrompt': '¿Vas a registrar otra organización?',
            'wizard.newLink': 'Iniciar una nueva solicitud',
            'wizard.orgTitle': 'Datos de tu organización',
            'wizard.orgLead':
                'Estos datos identifican a tu entidad en el espacio de datos y se revisarán junto con el contrato de adhesión.',
            'wizard.contactTitle': 'Contacto e identidad digital',
            'wizard.contactLead':
                'Indica a quién avisaremos durante la revisión y el identificador con el que tu organización participará en el espacio de datos.',
            'wizard.contractTitle': 'Firma el contrato de adhesión',
            'wizard.contractLead': 'Descarga el contrato, fírmalo electrónicamente y súbelo aquí.',
            'wizard.statusTitle': 'Estado de tu solicitud',
            'wizard.statusLead':
                'Sigue aquí la revisión de tu adhesión y prepara la conexión de tu organización.',

            'submit.trackingId': 'Identificador de la solicitud',
            'submit.notFound': 'No se encontró la solicitud {{id}}',

            'form.entityGroup': 'Datos de la entidad',
            'form.name': 'Denominación de la entidad',
            'form.namePlaceholder': 'Nombre legal completo',
            'form.taxId': 'NIF / CIF',
            'form.taxIdPlaceholder': 'Ej. Q4618002B',
            'form.country': 'País',
            'form.countryPlaceholder': 'España',
            'form.address': 'Dirección postal',
            'form.addressPlaceholder': 'Calle y número',
            'form.city': 'Municipio',
            'form.cityPlaceholder': 'Valencia',
            'form.postCode': 'Código postal',
            'form.postCodePlaceholder': '46022',
            'form.contactGroup': 'Contacto de la solicitud',
            'form.adminEmail': 'Correo electrónico de contacto',
            'form.emailPlaceholder': 'nombre@entidad.es',
            'form.emailHint': 'Recibirá los avisos de la solicitud y, una vez aprobada, el acceso a las credenciales.',
            'form.didGroup': 'Identidad digital',
            'form.did': 'Identificador descentralizado (DID)',
            'form.optional': '(opcional)',
            'form.didHint': 'Si lo dejas vacío, el DID se generará automáticamente.',
            'form.didHintRequired': 'Formato did:método:id, por ejemplo did:web:entidad.es',
            'form.required': 'Este campo es obligatorio.',
            'form.minLength': 'Introduce al menos {{min}} caracteres.',
            'form.invalidEmail': 'Introduce un correo válido.',
            'form.invalidDid': 'Formato DID inválido. Debe seguir did:método:id (por ejemplo, did:web:example.com).',
            'form.contractTitle': 'Contrato de adhesión al espacio de datos PGTEC',
            'form.contractMeta':
                'PDF · Incluye el Marco de Gobernanza (Anexo I), sus procedimientos (Anexo II) y las obligaciones del participante (Anexo III)',
            'form.viewContract': 'Ver contrato',
            'form.downloadPdf': 'Descargar PDF',
            'form.essentialsTitle': 'Lo esencial de lo que firmas',
            'form.essential1': 'Publicar únicamente datos y servicios sobre los que tengas legitimidad suficiente.',
            'form.essential2': 'Registrar y mantener actualizados los metadatos de tus activos en el catálogo.',
            'form.essential3': 'Garantizar la calidad, coherencia y actualización de los datos ofrecidos.',
            'form.essential4': 'Aceptar auditorías y verificaciones, y aplicar las medidas correctoras que se deriven.',
            'form.essential5': 'Cumplir el procedimiento de gestión de seguridad y privacidad, especialmente con datos personales.',
            'form.essentialsNote':
                'La adhesión tiene vigencia indefinida y está sujeta a los procedimientos de permanencia, revisión y salida de participantes.',
            'form.uploadTitle': 'Sube el contrato firmado',
            'form.fileRequired': 'Adjunta el contrato firmado en formato PDF.',
            'form.accept1':
                'He leído y acepto el Marco de Gobernanza del espacio de datos (v1.0, aprobado el 02/02/2026) y los procedimientos que lo desarrollan.',
            'form.accept2':
                'Declaro que el representante legal que firma el contrato tiene capacidad suficiente para hacerlo en nombre de la entidad.',
            'form.acceptRequired': 'Debes aceptar esta declaración para enviar la solicitud.',
            'form.next': 'Continuar',
            'form.back': 'Atrás',
            'form.submit': 'Enviar solicitud',
            'form.submitting': 'Enviando…',
            'form.submitSuccessTitle': 'Solicitud recibida',
            'form.submitSuccessDesc':
                'Hemos enviado un correo de confirmación a la dirección de contacto. Guarda este identificador para consultar el estado de tu solicitud.',
            'form.copyLabel': 'Identificador de la solicitud',
            'form.copyHint': 'Usa este identificador para consultar el estado de tu solicitud.',
            'form.submitError': 'Error al enviar la solicitud',

            'track.calloutTitle': '¿Ya has enviado tu solicitud?',
            'track.calloutDesc': 'Consulta en qué punto está con el identificador que recibiste por correo.',
            'track.calloutAction': 'Consultar estado',
            'track.searchTitle': 'Consulta tu solicitud',
            'track.searchDesc': 'Introduce el identificador que recibiste al enviar la solicitud.',
            'track.searchBtn': 'Consultar',
            'track.application': 'Solicitud {{id}}',
            'track.another': 'Consultar otra solicitud',
            'track.detailsTitle': 'Datos de la solicitud',
            'track.meanwhile': 'Mientras tanto',
            'track.connectorTitle': 'Prepara tu conector',
            'track.connectorDesc': 'Guía de despliegue del conector FIWARE del espacio de datos.',
            'track.connectorLink': 'Ver repositorio',
            'track.governanceTitle': 'Repasa el Marco de Gobernanza',
            'track.governanceDesc': 'Procedimientos de publicación, catálogo y calidad del dato.',
            'track.governanceLink': 'Leer el contrato',
            'track.projectTitle': 'Conoce el proyecto PGTEC',
            'track.projectDesc': 'Modelos de datos, casos de uso y novedades del espacio de datos.',
            'track.projectLink': 'Visitar la web',
            'track.headline.submitted': 'Hemos recibido tu solicitud',
            'track.headline.under_review': 'Tu solicitud está en revisión',
            'track.headline.action_required': 'Tu solicitud necesita cambios',
            'track.headline.rejected': 'Tu solicitud no ha sido aprobada',
            'track.headline.active': 'Tu organización ya forma parte del espacio de datos',
            'track.note.default':
                'Te avisaremos por correo cuando la Autoridad de Gobierno resuelva tu solicitud. Si necesita más información, te la pedirá desde este portal.',
            'track.note.action_required':
                'Pulsa «Revisar» en los datos de la solicitud para corregir la información o adjuntar de nuevo el contrato.',
            'track.note.rejected': 'Si crees que se trata de un error, puedes iniciar una nueva solicitud.',
            'track.note.active':
                'Revisa tu correo: encontrarás los enlaces para gestionar los usuarios de tu organización.',

            'status.submitted': 'Enviada',
            'status.under_review': 'En verificación',
            'status.action_required': 'Acción requerida',
            'status.rejected': 'Rechazada',
            'status.active': 'Activa',

            'timeline.sent': 'Solicitud enviada',
            'timeline.sentDesc': '{{date}} · Datos de la organización registrados',
            'timeline.contract': 'Contrato firmado recibido',
            'timeline.contractDesc': '{{count}} documento(s) adjunto(s)',
            'timeline.contractMissing': 'Todavía no se ha adjuntado el contrato firmado',
            'timeline.verification': 'Verificación por la Autoridad de Gobierno',
            'timeline.verificationPending': 'En curso · Te avisaremos por correo cuando se resuelva',
            'timeline.verificationAction': 'Se necesitan cambios: revisa el motivo y actualiza tu solicitud',
            'timeline.verificationRejected': 'Solicitud rechazada',
            'timeline.verificationDone': 'Solicitud aprobada',
            'timeline.reason': 'Motivo: {{reason}}',
            'timeline.credentials': 'Emisión de credenciales',
            'timeline.credentialsPending': 'Se enviarán al correo de contacto',
            'timeline.credentialsDone': 'Enviadas al correo de contacto',
            'timeline.connection': 'Conexión al espacio de datos',
            'timeline.connectionDesc': 'Despliega tu conector y publica tus primeros activos',

            'upload.dropTitle': 'Arrastra aquí el PDF firmado o selecciónalo',
            'upload.dropHint': 'Firmado electrónicamente por el representante legal · PDF, máximo {{size}} MB',
            'upload.remove': 'Quitar {{name}}',
            'upload.preview': 'Previsualizar {{name}}',
            'upload.select': 'Seleccionar',
            'upload.addMore': 'Añadir más',
            'upload.previewTooltip': 'Clic para previsualizar PDF',
            'upload.invalidType': 'El archivo {{name}} no tiene un tipo válido.',
            'upload.invalidSize': 'El archivo {{name}} supera {{size}}MB.',
            'upload.allowPopups': 'Permite las ventanas emergentes para previsualizar el PDF',

            'dashboard.title': 'Listado de solicitudes',
            'dashboard.subtitle': 'Gestión y seguimiento de registros de onboarding',
            'dashboard.colEmail': 'Correo electrónico',
            'dashboard.colStatus': 'Estado',
            'dashboard.colCreatedAt': 'Fecha de registro',
            'dashboard.colUpdatedAt': 'Última actualización',
            'dashboard.colFiles': 'N. documentos',
            'dashboard.deleteTitle': 'Eliminar solicitud',
            'dashboard.deleteMessage': '¿Seguro que quieres eliminar la solicitud de {{email}}? Esta acción no se puede deshacer.',
            'dashboard.deleteConfirm': 'Eliminar',
            'dashboard.deleteSuccess': 'Solicitud eliminada correctamente',
            'dashboard.deleteError': 'No se pudo eliminar la solicitud',

            'review.back': 'Volver al paso anterior',
            'review.title': 'Revisión de solicitudes',
            'review.notFoundTitle': 'No se encontró la solicitud',
            'review.notFoundBody':
                'No se han encontrado detalles para el ID indicado. Puede haberse eliminado o no tienes permisos para verlo.',
            'review.backToDashboard': 'Volver al panel',

            'details.summary': 'Resumen',
            'details.companyInfo': 'Datos de empresa',
            'details.registrationId': 'ID de solicitud',
            'details.did': 'Identificador descentralizado (DID)',
            'details.adminEmail': 'Email administrativo',
            'details.submissionDate': 'Fecha de envío',
            'details.lastUpdate': 'Última actualización',
            'details.attachedDocs': 'Documentos adjuntos',
            'details.remove': 'Eliminar',
            'details.reasonLabel': 'La solicitud requiere revisión. Actualiza la información para resolver la incidencia.',
            'details.reasonRequired': 'El motivo es obligatorio cuando el estado requiere revisión.',
            'details.reasonRevision': 'Motivo de la revisión',
            'details.reasonPlaceholder': 'Indica la acción que debe realizar la entidad',
            'details.reasonHint': 'Explica por qué la solicitud debe pasar a revisión',
            'details.review': 'Revisar',
            'details.save': 'Guardar',
            'details.cancel': 'Cancelar',
            'details.manageUsers': 'Gestionar usuarios y grupos',
            'details.updatedOk': 'Registro actualizado',
            'details.updatedFail': 'Error al actualizar el registro',
            'details.previewPdf': 'Clic para previsualizar PDF',

            'table.search': 'Buscar...',
            'table.clearFilters': 'Limpiar filtros',
            'table.noRecords': 'No se encontraron registros.',

            'copy.label': 'ID de solicitud',
            'copy.notification': 'Copiado al portapapeles',
            'copy.tooltip': 'Copiar al portapapeles',

            'pdf.previewTitle': 'Vista previa PDF',
            'pdf.openNewTab': 'Abrir en nueva pestaña',
            'pdf.openNewTabAria': 'Abrir PDF en nueva pestaña',
            'pdf.closeDialogAria': 'Cerrar diálogo',
            'pdf.invalid': 'No se pudo cargar el PDF o es inválido.',
        },
    };

    constructor() {
        const storedTheme = this.readStorage(UiPreferencesService.THEME_STORAGE_KEY);
        if (this.enableThemeToggle && (storedTheme === 'light' || storedTheme === 'dark')) {
            this.followSystem = false;
            this.currentTheme.set(storedTheme);
        }
        this.systemDarkQuery?.addEventListener('change', () => {
            if (this.followSystem) {
                this.currentTheme.set(this.systemTheme());
                this.applyTheme();
            }
        });

        const storedLanguage = this.readStorage(UiPreferencesService.LANGUAGE_STORAGE_KEY);
        if (storedLanguage === 'en' || storedLanguage === 'es') {
            this.currentLanguage.set(storedLanguage);
        } else {
            this.currentLanguage.set(this.detectBrowserLanguage());
        }

        this.applyTheme();
        this.applyLanguage();
    }

    setLanguage(language: Language): void {
        this.currentLanguage.set(language);
        this.writeStorage(UiPreferencesService.LANGUAGE_STORAGE_KEY, language);
        this.applyLanguage();
    }

    toggleTheme(): void {
        const nextTheme: ThemeMode = this.currentTheme() === 'light' ? 'dark' : 'light';
        this.currentTheme.set(nextTheme);
        // Choosing the same theme as the system goes back to following the system.
        this.followSystem = nextTheme === this.systemTheme();
        if (this.followSystem) {
            this.removeStorage(UiPreferencesService.THEME_STORAGE_KEY);
        } else {
            this.writeStorage(UiPreferencesService.THEME_STORAGE_KEY, nextTheme);
        }
        this.applyTheme();
    }

    private systemTheme(): ThemeMode {
        return this.systemDarkQuery?.matches ? 'dark' : 'light';
    }

    t(key: string): string {
        const language: Language = this.currentLanguage();
        return this.translations[language][key] || this.translations.en[key] || key;
    }

    private detectBrowserLanguage(): Language {
        if (typeof navigator === 'undefined') {
            return 'es';
        }
        const preferred = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
        return preferred.startsWith('en') ? 'en' : 'es';
    }

    private applyTheme(): void {
        if (typeof document === 'undefined') {
            return;
        }
        document.documentElement.setAttribute('data-theme', this.currentTheme());
    }

    private applyLanguage(): void {
        if (typeof document === 'undefined') {
            return;
        }
        document.documentElement.setAttribute('lang', this.currentLanguage());
    }

    replace(key: string, params: Record<string, string | number>): string {
        return Object.entries(params).reduce((acc, [param, value]) => {
            return acc.replaceAll(`{{${param}}}`, String(value));
        }, this.t(key));
    }

    private readStorage(key: string): string | null {
        if (typeof localStorage === 'undefined') {
            return null;
        }
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    private removeStorage(key: string): void {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore storage errors in private mode or restricted environments.
        }
    }

    private writeStorage(key: string, value: string): void {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignore storage errors in private mode or restricted environments.
        }
    }
}
