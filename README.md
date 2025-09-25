# BankAPI API

## Overview
This project is a RESTful banking API built with Node.js, Express, and TypeScript. It utilizes Mongoose for Object Data Modeling with a MongoDB database to handle user authentication, account management, and financial transactions.

## Features
- **Express.js**: Provides a robust framework for building the REST API server and managing routes.
- **TypeScript**: Ensures type safety and improves code quality and maintainability.
- **Mongoose**: Simplifies interactions with the MongoDB database for user and transaction data management.
- **JSON Web Tokens (JWT)**: Secures endpoints by providing stateless authentication for users.
- **Argon2**: Implements secure, modern password hashing to protect user credentials.
- **Nodemailer**: Sends transactional emails for OTP verification and transaction alerts.
- **Joi**: Handles validation of incoming request data to ensure data integrity.
- **Node-Cron**: Manages scheduled tasks, such as periodically crediting user accounts.

## Getting Started
### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/skido600/bank_api.git
    ```

2.  **Navigate to the project directory**
    ```bash
    cd bankapi
    ```

3.  **Install dependencies**
    ```bash
    npm install
    ```

4.  **Create a `.env` file** in the root directory and add the environment variables listed below.

5.  **Run the development server**
    ```bash
    npm run dev
    ```

### Environment Variables
You must create a `.env` file in the root of the project and populate it with the following variables:

```env
# Server Configuration
PORT=3000

# Database Connection
MONGODB_URL=mongodb://localhost:27017/bankapi

# Security Secrets
JWT_SEC=your_super_secret_jwt_key
HMAC_VERIFICATION_CODE_SECRET=your_super_secret_hmac_key

# Nodemailer (Gmail) Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

## API Documentation
### Base URL
- Authentication: `/auth/v1`
- User & Transactions: `/user`

### Endpoints
#### POST /auth/v1/signup
Registers a new user and creates an associated bank account.

**Request**:
```json
{
  "full_name": "John Doe",
  "phonenumber": "08012345678",
  "email": "john.doe@example.com",
  "password": "StrongPassword123",
  "confirmPassword": "StrongPassword123",
  "address": "123 Main St, Anytown"
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 201,
    "message": "User registered successfully. Please check your email for the verification code, The verification code will expire in 15mins",
    "data": {
        "email": "john.doe@example.com",
        "isVerified": false
    }
}
```

**Errors**:
- `400 Bad Request`: Validation error, passwords do not match, or user with the given email/phone number already exists.
- `500 Internal Server Error`: Server-side processing error.

---
#### POST /auth/v1/verify-email
Verifies a user's email address using the provided OTP.

**Request**:
```json
{
  "email": "john.doe@example.com",
  "code": "123456"
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "Email verified successfully"
}
```

**Errors**:
- `400 Bad Request`: Email already verified, token has expired, or the provided token is invalid.
- `404 Not Found`: User with the specified email does not exist.

---
#### POST /auth/v1/resend-otp
Resends a new verification code to the user's email.

**Request**:
```json
{
  "email": "john.doe@example.com"
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "New verification code sent to your email."
}
```

**Errors**:
- `400 Bad Request`: User's email is already verified.
- `404 Not Found`: User with the specified email does not exist.

---
#### POST /auth/v1/login
Authenticates a user and returns a JWT.

**Request**:
```json
{
  "email_phonenumber": "john.doe@example.com",
  "password": "StrongPassword123"
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "isManeger": false
    }
}
```

**Errors**:
- `400 Bad Request`: Email is not verified, incorrect password, or validation error.
- `404 Not Found`: User does not exist.

---
#### POST /auth/v1/forgot-password
Sends a password reset code to the user's email.

**Request**:
```json
{
  "email": "john.doe@example.com"
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "Password reset code sent to your email."
}
```

**Errors**:
- `404 Not Found`: User with the specified email does not exist.

---
#### PATCH /auth/v1/reset-password
Resets the user's password using a valid reset code.

