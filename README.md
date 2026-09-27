<div align="center">

# SpotFree

### Smart Room Availability and Management System

A centralized platform for discovering, managing, reserving, and monitoring rooms across an educational campus.

<br>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232F?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

<br>

**Live Application:** https://spotfree-gilt.vercel.app/

[GitHub Repository](https://github.com/Rjnishant07/spotfree)

</div>

---

## About

SpotFree is a smart room availability and campus space-management system designed for educational institutions.

It brings room discovery, live availability, reservations, QR-based room identification, timetable information, status history, issue reporting, campus insights, notifications, and role-based administration into one application.

The current deployment uses a Next.js frontend, a Node.js/Express backend, and a PostgreSQL database.

---

## Problem

Finding a suitable room in a large educational campus can involve unnecessary communication and uncertainty.

Users may need to determine:

- Whether a room is currently available
- Where the room is located
- Whether it is occupied or reserved
- Whether it can be used during a particular period
- Whether it can be reserved
- What activity has recently occurred in the room
- Whether a room has an unresolved maintenance issue

SpotFree provides a centralized digital system for discovering and managing campus spaces.

---

## Solution

SpotFree provides a single interface for students, faculty, and administrators to:

- Discover available rooms
- Search and filter rooms
- Get smart room recommendations
- Identify rooms using QR codes
- Reserve available rooms
- Update room status according to permissions
- View status history
- Report room issues
- Track issue status
- View campus utilization insights
- Access timetable information
- Receive notifications
- Manage user profiles

---

## Core Features

### Live Room Availability

View room status through a centralized availability interface.

Supported room states include:

- Vacant
- Occupied
- Reserved
- No Information

Rooms can be explored using attributes such as building, floor, room type, and status.

### Smart Room Recommendation

Recommend suitable rooms using multiple factors such as:

- Capacity fit
- Requested amenities
- Purpose and space type
- Current availability
- Timetable context
- Building preference

### Room Search and Filtering

Search for rooms and narrow results using room information and availability attributes.

### QR-Based Room Identification

Identify a room through its associated QR code.

The application supports:

- QR code scanning
- QR code upload
- Manual room-number entry

### Room Reservation

Reserve an available room by selecting:

- Date
- Start time
- End time

The reservation system checks for conflicting time periods for the same room.

### Room Status Management

Authorized users can update room status according to their role and permissions.

### Status History

View a record of room-status changes and related activity, including:

- Room
- Previous status
- New status
- User
- Role
- Time
- Update source

### Issue Reporting

Users can report room-related issues such as:

- AC
- Projector
- Lights
- Furniture
- Cleanliness
- Network
- Other

Issues support priority levels and status tracking.

Administrators can move issues through:

`Open → In Progress → Resolved`

### Campus Insights

Campus Insights provides a high-level view of space usage, including:

- Overall utilization
- Available rooms
- Active room usage
- Scheduled hours
- Building utilization
- Space-type distribution
- Peak timetable windows
- Active spaces

### User Management

Administrators can view registered users and filter them by:

- All users
- Students
- Faculty
- Admins

User information includes role and available academic details.

### Timetable

Provide structured timetable information with day-wise and time-wise scheduling.

### Notifications

Display important updates related to room activity and reservations.

### Profile Management

Provide access to user profile and account-related information.

### Responsive Interface

The interface supports desktop and mobile layouts together with light and dark themes.

---

## User Roles

### Student

Students can:

- View room availability
- Search for rooms
- Identify rooms using QR
- Reserve available rooms
- View timetable information
- View status history
- Report room issues
- Perform permitted room-status actions

### Faculty

Faculty members can:

- View room availability
- Search for rooms
- Identify rooms
- Reserve available rooms
- Manage room status
- Perform permitted status overrides
- View room history
- Access timetable information
- Report room issues

### Admin

Administrators have system-level access and can:

- Manage rooms
- Manage room status
- Perform administrative overrides
- Review status history
- Manage users
- Review reported room issues
- Update issue status
- Access campus insights
- Manage system-level room operations

---

## Authentication and Access Control

SpotFree uses role-based access control for protected application areas.

Authentication includes OTP-based email verification. Production email delivery is handled through EmailJS with Gmail.

The backend validates authenticated sessions before protected operations such as administrative user management and issue-status updates.

---

## Status Authority

Room-status management follows a role hierarchy:

```text
ADMIN
  |
  v
FACULTY
  |
  v
STUDENT
```

Higher-authority roles can override status updates made by lower-authority roles where the application permits it.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js (App Router) |
| UI | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Database Hosting | Neon |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Authentication | OTP + session-based access control |
| Email Delivery | EmailJS + Gmail |
| QR Scanning | jsQR |
| QR Generation | qrcode |
| State Management | React Context |

---

## Deployment Architecture

```text
                    ┌─────────────────────┐
                    │     SpotFree Web    │
                    │      Next.js        │
                    │       Vercel        │
                    └──────────┬──────────┘
                               │
                               │ API Requests
                               ▼
                    ┌─────────────────────┐
                    │    SpotFree API     │
                    │  Node.js + Express  │
                    │       Render        │
                    └──────────┬──────────┘
                               │
                               │ PostgreSQL
                               ▼
                    ┌─────────────────────┐
                    │        Neon         │
                    │     PostgreSQL      │
                    └─────────────────────┘

                               │
                               │ OTP Email
                               ▼
                    ┌─────────────────────┐
                    │ EmailJS + Gmail     │
                    └─────────────────────┘
```

### Production Services

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL
- **Email:** EmailJS + Gmail

---

## Project Structure

```text
spotfree/
├── backend/
│   ├── db/
│   │   └── schema.sql
│   ├── lib/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── mailer.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── issues.js
│   │   └── otp.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── app/
│   ├── components/
│   │   └── screens/
│   │       ├── AdminDashboard.tsx
│   │       ├── CampusInsightsScreen.tsx
│   │       ├── FacultyDashboard.tsx
│   │       ├── ReportIssueScreen.tsx
│   │       ├── StatusHistoryScreen.tsx
│   │       └── UserManagementScreen.tsx
│   ├── context/
│   ├── lib/
│   └── package.json
│
├── stitch_screens/
├── .gitignore
├── DEPLOY.md
├── LAUNCH_CHECKLIST.md
├── README.md
└── render.yaml
```

---

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL database for backend development

### Clone the Repository

```bash
git clone https://github.com/Rjnishant07/spotfree.git
cd spotfree
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs locally at:

```text
http://localhost:3000
```

Set the frontend backend URL through the environment configuration, for example:

```text
BACKEND_URL=http://localhost:10000
```

### Backend

In another terminal:

```bash
cd backend
npm install
npm start
```

The backend port is controlled by the server environment. For local development, the application can use port `10000`.

---

## Environment Variables

### Backend

Production requires the following environment variables:

```text
DATABASE_URL
DATABASE_SSL
OTP_SECRET
SESSION_SECRET
EMAILJS_SERVICE_ID
EMAILJS_TEMPLATE_ID
EMAILJS_PUBLIC_KEY
FRONTEND_URL
ADMIN_EMAILS
```

Secrets and API keys should be stored in the deployment platform's environment-variable settings and must not be committed to GitHub.

### Frontend

The frontend uses the backend URL through:

```text
BACKEND_URL
```

For production, this points to the deployed SpotFree API.

---

## Database

SpotFree uses PostgreSQL with Neon for production persistence.

The database contains application data such as:

- Users
- Rooms
- Reservations
- Status history
- Room issues
- Authentication/session data

Database schema definitions are maintained in:

```text
backend/db/schema.sql
```

---

## Design Prototypes

The `stitch_screens` directory contains the original design prototypes used as visual references during the development of the application.

---

## Deployment

The current production setup is:

| Service | Platform | Purpose |
|---|---|---|
| Frontend | Vercel | Next.js web application |
| Backend | Render | Node.js/Express API |
| Database | Neon | PostgreSQL persistence |
| Email | EmailJS + Gmail | OTP delivery |

The production frontend is available at:

**https://spotfree-gilt.vercel.app/**

The backend health endpoint is:

**https://spotfree.onrender.com/api/health**

The `Changes` branch is used for the current deployed development/production workflow.

---

## Current Modules

The current application includes:

- Room Availability
- Room Search and Filtering
- Smart Room Recommendation
- QR Room Identification
- Room Reservation
- Room Status Management
- Status History
- Timetable
- Notifications
- Profile Management
- Campus Insights
- Issue Reporting
- Admin Issue Management
- User Management
- Role-Based Access Control
- Light/Dark Theme Support
- Responsive Web Interface

---

## Roadmap

Potential future improvements include:

- Automated timetable-based room status updates
- Push notifications
- Expanded analytics and reporting
- More granular administrative controls
- Additional campus integrations
- Production monitoring and operational tooling

---

## License

Not yet specified.

---

<div align="center">

Built for Heritage Institute of Technology

</div>
