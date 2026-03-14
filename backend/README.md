# MediClock Backend

Node.js/Express backend with MongoDB integration for the MediClock application.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Edit the `.env` file with your MongoDB credentials:

```
MONGODB_URI=mongodb+srv://ankitxyz804_db_user:YOUR_PASSWORD@cluster0.jcq1wvj.mongodb.net/?appName=Cluster0
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

**⚠️ Important:** Never commit the `.env` file to version control. Add it to `.gitignore`.

### 3. Run the Backend

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:5000`

### 4. Test the Connection

Visit `http://localhost:5000/api/health` to verify the server is running.

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Medications
- `POST /api/medications` - Add new medication
- `GET /api/medications/user/:userId` - Get user's medications
- `GET /api/medications/:id` - Get medication by ID
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### Reminders
- `POST /api/reminders` - Create new reminder
- `GET /api/reminders/user/:userId` - Get user's reminders
- `GET /api/reminders/:id` - Get reminder by ID
- `PUT /api/reminders/:id` - Update reminder
- `PATCH /api/reminders/:id/complete` - Mark as completed
- `DELETE /api/reminders/:id` - Delete reminder

## Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── User.js
│   ├── Medication.js
│   └── Reminder.js
├── routes/          # API route handlers
│   ├── users.js
│   ├── medications.js
│   └── reminders.js
├── server.js        # Express server setup
├── db.js            # MongoDB connection
├── package.json
├── .env             # Environment variables (not in git)
└── .gitignore
```

## Features

✓ MongoDB connection with Mongoose
✓ User authentication ready (bcryptjs)
✓ CORS support for frontend communication
✓ RESTful API endpoints
✓ Error handling
✓ Environment variable configuration

## Next Steps

1. Update `.env` with your actual MongoDB password
2. Integrate frontend API calls with the backend endpoints
3. Implement JWT authentication middleware
4. Add validation and error handling
5. Deploy to production
