# Verifi – Secure Authentication System

Verifi is a secure authentication web application built with Next.js that provides email-based registration, OTP verification, and passkey authentication. It supports passwordless login using device biometrics or screen-lock authentication and enforces a single active session per user.

## 🚀 Live Demo

[View Live Application](https://verifi-secure-authentication-system.vercel.app/)

## ✨ Features

- **User Registration:** Register using an email address, surname, and date of birth.
- **Email OTP Verification:** Verify email addresses using a six-digit OTP sent to the registered email.
- **OTP Login:** Authenticate users using a six-digit email verification code.
- **Passkey Authentication:** Register and log in using WebAuthn passkeys, supporting fingerprint, Face ID, or device PIN depending on the device authenticator.
- **Single Active Session:** Allows only one active session per user. Logging in from another device invalidates the previous session.
- **Secure Session Management:** Uses HTTP-only cookies and securely hashed session tokens.
- **Protected Dashboard:** Restricts dashboard access to authenticated users.
- **Profile API:** Provides access to authenticated user profile information.
- **Logout:** Securely terminates the active session.
- **OTP Security:** Includes OTP expiration, resend cooldown, and attempt limits.

## 🛠️ Tech Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend**
- Next.js API Routes
- Node.js

**Database**
- MongoDB
- Mongoose

**Authentication & Security**
- WebAuthn
- SimpleWebAuthn
- Node.js Crypto
- Zod

**Email Service**
- Nodemailer

**Deployment**
- Vercel
- MongoDB Atlas

## 📁 Project Structure

```text
verifi-secure-authentication-system/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   ├── verify-otp/
│   │   │   ├── resend-otp/
│   │   │   ├── login/
│   │   │   ├── verify-login-otp/
│   │   │   ├── logout/
│   │   │   └── profile/
│   │   │
│   │   └── webauthn/
│   │       ├── register-options/
│   │       ├── register-verify/
│   │       ├── login-options/
│   │       └── login-verify/
│   │
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── verify-email/
│   └── verify-login/
│
├── components/
│   ├── PasskeyLogin.tsx
│   ├── PasskeyRegistration.tsx
│   └── LogoutButton.tsx
│
├── lib/
│   ├── auth.ts
│   ├── database.ts
│   └── mailer.ts
│
├── models/
│   ├── User.ts
│   ├── OTP.ts
│   ├── session.ts
│   ├── Passkey.ts
│   └── WebAuthnChallenge.ts
│
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/irfanzmohammed/verifi-secure-authentication-system.git
```

### 2. Navigate to the Project Directory

```bash
cd verifi-secure-authentication-system
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root and configure the following variables:

```env
MONGODB_URI=your_mongodb_connection_string

EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password

OTP_SECRET=your_secure_random_secret

WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

For local development, use the appropriate MongoDB connection string and Gmail app password.

**Note:** Never commit your actual `.env` file or expose your credentials publicly.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication Flow

1. A user registers with their email address, surname, and date of birth.
2. A six-digit OTP is sent to the registered email address.
3. After successful verification, the user's account is activated.
4. The user can log in using email OTP or a registered passkey.
5. Upon successful authentication, a secure session is created.
6. If the same user logs in from another device, the previous active session is invalidated.
7. Authenticated users can access their protected dashboard and profile and securely log out.

## 🔑 Passkey Authentication

Verifi uses WebAuthn through the SimpleWebAuthn libraries to provide passwordless authentication.

Depending on the device and authenticator, users can authenticate using:

- Fingerprint recognition
- Face ID
- Device PIN or screen lock

Passkey authentication uses public-key cryptography rather than storing or transmitting biometric information to the application.

## 🌐 Deployment

The application is deployed using Vercel, with MongoDB Atlas as the database.

Production environment variables must be configured in the Vercel project settings. WebAuthn relying-party ID and origin must match the deployed domain.

## 👨‍💻 Author

**Mohammed Irfan**

GitHub: [irfanzmohammed](https://github.com/irfanzmohammed)