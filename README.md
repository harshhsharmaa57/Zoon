# Meeting

**Meeting** is a full-stack real-time video meeting application built with **React**, **Node.js**, **Express**, **MongoDB**, **Socket.IO**, and **WebRTC**. It allows users to register, log in, join meeting rooms via URL, chat in the meeting, and store meeting history on the backend.

---

## Table of Contents

1. Project Overview
2. System Architecture
3. Backend Overview
4. Frontend Overview
5. Data Models
6. Authentication Flow
7. Meeting Room Flow
8. Socket.IO and WebRTC Details
9. Routing and Pages
10. Environment Configuration
11. Installation and Local Run
12. Deployment
13. Dependencies and Scripts
14. Project Structure
15. Known Limitations and Notes
16. Future Improvements
17. Author

---

## 1. Project Overview

This repo contains two separate applications:

- `backend`: Express server with REST APIs, authentication, MongoDB persistence, and Socket.IO signaling.
- `frontend`: React single-page application with login/register screens, protected dashboard, meeting room UI, and chat.

The application is designed for browser-based real-time video meetings without native desktop software.

---

## 2. System Architecture

```
Browser (React SPA)
       │
       │  REST API / Socket.IO
       ▼
Node.js + Express Backend
       │
       │  MongoDB via Mongoose
       ▼
   MongoDB Database
```

- The frontend provides the UI and local WebRTC media handling.
- The backend handles user auth, meeting history, and Socket.IO signaling.
- MongoDB stores user accounts and previously joined meeting codes.

---

## 3. Backend Overview

### Entry point: `backend/src/app.js`

- Loads environment variables from `.env` using `dotenv/config`.
- Creates an Express app and an HTTP server.
- Connects Socket.IO to the server with CORS enabled.
- Parses JSON and URL-encoded payloads.
- Registers routes:
  - `/health`
  - `/api/v1/users`
- Connects to MongoDB using `process.env.MONGO_URL`.
- Starts the server on `process.env.PORT` or `8000`.

### Backend scripts in `backend/package.json`

- `dev`: `nodemon src/app.js`
- `start`: `node src/app.js`
- `prod`: `pm2 src/app.js`

### Backend dependencies

- `express`
- `mongoose`
- `socket.io`
- `cors`
- `dotenv`
- `bcrypt`
- `crypto`
- `http-status`

---

## 4. Frontend Overview

### Entry point: `frontend/src/main.jsx`

- Renders the React app inside `<StrictMode>`.
- Uses `App.jsx` as the root component.

### Root application: `frontend/src/App.jsx`

- Wraps the app with React Router and `AuthProvider`.
- Defines routes for landing, auth, home, history, and video meeting pages.

### Frontend configuration: `frontend/src/environment.js`

- Returns the backend URL depending on the `IS_PROD` flag.
- Current production backend URL: `https://zoon-d6co.onrender.com`
- For local development, set `IS_PROD = false` to use `http://localhost:8000`.

### Frontend dependencies

