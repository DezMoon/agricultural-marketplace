# Agricultural Marketplace

A full-stack web application for agricultural produce trading, connecting farmers with buyers.

## Project Structure

```
agricultural-marketplace/
├── backend/                    # Backend API server
│   ├── src/                   # Source code
│   │   ├── app.js            # Express app configuration
│   │   ├── config/           # Configuration files
│   │   │   └── database.js   # Database connection
│   │   ├── controllers/      # Route controllers (planned)
│   │   ├── middleware/       # Express middleware
│   │   │   └── authMiddleware.js
│   │   ├── models/           # Database models
│   │   │   └── produce.js
│   │   ├── routes/           # API routes
│   │   │   ├── messages.js
│   │   │   ├── produce.js
│   │   │   └── users.js
│   │   ├── services/         # Business logic services
│   │   │   └── socketService.js
│   │   └── utils/            # Utility functions (planned)
│   ├── database/             # Database related files
│   │   └── schema.sql        # Database schema
│   ├── scripts/              # Setup and utility scripts
│   │   └── setup-db.js       # Database setup script
│   ├── uploads/              # File uploads directory
│   ├── index.js              # Server entry point
│   ├── package.json
│   ├── .env                  # Environment variables (not in repo)
│   └── .env.example          # Environment variables template
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # React context providers
│   │   │   └── AuthContext.js
│   │   ├── pages/            # Page components (planned)
│   │   ├── hooks/            # Custom React hooks (planned)
│   │   ├── services/         # API and external services
│   │   │   └── api.js        # Centralized API service
│   │   ├── styles/           # CSS files
│   │   ├── utils/            # Utility functions
│   │   │   └── constants.js  # Application constants
│   │   ├── assets/           # Static assets
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env                  # Environment variables (not in repo)
├── docs/                     # Documentation
│   └── README.md
├── .gitignore
└── README.md
```

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Database (AWS RDS)
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Frontend
- **React** - Frontend framework
- **Socket.IO Client** - Real-time communication
- **CSS3** - Styling

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database (AWS RDS configured)

### Installation

1. Clone the repository
```bash
git clone https://github.com/DezMoon/agricultural-marketplace.git
cd agricultural-marketplace
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Environment Setup
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and JWT secret

# Frontend
echo "REACT_APP_API_URL=http://localhost:3000" > frontend/.env
```

5. Database Setup
```bash
cd backend
node scripts/setup-db.js
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm start
# or for development
npm run dev
```

2. Start the frontend application
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

### Produce Listings
- `GET /api/produce/listings` - Get all listings
- `POST /api/produce/listings` - Create new listing (auth required)
- `PUT /api/produce/listings/:id` - Update listing (auth required)
- `DELETE /api/produce/listings/:id` - Delete listing (auth required)
- `GET /api/produce/my-listings` - Get user's listings (auth required)

### Messages
- `POST /api/messages` - Send message (auth required)
- `GET /api/messages` - Get user's messages (auth required)
- `PUT /api/messages/:id/read` - Mark message as read (auth required)
- `GET /api/messages/unread-count` - Get unread message count (auth required)

## Features

- **User Authentication** - Register and login functionality
- **Produce Listings** - Create, read, update, delete produce listings
- **Image Upload** - Upload images for produce listings
- **Real-time Messaging** - Socket.IO powered messaging system
- **Search and Filter** - Find specific produce listings
- **Responsive Design** - Mobile-friendly interface
- **Dark Mode** - Toggle between light and dark themes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (when available)
5. Submit a pull request

## License

This project is licensed under the ISC License.
