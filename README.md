<div align="center">

# SpotFree

### Smart Room Availability and Management System

A centralized platform for discovering, managing, and reserving rooms in an educational campus.

<br>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br>

[GitHub Repository](https://github.com/Rjnishant07/spotfree)

</div>

---

## About

SpotFree is a smart room availability and management system designed for educational campuses.

The platform brings room discovery, room availability, room-status management, reservations, QR-based room identification, timetable access, activity history, notifications, and role-based controls into a single application.

The primary goal of SpotFree is to make it easier for users to find suitable rooms, understand their current availability, and perform room-related actions through a centralized system.

---

## Problem

Finding an available room in a large educational campus can involve unnecessary communication and uncertainty.

Users may need to determine:

- Whether a room is currently available
- Where the room is located
- Whether it is occupied or reserved
- Whether the room can be used during a particular period
- Whether the room can be reserved
- What activity has recently occurred in the room

SpotFree addresses these challenges by providing a centralized digital system for room discovery and management.

---

## Solution

SpotFree provides a single interface through which students, faculty, and administrators can:

- Discover available rooms
- Search and filter rooms
- Identify rooms using QR codes
- Update room status according to permissions
- Reserve available rooms
- View room-status history
- Access timetable information
- Receive notifications
- Manage their profiles

---

## Core Features

### Live Room Availability

View the current status of rooms through a centralized room availability interface.

Room states include:

- Vacant
- Occupied
- Reserved
- No Information

Rooms can be explored using relevant attributes such as building, floor, room type, and status.

### Room Search and Filtering

Search for rooms and narrow down results using available room information.

### Smart Room Recommendation

Suggest suitable rooms based on user requirements and room characteristics.

### QR-Based Room Identification

Identify a room through its associated QR code and access room-specific information and actions.

The application supports:

- QR Code Scanning
- QR Code Upload
- Manual Room Number Entry

### Room Status Management

Authorized users can update room status according to their role and permissions.

### Room Reservation

Reserve an available room by selecting:

- Date
- Start Time
- End Time

The reservation flow is designed to handle conflicting time periods for the same room.

### Status History

Maintain a record of room-status changes and related activity.

History can contain information such as:

- Room
- Previous Status
- New Status
- User
- Role
- Time
- Update Source

### Role-Based Access

SpotFree supports multiple user roles:

- Student
- Faculty
- Admin

Each role has different permissions and access levels.

### Timetable

Provide timetable access together with a structured day-wise and time-wise schedule view.

### Notifications

Display important updates related to room activity and reservations.

### Profile Management

Provide access to user profile information and account-related functionality.

### Responsive Interface

The interface supports both mobile and desktop-oriented layouts along with light and dark themes.

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

### Admin

Administrators have the highest level of system access and can:

- Manage rooms
- Manage room status
- Perform administrative overrides
- Review status history
- Manage system-level room operations
- Access reservation and notification functionality

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

Higher-authority roles can override status updates made by lower-authority roles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| UI Library | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| QR Handling | jsqr (scanning), qrcode (generation) |
| State Management | React Context |

---

## Project Structure

```text
spotfree/
├── frontend/               Next.js application
│   ├── app/                 Application entry (layout, page, global styles)
│   ├── components/          Shared UI components
│   │   └── screens/          Individual screen components
│   ├── context/              Global application state
│   ├── lib/                  Types and utility functions
│   └── mock-data/            Rooms, users, timetable, and QR data
└── stitch_screens/          Original design prototypes for reference
```

---

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

```bash
cd frontend
npm install
```

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Design Prototypes

The `stitch_screens` directory contains the original HTML prototypes used as the visual reference for every screen in the application, including the interactive end-to-end prototype.

---

## Roadmap

- Backend API and persistent database integration
- Real authentication system
- Push notification support
- Automated timetable-based status updates

---

## License

Not yet specified.

---



<div align="center">

Built for Heritage Institute of Technology

</div>
