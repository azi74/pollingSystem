## Polling System - Backend

A Nest.js backend for a polling system with JWT authentication and role-based access control.

## Features

- User authentication (register/login) with JWT
- Role-based access (Admin/User)
- Poll creation/management (Admin only)
- Voting system with expiration
- SQLite database with Prisma ORM

## Prerequisites

- Node.js (v16 or higher)
- npm
- SQLite

## Setup

1. Clone the repository

   ```bash
   git clone https://github.com/azi74/pollingSystem.git
   cd pollinSystem/server
   ```
2. Install dependencies

   ```
   npm install
   ```
3. Set up environment variables

   Edit the `.env` file with your configuration.
4. Database setup

   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. Seed initial data (optional)

   ```
   npx prisma db seed
   ```


## Running the Application

```
npm run build
npm run start:prod
```

## API Endpoints

* `POST /auth/register` - User registration
* `POST /auth/login` - User login
* `GET /polls` - List polls (role-based access)
* `POST /polls` - Create poll (Admin only)
* `GET /polls/:id` - Get poll details
* `POST /polls/:id/vote` - Vote on a poll
* `GET /polls/:id/results` - Get poll results


## Database Management

To access the database:

```
npx prisma studio
```

## Environment Variables

* `DATABASE_URL` - Database connection string
* `JWT_SECRET` - Secret for JWT token generation
* `JWT_EXPIRES_IN` - JWT token expiration time

## Polling System - Frontend

A simple HTML/CSS/JS frontend for the Polling System.

## Features

- User authentication (login/register)
- Admin dashboard for poll management
- User dashboard for voting
- Responsive design

## Prerequisites

- Modern web browser
- Backend server running (see backend README)

## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/azi74/pollingSystem.git
   cd pollingSystem/client
   ```


2. Configure the backend URL
   Edit `js/utils.js` and set the correct `API_BASE_URL`:

   ```
   const API_BASE_URL = 'http://your-backend-url:3000';
   ```


## Running the Application

Simply open `index.html` in your web browser. No build step required.

## Pages

* `index.html` - Home page with login/register options
* `login.html` - User login
* `register.html` - User registration
* `admin.html` - Admin dashboard
* `user.html` - User dashboard
* `poll-detail.html` - Poll details and voting

## Development

The frontend uses:

* Plain JavaScript (ES6)
* CSS for styling
* Fetch API for backend communication
