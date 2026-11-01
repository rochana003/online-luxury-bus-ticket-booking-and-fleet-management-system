# 🚌 Online Luxury Bus Booking & Fleet Management System

A full-stack web application that allows passengers to search for bus journeys, select seats, and manage their reservations. It also provides an administration panel for managing buses, routes, schedules, and passenger bookings.

## 📌 Project Overview

The Luxury Bus Booking System is developed to make the bus reservation process easier and more convenient. Passengers can search for available journeys, view bus seat layouts, book seats, and manage their reservations.

Administrators can manage the main operations of the system through a dedicated admin dashboard.

## ✨ Features

### 👤 Passenger Features
- User registration and login
- Search journeys by departure location, destination, and travel date
- View available bus schedules
- Interactive bus seat selection
- Book available seats
- View booking details
- Cancel eligible bookings
- Passenger dashboard

### 🛠️ Administrator Features
- Admin authentication
- Admin dashboard
- Manage buses (add, view, and update)
- Manage routes
- Manage bus schedules
- View and manage passenger bookings
- Booking and schedule validations

### 🔒 Security and Validation
- JWT-based user authentication
- Role-based access control
- Password-based user authentication
- Duplicate seat booking prevention
- Validation of bus, route, and schedule information
- Protection of existing booking records

## 💻 Technologies Used

| Technology | Purpose |
|---|---|
| Next.js | Frontend development |
| React.js | User interface |
| Node.js | Backend runtime |
| Express.js | Backend API development |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| CSS | Styling |

## 📂 Project Structure

```text
luxury-bus-booking-system/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   └── package.json
│
└── README.md
```

*Note: The folder structure may vary slightly depending on the final project organization.*

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm start
```

Use the start command defined in the backend `package.json` if it differs.

### 3. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the frontend folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

### 4. Open the Application

Visit:

```text
http://localhost:3000
```

Make sure both the frontend and backend servers are running.

## 🗄️ Database

The application uses MongoDB to store and manage application data, including:

- User information
- Bus details
- Route information
- Bus schedules
- Passenger bookings

## 🔄 Main System Workflow

1. Passengers register or log in.
2. Passengers search for journeys.
3. The system displays available schedules.
4. Passengers select a journey and available seats.
5. Passengers complete their bookings.
6. Passengers manage their reservations through their dashboard.
7. Administrators manage buses, routes, schedules, and bookings.

## 🎓 Project Information

**Project Name:** Luxury Bus Booking System

**Project Type:** Mini Project

**Module:** Web Application Development

**Project Purpose:** To develop a web-based platform for managing bus reservations and administrative operations.

## 👨‍💻 Author

Developed as an academic mini project for the Web Application Development module.

---

Thank you for visiting the Luxury Bus Booking System repository!
