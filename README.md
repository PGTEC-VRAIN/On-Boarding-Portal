<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Apache 2.0 License][license-shield]][license-url]
[![Release][release-shield]][release-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/PGTEC-VRAIN/On-Boarding-Portal">
    <img src="frontend/public/logos/logo_PGTEC.png" alt="PGTEC logo" width="80">
  </a>

  <h3 align="center">PGTEC Onboarding Portal</h3>

  <p align="center">
    Self-service portal for organizations that want to join the PGTEC trusted data space.
    <br />
    <a href="#getting-started"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://onboarding.pgtec-vrain-dataspace.eu/">View Demo</a>
    &middot;
    <a href="https://github.com/PGTEC-VRAIN/On-Boarding-Portal/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/PGTEC-VRAIN/On-Boarding-Portal/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#onboarding-flow">Onboarding Flow</a></li>
        <li><a href="#configuration">Configuration</a></li>
        <li><a href="#enabling-dynamic-did-generation">Enabling Dynamic DID Generation</a></li>
        <li><a href="#running-with-docker">Running with Docker</a></li>
        <li><a href="#deploying-with-helm-kubernetes">Deploying with Helm (Kubernetes)</a></li>
        <li><a href="#releases">Releases</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![PGTEC Onboarding Portal screenshot][product-screenshot]](https://onboarding.pgtec-vrain-dataspace.eu/)

[PGTEC](https://pgtec.webs.upv.es/) (Plataforma para la Gestión de prevención Temprana de Emergencias Climáticas) is a VRAIN - Universitat Politècnica de València project that operates a trusted data space for meteorological, hydrological and environmental data, listed in the [CRED trusted data spaces list](https://cred.digital.gob.es/espacios-de-datos/lista-de-confianza-de-espacios-de-datos).

The Onboarding Portal is where an organization applies to join the data space. Upon approval, the platform provisions a dedicated Keycloak realm, generates a DID (`did:web`) and registers the organization in the Trust Issuer Registry (TIR).

Key features:
* **Guided application** in four steps: organization details, contact and DID, signed accession agreement, and status.
* **Application tracking** with a public status page (`/submit?id=<id>#search`) linked from every notification email.
* **Admin review panel** to approve, reject or request changes, protected by OpenID Connect.
* **Automatic provisioning** of the Keycloak realm, `did:web` identifier and TIR/TIL registration.
* **PGTEC design system**: brand tokens in `frontend/src/styles/_pgtec-tokens.scss`, light/dark theme that follows the operating system, Spanish and English.

The UI follows the design handoff in [docs/rediseño_pgtec-onboarding-handoff](docs/rediseño_pgtec-onboarding-handoff/HANDOFF.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Angular][Angular-shield]][Angular-url]
* [![TypeScript][TypeScript-shield]][TypeScript-url]
* [![Node.js][Node-shield]][Node-url]
* [![Express][Express-shield]][Express-url]
* [![PostgreSQL][PostgreSQL-shield]][PostgreSQL-url]
* [![Keycloak][Keycloak-shield]][Keycloak-url]
* [![Docker][Docker-shield]][Docker-url]
* [![Helm][Helm-shield]][Helm-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

The quickest way to get a local copy running is the Docker Compose stack (PostgreSQL + portal). To develop on the code, run the backend and the frontend separately.

### Prerequisites

| Dependency | Version | Purpose |
|---|---|---|
| Node.js | 22+ | Backend runtime |
| pnpm | 10+ | Package manager |
| PostgreSQL | 15+ | Data persistence |
| Keycloak | 26.4+ with OID4VC | Authentication & realm provisioning (see [OID4VCI model](#oid4vci-credential-model) below) |
| [did-helper](https://github.com/SEAMWARE/did-helper) | — | DID document hosting with Keycloak integration (see below) |
| SMTP server | any | Email notifications |
| TIR | — | Trust Issuer Registry (optional) |
| TIL | — | Trusted Issuers Lists — third-party registries notified alongside the TIR (optional, N endpoints) |

> **did-helper** must be configured with Keycloak integration enabled so that newly created realms can resolve their `did:web` documents. The portal calls did-helper to register the DID after provisioning each realm — without it, verifiable credential issuance will not work. Point `didGenerator.didWebHost` in `application.yaml` to the domain served by your did-helper instance.
>
> The following did-helper configuration is required to enable Keycloak-backed DID resolution:
>
> ```yaml
> config:
>   server:
>     runServer: "true"
>     didType: keycloak
>     keycloakHost: https://<your-keycloak-host>
>     outputFormat: "none"
> ```
>
> did-helper publishes each realm's verification method as `<did>#<kid>`, reading the `kid`
> straight from the realm's JWKS.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/PGTEC-VRAIN/On-Boarding-Portal.git
   cd On-Boarding-Portal
   ```
2. Start the local stack (PostgreSQL + portal, configured by `local/config/application.yaml`)
   ```sh
   make local-up
   ```
   The portal is available at `http://localhost:8082`. Stop it with `make local-down`, or `make local-reset` to also drop the data volumes.
3. For development, run the backend and the frontend separately
   ```sh
   # Terminal 1 — backend (TypeScript watch mode)
   cd backend && pnpm install && pnpm run dev

   # Terminal 2 — frontend (Angular dev server with hot reload)
   cd frontend && pnpm install && pnpm start
   ```
   In development the frontend calls the backend at `http://localhost:8080` (see `frontend/src/environments/environment.ts`).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE -->
## Usage

### Onboarding Flow

The following describes the end-to-end lifecycle of an organization joining the trust infrastructure.

> **DID-provided registrations:** This full workflow only applies when the applicant does **not** supply a DID at registration time. If a DID is provided, the portal skips Keycloak realm provisioning entirely (Steps 2–4 below are not performed). TIR registration still occurs in both cases.

> **Dynamic DID creation:** By default the registration form requires the applicant to supply an existing DID. To let the portal generate one automatically, enable the `didCreationEnabled` flag — see [Enabling Dynamic DID Generation](#enabling-dynamic-did-generation).

#### Step 1 — Registration request

A representative of the new organization fills in the registration form in the portal and submits it. The portal saves the request and sends a confirmation email to the applicant.

#### Step 2 — Admin review

A portal administrator reviews the pending request in the admin panel. Once satisfied, the admin approves the application. The portal then automatically:

- Provisions a dedicated Keycloak realm for the organization.
- Generates a `did:web` identifier and registers it with the did-helper.
- Registers the organization in the Trust Issuer Registry (TIR).

#### Step 3 — Welcome emails

Upon approval the organization contact receives **two emails**:

1. **Keycloak email** — sent by the newly provisioned realm asking the user to verify their information and set a password (triggered by the `VERIFY_EMAIL` and `UPDATE_PASSWORD` required actions configured in `adminUserConfig`).
2. **Portal activation email** — sent by the portal with two action buttons:
   - **Admin panel** — opens the Keycloak admin console for the organization's realm.
   - **Credentials** — opens the credential issuance interface.

> **Email delivery:** For Keycloak to send the verification email, the SMTP server must be configured in `app.keycloak.defaultRealmConfig.smtpServer`. Without it, the Keycloak email in step 3 will not be delivered. Example:
> ```yaml
> app:
>   keycloak:
>     defaultRealmConfig:
>       smtpServer:
>         auth: true
>         from: onboarding@seamware.io
>         fromDisplayName: Onboarding Auth
>         host: smtp.ethereal.email
>         password: ${EMAIL_PASSWORD}
>         port: 587
>         ssl: false
>         starttls: true
>         user: ${EMAIL_USER}
> ```

> **Important:** The default admin user created automatically in each realm (configured via `app.keycloak.adminUserConfig`) has realm-management privileges but **cannot issue Verifiable Credentials**. VC issuance requires a regular user with the `consumer` role assigned (see Step 4).

#### Step 4 — User provisioning

The organization admin must log into the Keycloak admin console and create end users within their realm. Each user that needs to issue VCs must be assigned the **`consumer`** role, which is defined by default in the provisioned realm.

```
Admin console → Users → Add user → Assign role: consumer
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Configuration

#### Full configuration reference

```yaml
# ──────────────────────────────────────────────
# HTTP Server
# ──────────────────────────────────────────────
server:
  port: 8080               # Listening port
  staticPath: ./static     # Path to the compiled Angular build
  trustProxy: 1            # Number of trusted proxy hops (set to 1 behind a load balancer)
  jsonBodyLimit: 100kb     # Maximum JSON request body size
  storage:
    destFolder: files      # Root folder for uploaded files (relative to cwd)
    maxSizeMB: 5           # Maximum size per uploaded file in MB
  cors:
    origin: "*"            # Allowed origins. Use a specific URL in production
    methods: [GET, POST, PUT, DELETE, OPTIONS]
    allowedHeaders: [Content-Type, Authorization, X-Organization]
    credentials: true
    maxAge: 600            # Preflight cache TTL (seconds)

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
logging:
  level: info              # error | warn | info | http | verbose | debug

# ──────────────────────────────────────────────
# Database (PostgreSQL)
# ──────────────────────────────────────────────
database:
  type: postgres
  host: localhost
  port: 5432
  username: postgres
  password: postgres
  database: onboarding
  synchronize: true        # Auto-sync schema on startup. Set to false in production
  logging: false           # Log SQL queries
  timezone: "Z"            # Force UTC for date storage (required for MySQL; ignored by PostgreSQL)

# ──────────────────────────────────────────────
# Application
# ──────────────────────────────────────────────
app:
  documentToSignUrl: https://...  # URL of the document users must accept at registration

  # OIDC login (used for admin access)
  login:
    openIdUrl: https://<keycloak>/realms/<realm>   # OpenID Connect discovery URL
    clientId: onboarding                           # OIDC client ID
    clientSecret: <secret>                         # OIDC client secret
    scope: openid                                  # Requested OIDC scope
    codeChallenge: true                            # Enable PKCE (recommended)

  # Keycloak admin connection (used to provision realms)
  keycloak:
    baseUrl: https://<keycloak>
    realmName: master                # Realm where the admin client lives
    auth:
      username: <admin-user>
      password: <admin-password>
      grantType: password
      clientId: admin-cli
      realmName: master  # Realm where the admin user exists and has admin privileges.
                         # The user must have permission to create and delete realms
                         # (typically the built-in "admin" user in the master realm).

    # Enable dynamic DID creation during realm provisioning.
    # When false (default), applicants must supply their own DID at registration time.
    didCreationEnabled: false

    # Generated realm settings
    realmNameLength: 36              # Length of randomly generated realm names
    adminPasswordLength: 30          # Length of generated admin passwords
    adminEmailLifespan: 72h          # Expiry of the admin welcome email action link

    # Admin user created inside each provisioned realm
    adminUserConfig:
      enabled: true                  # Create the admin user (disable to skip user creation)
      username: admin                # Username for the realm admin
      emailVerified: false           # Whether the email is pre-verified
      groups:
        - /admin
      clientRoles:                   # Client roles assigned to the admin user
        realm-management:
          - manage-users
          - query-groups
          - query-users
          - view-users
        account:
          - manage-account
          - view-groups
          - view-profile
      realmRoles: []
      requiredActions:               # Actions forced on first login
        - VERIFY_EMAIL
        - UPDATE_PASSWORD

    # Elliptic curve for signing keys
    keys:
      curveType: P-256               # P-256 | P-384 | P-521

    # Client scopes created through the Admin API *after* the realm exists, then attached to
    # every client in it. Reserved for `openid-connect` scopes: OID4VC credential scopes belong
    # in `defaultRealmConfig.clientScopes` (the realm import does not enforce a protocol match
    # between a client and its scopes).
    additionalClientScopes: []

    # Template applied to every newly created Keycloak realm
    defaultRealmConfig:
      enabled: true                        # Activate the realm immediately after creation
      verifiableCredentialsEnabled: true   # Enable OID4VC on the realm
      attributes:
        preAuthorizedCodeLifespanS: 120    # Pre-authorized code lifetime (seconds)
        issuerDid: ${DID}                  # Resolved at runtime — see placeholder table below
      clients:
        - clientId: ${DID}               # One OIDC client per realm, keyed by its DID
          enabled: true
          protocol: openid-connect
          publicClient: false
          serviceAccountsEnabled: true
          directAccessGrantsEnabled: true
          attributes:
            oid4vci.enabled: "true"      # Required by KC 26.4+ for /create-credential-offer
          optionalClientScopes:          # Optional, NOT default: a credential scope in
            - LegalPersonCredential      # defaultClientScopes is rejected by Keycloak
      # One ClientScope with `protocol: oid4vc` per issuable credential — the KC 26.4+ model
      # (keycloak#39768). Declared inside the realm import so the scope already exists when the
      # clients referencing it are created.
      clientScopes:
        - name: LegalPersonCredential    # The scope name IS the credential_configuration_id
          description: OID4VC scope that issues the LegalPersonCredential.
          protocol: oid4vc
          attributes:
            include.in.token.scope: "true"
            display.on.consent.screen: "false"
            vc.issuer_did: ${DID}
            vc.format: dc+sd-jwt                                  # OID4VCI 1.0 SD-JWT VC id
            vc.verifiable_credential_type: LegalPersonCredential   # drives the SD-JWT `vct`
            vc.supported_credential_types: LegalPersonCredential   # drives the JWT-VC `type[]`
            vc.credential_signing_alg: ES256
            vc.credential_build_config.token_jws_type: dc+sd-jwt
            # Both on purpose: the admin console shows expiry_in_seconds, but the `exp` of the
            # issued credential comes from refresh_interval_in_seconds.
            vc.expiry_in_seconds: "31536000"
            vc.refresh_interval_in_seconds: "31536000"
            # Red list of KC 26.4+: iss,iat,nbf,exp,cnf,vct,status must NOT be undisclosed, or
            # issuance aborts with "UndisclosedClaims contains red listed claim names".
            vc.credential_build_config.sd_jwt.visible_claims: "iss,iat,nbf,exp,cnf,vct,status,roles,email"
            vc.credential_build_config.sd_jwt.number_of_decoys: "3"
            vc.binding_required: "true"                           # holder binding (PoP)
            vc.binding_required_proof_types: jwt
            vc.cryptographic_binding_methods_supported: jwk
          protocolMappers:               # OID4VC mappers for SD-JWT credential issuance
            - name: context-mapper
              protocol: oid4vc
              protocolMapper: oid4vc-context-mapper
              config:
                context: https://www.w3.org/2018/credentials/v1
            - name: firstName-mapper
              protocol: oid4vc
              protocolMapper: oid4vc-user-attribute-mapper
              config:
                claim.name: firstName
                userAttribute: firstName
            - name: email-mapper
              protocol: oid4vc
              protocolMapper: oid4vc-user-attribute-mapper
              config:
                claim.name: email
                userAttribute: email
            - name: lastName-mapper
              protocol: oid4vc
              protocolMapper: oid4vc-user-attribute-mapper
              config:
                claim.name: lastName
                userAttribute: lastName
            - name: role-mapper
              protocol: oid4vc
              protocolMapper: oid4vc-target-role-mapper
              config:
                claim.name: roles
                clientId: ${DID}
      defaultDefaultClientScopes: [acr, roles, role_list, email, web-origins, profile]
      defaultOptionalClientScopes: [LegalPersonCredential]
      groups:
        - name: admin                      # Admin group with realm-management roles
          clientRoles:
            realm-management:
              - manage-users
              - manage-realm
              - query-users
              - query-groups
              - view-users
      smtpServer:
        host: smtp.example.com
        port: "587"
        auth: "true"
        user: <smtp-user>
        password: <smtp-password>
        starttls: "true"
        ssl: "false"
        from: keycloak@example.com
        fromDisplayName: Keycloak Auth

  # Trust Issuer Registry
  tir:
    url: http://<tir-host>

  # Trusted Issuers Lists (optional): third-party registries notified alongside the TIR
  # on register/unregister. Each entry gets its own request, run in parallel. A failure
  # on one entry is logged and does not affect the others or the TIR registration —
  # unlike the TIR, a TIL failure never rolls back the realm or aborts registration.
  til:
    - url: http://<til-host-1>
      # Optional: credentials to register for this TIL specifically. Defaults to an
      # empty list (same as the TIR) when omitted.
      credentials:
        - credentialsType: LegalPersonCredential
    - url: http://<til-host-2>

# ──────────────────────────────────────────────
# Email (Nodemailer)
# ──────────────────────────────────────────────
email:
  enabled: true            # Set to false to disable all emails
  type: nodemailer
  from: onboarding@example.com
  config:
    service: Gmail         # Nodemailer service shorthand, or omit and use host/port
    auth:
      user: <smtp-user>
      pass: <smtp-password>
  # Custom email templates (optional — defaults are embedded)
  submit:
    subject: "OnBoarding Portal - Registration submitted"
    html: "file://./templates/submit.html"
  update:
    subject: "OnBoarding Portal - Registration updated"
    html: "file://./templates/update.html"
  active:
    subject: "OnBoarding Portal - Registration activated"
    html: "file://./templates/active.html"
  # Notifies portal admins whenever a new registration is submitted (independent toggle
  # from `email.enabled` above, but sending still requires it to be true — same transport
  # is reused).
  adminNotification:
    enabled: false
    # If set, notifications go only to this address.
    email: admins@example.com
    # Otherwise, users of the admin panel's login realm (parsed from `app.login.openIdUrl`,
    # looked up via the same Keycloak admin client used to provision realms) with an email
    # set are notified: members of this group if set, or every user in the realm if omitted.
    keycloakGroup: admin
    subject: "OnBoarding Portal - New registration received"
    html: "file://./templates/admin-notification.html"

# ──────────────────────────────────────────────
# DID generation
# ──────────────────────────────────────────────
didGenerator:
  didWebHost: did:web:example.com    # Base domain for generated did:web identifiers
```

#### Environment variable substitution

Any value in the YAML can reference an environment variable using `${VAR_NAME}`:

```yaml
database:
  password: ${DB_PASSWORD}
```

If the variable is not set the literal string `${DB_PASSWORD}` is used — make sure all substitutions are resolved before starting the app.

#### Keycloak realm template variables

Several fields inside `app.keycloak.defaultRealmConfig` and `app.keycloak.additionalClientScopes` contain `${DID}`, `${REALM}`, and `${ID}` placeholders. These are **not** environment variables and must not be replaced by the operator — they are resolved automatically at runtime each time a new Keycloak realm is provisioned:

| Placeholder | Resolved value |
|---|---|
| `${DID}` | Full `did:web` identifier of the newly created realm (e.g. `did:web:example.com:my-realm`). Derived from `didGenerator.didWebHost` and the generated realm name. |
| `${REALM}` | Randomly generated realm name (alphanumeric string, length controlled by `keycloak.realmNameLength`). Used as the Keycloak realm identifier. |
| `${ID}` | Same value as `${REALM}`. Used wherever Keycloak requires the internal realm ID. |

These placeholders allow the realm template to reference its own DID and name without hardcoding them, so every provisioned realm gets its own correctly scoped client and credential configuration.

#### OID4VCI credential model

The realm template targets the OID4VCI model introduced in **Keycloak 26.4**
([keycloak#39768](https://github.com/keycloak/keycloak/pull/39768)) and is **not backwards
compatible with Keycloak ≤26.3**. Realms provisioned by this portal will not issue credentials on
an older server.

What changed, and where it lives now:

| Pre-26.4 | 26.4+ |
|---|---|
| Realm attributes `vc.<name>.*` | Attributes of a ClientScope with `protocol: oid4vc` (`defaultRealmConfig.clientScopes`) |
| `components['…credentialbuilder.CredentialBuilder']` | Removed — builders are loaded through the SPI service loader |
| `format: vc+sd-jwt` / `jwt_vc` | `format: dc+sd-jwt` / `jwt_vc_json` |
| `vct` + `scope` | `vc.verifiable_credential_type` + `vc.supported_credential_types` |
| `credential_signing_alg_values_supported` | `vc.credential_signing_alg` |
| `credential_build_config.decoys` | `vc.credential_build_config.sd_jwt.number_of_decoys` |
| `credential_build_config.proof_types_supported` | `vc.binding_required`, `vc.binding_required_proof_types`, `vc.cryptographic_binding_methods_supported` |
| mapper `config.subjectProperty` | mapper `config.claim.name` |
| mapper `config.supportedCredentialTypes` | Removed — a mapper belongs to exactly one ClientScope, so membership is structural |
| — | Clients need `attributes.oid4vci.enabled: "true"` to opt into issuance |
| — | Users need a `verifiableCredentials` list; the portal fills it in for the realm admin |

Keycloak **ignores unknown attributes silently**, so a realm built from a pre-26.4 template is
created without errors but issues nothing. See
[`oid4vc-protocol-mappers.md`](https://github.com/SEAMWARE/data-space-connector/blob/main/doc/keycloak/oid4vc-protocol-mappers.md)
in the Data Space Connector docs for the full mapper reference.

**Required Keycloak feature flags.** The server must be started with all three:

```
--features=oid4vc-vci,oid4vc-vci-preauth-code,oid4vc-vci-rest-credential-offer
```

Without `oid4vc-vci-rest-credential-offer` the `/protocol/oid4vc/create-credential-offer`
endpoint answers `403 invalid_client`.

> **Known gap:** only the realm admin the portal creates gets a `verifiableCredentials` list.
> Users added later from the organization's own Keycloak console will not be able to obtain the
> credential until that list is set on them — Keycloak offers no realm-wide default.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Enabling Dynamic DID Generation

By default (`didCreationEnabled: false`) the registration form requires applicants to provide an existing DID. When dynamic generation is enabled, the portal creates a `did:web` identifier automatically during realm provisioning, so applicants do not need to supply one.

#### Prerequisites

- A running [did-helper](https://github.com/SEAMWARE/did-helper) instance with Keycloak integration enabled. Without it the generated DID cannot be resolved and VC issuance will fail.

#### Configuration

1. Set the flag in `application.yaml`:

   ```yaml
   app:
     keycloak:
       didCreationEnabled: true
   ```

2. Point `didGenerator.didWebHost` at the domain served by your did-helper instance:

   ```yaml
   didGenerator:
     didWebHost: did:web:example.com   # base domain for generated did:web identifiers
   ```

   At provisioning time the portal derives the full DID by appending the generated realm name: `did:web:example.com:<realm-name>`.

#### Behavior when the flag is `false` (default)

- The registration form shows a DID input field and will not accept submissions without one.
- The portal skips DID generation entirely on approval; the applicant-supplied DID is used for Keycloak realm configuration and TIR registration.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Running with Docker

Build the image (multi-stage: compiles the backend and bundles the frontend):

```sh
docker build -t onboarding-pgtec:0.1 .
```

Run the container:

```sh
docker run -p 8080:8080 \
  -v $(pwd)/backend/src/config/application.yaml:/app/application.yaml \
  -v $(pwd)/files:/app/files \
  onboarding-pgtec:0.1
```

The application is available at `http://localhost:8080`.

> Mount a host directory to `/app/files` to persist uploaded files across container restarts.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Deploying with Helm (Kubernetes)

The `chart/` directory contains a production-ready Helm chart (see [chart/README.md](chart/README.md) for every value).

```sh
helm upgrade --install onboarding-pgtec ./chart \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=onboarding.example.com \
  -f my-values.yaml
```

Key `values.yaml` options:

```yaml
replicaCount: 1

image:
  repository: ghcr.io/pgtec-vrain/onboarding-pgtec
  tag: "0.1"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: nginx
  hosts:
    - host: onboarding.example.com
      paths:
        - path: /
          pathType: Prefix

# Mount an application.yaml via ConfigMap
config:
  app:
    login:
      openIdUrl: https://...
  database:
    host: postgres
    ...

# Inject secrets as environment variables (referenced in config via ${VAR})
secrets:
  - name: onboarding-secrets   # existing Kubernetes Secret
    keys:
      - DB_PASSWORD
      - APP_CLIENT_SECRET
      - APP_KEYCLOAK_PASSWORD

persistence:
  enabled: true                # Mount a PVC for uploaded files
  size: 5Gi
  storageClass: ""
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Releases

Versioning starts at `0.1`. Pushing a tag named `onboarding-pgtec-<version>` from `main` runs the [release workflow](.github/workflows/release.yaml), which:

* builds and pushes the multi-arch image `ghcr.io/pgtec-vrain/onboarding-pgtec:<version>`;
* packages the Helm chart with `version: <version>.0` and `appVersion: <version>` and pushes it to `oci://ghcr.io/pgtec-vrain/helm`.

```sh
git tag onboarding-pgtec-0.1
git push origin onboarding-pgtec-0.1
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] PGTEC branding and redesigned public portal (v0.1)
- [x] Light/dark theme following the operating system
- [ ] Support contact address and estimated verification time in the status page
- [ ] Decide whether the participant profile (provider/consumer), legal representative and technical contact must be stored with the application
- [ ] Links to the data space catalogue and help pages once they are published

See the [open issues](https://github.com/PGTEC-VRAIN/On-Boarding-Portal/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are welcome. If you have a suggestion that would make this better, please fork the repo and create a pull request, or open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Top contributors:

<a href="https://github.com/PGTEC-VRAIN/On-Boarding-Portal/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PGTEC-VRAIN/On-Boarding-Portal" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the Apache License 2.0. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

PGTEC - VRAIN, Universitat Politècnica de València - [pgtec.webs.upv.es](https://pgtec.webs.upv.es/)

Project Link: [https://github.com/PGTEC-VRAIN/On-Boarding-Portal](https://github.com/PGTEC-VRAIN/On-Boarding-Portal)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [SEAMWARE On-Boarding-Portal](https://github.com/SEAMWARE/On-Boarding-Portal), the upstream project this portal is based on
* [did-helper](https://github.com/SEAMWARE/did-helper) and the [FIWARE Data Space Connector](https://github.com/FIWARE/data-space-connector)
* [Centro de Referencia de Espacios de Datos (CRED)](https://cred.digital.gob.es/)
* Funded by the European Union - NextGenerationEU, within the Recovery, Transformation and Resilience Plan
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [Img Shields](https://shields.io)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/PGTEC-VRAIN/On-Boarding-Portal.svg?style=for-the-badge
[contributors-url]: https://github.com/PGTEC-VRAIN/On-Boarding-Portal/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/PGTEC-VRAIN/On-Boarding-Portal.svg?style=for-the-badge
[forks-url]: https://github.com/PGTEC-VRAIN/On-Boarding-Portal/network/members
[stars-shield]: https://img.shields.io/github/stars/PGTEC-VRAIN/On-Boarding-Portal.svg?style=for-the-badge
[stars-url]: https://github.com/PGTEC-VRAIN/On-Boarding-Portal/stargazers
[issues-shield]: https://img.shields.io/github/issues/PGTEC-VRAIN/On-Boarding-Portal.svg?style=for-the-badge
[issues-url]: https://github.com/PGTEC-VRAIN/On-Boarding-Portal/issues
[license-shield]: https://img.shields.io/github/license/PGTEC-VRAIN/On-Boarding-Portal.svg?style=for-the-badge
[license-url]: https://github.com/PGTEC-VRAIN/On-Boarding-Portal/blob/main/LICENSE
[release-shield]: https://img.shields.io/github/v/tag/PGTEC-VRAIN/On-Boarding-Portal.svg?style=for-the-badge&label=release
[release-url]: https://github.com/PGTEC-VRAIN/On-Boarding-Portal/tags
[product-screenshot]: imgs/onboading-portal.png
[Angular-shield]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.dev/
[TypeScript-shield]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Node-shield]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[Node-url]: https://nodejs.org/
[Express-shield]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[PostgreSQL-shield]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Keycloak-shield]: https://img.shields.io/badge/Keycloak-4D4D4D?style=for-the-badge&logo=keycloak&logoColor=white
[Keycloak-url]: https://www.keycloak.org/
[Docker-shield]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
[Helm-shield]: https://img.shields.io/badge/Helm-0F1689?style=for-the-badge&logo=helm&logoColor=white
[Helm-url]: https://helm.sh/