- `react`, `react-dom`
- `react-router-dom`
- `axios`
- `socket.io-client`
- `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- `http-status`

---

## 5. Data Models

### User model: `backend/src/models/user.model.js`

Fields:

- `name`: String, required
- `username`: String, required, unique
- `password`: String, required (stored hashed)
- `token`: String

### Meeting model: `backend/src/models/meeting.model.js`

Fields:

- `user_id`: String
- `meetingCode`: String, required
- `date`: Date, defaults to current time

---

## 6. Authentication Flow

### Register

- `POST /api/v1/users/register`
- Validates that the requested username does not already exist.
- Hashes the password using `bcrypt` with salt rounds of `10`.
- Stores the user record in MongoDB.
- Returns `201 Created` with `{ message: "User Registered" }`.

### Login

- `POST /api/v1/users/login`
- Finds the user by `username`.
- Compares the plaintext password to the stored hashed password.
- If valid, generates a random token using `crypto.randomBytes(20).toString('hex')`.
- Saves the token to the user document.
- Returns `200 OK` with `{ token: "..." }`.

### Token usage

- The frontend stores the token in `localStorage`.
- Protected pages use `withAuth` HOC to check for token presence.
- Meeting history endpoints send the token to identify the user.

---

## 7. Meeting Room Flow

### Meeting creation / join

- The video meeting page is reached via a route parameter: `/:url`.
- Example room URL: `/meeting123`.
- The `VideoMeet` component uses the browser route to join the room.
- When joining via the home page, the app saves the meeting code to the user's history.

### Room identifier

- The client emits `join-call` with `window.location.href`.
- The backend groups sockets by this path string.
- All participants in the same URL share the same meeting room.

### Meet landing and lobby

- The page first asks for a username.
- Once entered, the user clicks `Connect`.
- Media permissions are requested for camera and microphone.

---

## 8. Socket.IO and WebRTC Details

### Backend Socket Manager: `backend/src/controllers/socketManager.js`

- Creates a Socket.IO server instance.
- Stores active meeting connections in an in-memory `connections` object keyed by room path.
- Stores in-room chat messages in an in-memory `messages` object.
- On socket connection:
  - `join-call`: adds socket to the room list and notifies all peers with `user-joined`.
  - `signal`: forwards WebRTC SDP/ICE messages to a specific peer.
  - `chat-message`: broadcasts chat text to all peers in the same room.
  - `disconnect`: removes the socket from the room and broadcasts `user-left`.

### Client WebRTC flow: `frontend/src/pages/VideoMeet.jsx`

- Uses `navigator.mediaDevices.getUserMedia` for local audio/video.
- Uses `RTCPeerConnection` with Google STUN server at `stun:stun.l.google.com:19302`.
- When peers join, it creates offers and answers and exchanges SDP over Socket.IO.
- On `user-joined`, a new peer connection is created for each participant.
- Local media tracks are added to each peer connection.

### Chat functionality

- Sends `chat-message` events containing the message text and sender name.
- Incoming messages are appended to the chat panel.
- New message count is shown with a badge.

### Media controls

The meeting UI supports:

- Toggle camera on/off
- Toggle microphone on/off
- End call and return to landing page
- Screen share if the browser supports `getDisplayMedia`

### Screen sharing

- If available, screen sharing can be toggled.
- When enabled, the app requests display media with audio.
- The stream is published to the same peer connections.

---

## 9. Routing and Pages

### Frontend pages

- `LandingPage` (`/`): marketing-style landing page with guest join and login/register navigation.
- `Authentication` (`/auth`): login/register form using Material UI.
- `HomeComponent` (`/home`): authenticated dashboard for entering a meeting code and navigating to history.
- `History` (`/history`): displays previously joined meeting codes with dates.
- `VideoMeetComponent` (`/:url`): real-time meeting room with video, chat, and controls.

### Protected routes

- `HomeComponent` is wrapped with `withAuth` to enforce login.
- `withAuth` redirects to `/auth` if no token is found in `localStorage`.

### Navigation

- Landing page offers guest join or auth flow.
- Auth page switches between sign in and sign up.
- Home page includes logout, history, and join button.
- History page has a back button to `/home`.

---

## 10. Environment Configuration

### Backend `.env`

Create `backend/.env` with:

```env
PORT=8000
MONGO_URL=your_mongodb_connection_string
```

### Frontend server config

`frontend/src/environment.js` currently defines:

```js
let IS_PROD = true;
const server = IS_PROD
  ? "https://zoon-d6co.onrender.com"
  : "http://localhost:8000";

export default server;
```

For local development, set `IS_PROD = false`.

---

## 11. Installation and Local Run

### Backend

```bash
cd backend
npm install
npm run dev
```

or

```bash
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Local defaults

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173` or Vite default port

---

## 12. Deployment

The frontend is configured to point to a production backend URL when `IS_PROD` is `true`.

Current production backend URL:

- `https://zoon-d6co.onrender.com`