**Request**:
```json
{
  "email": "john.doe@example.com",
  "code": "654321",
  "newPassword": "NewStrongPassword456",
  "confirmPassword": "NewStrongPassword456"
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "Password reset successful."
}
```

**Errors**:
- `400 Bad Request`: Reset code has expired, invalid reset code, or passwords do not match.
- `404 Not Found`: User with the specified email does not exist.

---
#### POST /user/transfer
Transfers a specified amount from the authenticated user's account to another account. (Authentication required)

**Request**:
```json
{
  "receiverAcc": "7012345678",
  "amount": 5000
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "Transfer made by John Doe to Jane Smith was successful",
    "data": [
        {
            "senderAcc": "8012345678",
            "senderName": "John Doe",
            "receiverAcc": "7012345678",
            "receiverName": "Jane Smith",
            "amount": 5000,
            "type": "debit",
            "status": "success",
            "reference": "...",
            "userId": "...",
            "_id": "...",
            "createdAt": "...",
            "updatedAt": "..."
        },
        {
            "senderAcc": "8012345678",
            "senderName": "John Doe",
            "receiverAcc": "7012345678",
            "receiverName": "Jane Smith",
            "amount": 5000,
            "type": "credit",
            "status": "success",
            "reference": "...",
            "userId": "...",
            "_id": "...",
            "createdAt": "...",
            "updatedAt": "..."
        }
    ]
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token.
- `400 Bad Request`: Insufficient balance or attempting to transfer to your own account.
- `404 Not Found`: Receiver account number does not exist.

---
#### GET /user/transactions/me
Retrieves a list of all transactions for the authenticated user. (Authentication required)

**Request**:
*No request body needed.*

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "User transactions fetched successfully",
    "data": [
        {
            "_id": "...",
            "senderAcc": "8012345678",
            "senderName": "John Doe",
            "receiverAcc": "7012345678",
            "receiverName": "Jane Smith",
            "amount": 5000,
            "type": "debit",
            "status": "success",
            "reference": "...",
            "userId": "...",
            "createdAt": "...",
            "updatedAt": "..."
        }
    ]
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token.
- `404 Not Found`: No transactions found for the user.

---
#### GET /user/details/me
Fetches the account details (including balance) for the authenticated user. (Authentication required)

**Request**:
*No request body needed.*

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "User details",
    "data": {
        "_id": "...",
        "userId": "...",
        "accountNumber": "8012345678",
        "balance": 95000,
        "accountName": "John Doe",
        "Email": "john.doe@example.com",
        "createdAt": "...",
        "updatedAt": "..."
    }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token.
- `404 Not Found`: User account details not found.

---
#### GET /user/reference/me
Fetches a single transaction by its unique reference ID. (Authentication required)

**Request**:
*Query parameter `ref` is required.*
Example: `/user/reference/me?ref=unique-reference-id`

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "User details",
    "data": {
        "_id": "...",
        "senderAcc": "8012345678",
        "senderName": "John Doe",
        "receiverAcc": "7012345678",
        "receiverName": "Jane Smith",
        "amount": 5000,
        "type": "debit",
        "status": "success",
        "reference": "unique-reference-id",
        "userId": "...",
        "createdAt": "...",
        "updatedAt": "..."
    }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token.
- `404 Not Found`: Invalid or non-existent reference number.

---
#### POST /user/withdrawal/me
Processes a withdrawal from the user's account. (Authentication required)

**Request**:
```json
{
  "amount": 10000
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "Withdrawal of 10000 successful. Your new balance is 85000"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token.
- `400 Bad Request`: Insufficient balance.

---
#### POST /user/Eddc/me
Processes a mock electricity bill payment from the user's account. (Authentication required)

**Request**:
```json
{
  "amount": 3500
}
```

**Response**:
```json
{
    "success": true,
    "statuscode": 200,
    "message": "Electricity bill payment of 3500 successful. Your new balance is 81500"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token.
- `400 Bad Request`: Insufficient balance.

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)