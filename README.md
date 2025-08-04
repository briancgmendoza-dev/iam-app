# IAM System - Identity and Access Management

A full-stack Identity and Access Management (IAM) system built with React, TypeScript, Node.js, and Express. This application provides comprehensive user, role, group, and permission management capabilities.

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **React Router DOM** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Vite** as build tool

### Backend
- **Node.js** with Express
- **TypeScript**
- **TypeORM** for database operations
- **SQLite** database
- **JWT** for authentication
- **Passport.js** for authentication middleware
- **bcryptjs** for password hashing

## 📋 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Permission simulation

- **User Management**
  - Create, read, update, delete users
  - User profile management

- **Role Management**
  - Define and manage roles
  - Assign permissions to roles

- **Group Management**
  - Create and manage user groups
  - Group-based permissions

- **Module Management**
  - Define application modules
  - Module-specific permissions

- **Permission Management**
  - Granular permission control
  - Action-based permissions (create, read, update, delete)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```env
PORT=8080
JWT_SECRET=your_jwt_secret_key
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:8080/
```

4. Start the development server:
```bash
npm run dev
```

The client will start on `http://localhost:5173`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| POST | `/login` | User login | `{ username: string, password: string }` |
| POST | `/register` | User registration | `{ username: string, password: string }` |

### Users

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/users` | Get all users | - |
| GET | `/users/:id` | Get user by ID | - |
| PUT | `/users/:id` | Update user | `{ username?: string, password?: string }` |
| DELETE | `/users/:id` | Delete user | - |

### Roles

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/roles` | Get all roles | - |
| GET | `/roles/:id` | Get role by ID | - |
| POST | `/roles` | Create role | `{ name: string, description?: string }` |
| PUT | `/roles/:id` | Update role | `{ name?: string, description?: string }` |
| DELETE | `/roles/:id` | Delete role | - |
| GET | `/roles/:roleId/groups` | Get role groups | - |
| GET | `/roles/:roleId/permissions` | Get role permissions | - |

### Groups

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/groups` | Get all groups | - |
| GET | `/groups/:id` | Get group by ID | - |
| POST | `/groups` | Create group | `{ name: string, description?: string }` |
| PUT | `/groups/:id` | Update group | `{ name?: string, description?: string }` |
| DELETE | `/groups/:id` | Delete group | - |

### Modules

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/modules` | Get all modules | - |
| GET | `/modules/:id` | Get module by ID | - |
| POST | `/modules` | Create module | `{ name: string, description?: string }` |
| PUT | `/modules/:id` | Update module | `{ name?: string, description?: string }` |
| DELETE | `/modules/:id` | Delete module | - |

### Permissions

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/permissions` | Get all permissions | - |
| GET | `/permissions/user/:userId` | Get user permissions | - |
| POST | `/permissions/simulate` | Simulate permission | `{ module: string, action: string }` |

### Access Control

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| POST | `/simulate-action` | Simulate user action | `{ module: string, action: string }` |
| POST | `/:id/permissions` | Get Current User Permission | - |

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

## 🎨 Frontend Screenshots

### Login Page
![Login Page](screenshots/login.png)
*User authentication interface with modern design*

### Dashboard
![Dashboard](screenshots/dashboard.png)
*Main dashboard showing user permissions and action simulation*

### User Management
![User Management](screenshots/users.png)
*User list and management interface*

### Role Management
![Role Management](screenshots/roles.png)
*Role creation and management interface*

### Group Management
![Group Management](screenshots/groups.png)
*Group management interface*

### Module Management
![Module Management](screenshots/modules.png)
*Application module management*

### Permission Management
![Permission Management](screenshots/permissions.png)
*Permission assignment and management*

> **Note**: Add your screenshots to a `screenshots/` directory in the project root and update the paths above accordingly.

## 📁 Project Structure

```
iam-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store and slices
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── public/
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── entities/      # Database entities
│   │   ├── middleware/    # Custom middleware
│   │   ├── routes/        # API routes
│   │   └── db/           # Database configuration
│   └── ...
└── README.md
```