Current live deployment URL mentioned in earlier docs:

- `http://meet-29j2.onrender.com/`

---

## 13. Dependencies and Scripts

### Backend `package.json`

- `bcrypt`: password hashing
- `cors`: Cross-Origin Resource Sharing
- `crypto`: random token generation
- `dotenv`: environment variables
- `express`: HTTP server
- `http-status`: status code constants
- `mongoose`: MongoDB ODM
- `nodemon`: development auto-restart
- `socket.io`: real-time signaling

### Frontend `package.json`

- `@emotion/react`, `@emotion/styled`: styling engine for Material UI
- `@mui/material`, `@mui/icons-material`: UI component library
- `axios`: HTTP client
- `http-status`: status code constants
- `react`, `react-dom`: React framework
- `react-router-dom`: routing
- `socket.io-client`: client-side Socket.IO
- `vite`: frontend tooling
- `eslint`: linting
- `@types/react`, `@types/react-dom`: TypeScript types for React
- `@vitejs/plugin-react`: Vite plugin for React

### Available scripts

#### Backend

- `npm run dev`: start backend with nodemon
- `npm start`: start backend with node
- `npm run prod`: start backend with pm2

#### Frontend

- `npm run dev`: start Vite dev server
- `npm run build`: build production bundle
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

---

## 14. Project Structure

### Root

- `README.md`
- `backend/`
- `frontend/`

### Backend

- `backend/package.json`
- `backend/src/app.js`
- `backend/src/controllers/user.controller.js`
- `backend/src/controllers/socketManager.js`
- `backend/src/models/user.model.js`
- `backend/src/models/meeting.model.js`
- `backend/src/routes/users.route.js`

### Frontend

- `frontend/package.json`
- `frontend/index.html`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/environment.js`
- `frontend/src/pages/landing.jsx`
- `frontend/src/pages/authentication.jsx`
- `frontend/src/pages/home.jsx`
- `frontend/src/pages/history.jsx`
- `frontend/src/pages/VideoMeet.jsx`
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/utils/withAuth.jsx`
- `frontend/src/styles/videoComponent.module.css`
- `frontend/src/App.css`
- `frontend/src/index.css`

---

## 15. Known Limitations and Notes

- Authentication is token-based but not JWT-based. The token is stored in the user document and in `localStorage`.
- The backend does not validate tokens with expiration.
- The room identifier uses the browser URL string for `join-call`, so users must use the exact same URL to join the same meeting.
- The Socket.IO room state is stored in memory and will be lost when the server restarts.
- Chat messages are kept in memory for the room only and are not persisted in the database.
- Screen sharing relies on browser support for `navigator.mediaDevices.getDisplayMedia`.
- The `HomeComponent` is protected by `withAuth`, but other routes such as history are not explicitly protected.

---

## 16. Future Improvements

Possible enhancements:

- Add TURN server support for NAT traversal.
- Persist chat messages in MongoDB.
- Add proper JWT authentication with refresh tokens.
- Add user profile and settings pages.
- Add meeting room participant names and status indicators.
- Improve responsive layout for mobile devices.
- Add meeting recording and playback.
- Refactor WebRTC peer management for stability.
- Add automated tests for backend and frontend.

---

## 17. Author

- `harsh`

---

## 18. Additional Notes

- `frontend/src/environment.js` currently hardcodes the backend server URL. Update this file for your target environment.
- If you run the frontend and backend locally, set `IS_PROD = false` and use a matching local `MONGO_URL`.
- The backend health endpoint is available at `http://localhost:8000/health`.

---

Thank you for using Meeting. This README documents the complete architecture, setup, and runtime behavior of the project.

Harsh Kumar Sharma

GitHub
https://github.com/harshhsharmaa57

---

# License

This project is open source and available under the MIT License.
