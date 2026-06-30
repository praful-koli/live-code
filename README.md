# 🚀 CodeRoom

CodeRoom is a real-time collaborative code editor built with **MERN + Socket.IO**.

Users can create a room, share a room code, join with teammates, see live participants, and collaborate in real time.

---

## ✅ Features

### Domain A — Room Management

- Create room
- Generate unique room code
- Join room using room code
- Create host participant automatically
- Host privileges
- Rename room
- Lock / unlock room
- Remove participant
- Close room
- Cookie-based host authentication

---

### Domain C — Realtime Presence

- Socket.IO connection
- Join Socket.IO room
- Live participant list
- Online / offline status
- Participant joined notification
- Participant left notification
- Typing indicator
- Disconnect handling

---

### Domain B — Document Sync

- Monaco Editor integration
- Real-time document sync
- Delta-based update system
- MongoDB document persistence
- Version conflict handling

---

## 🛠 Tech Stack

### Frontend

- React
- Vite
- Socket.IO Client
- Monaco Editor
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- Cookie Parser
- NanoID

---

## 📂 Project Structure

```txt
CODE-ROOM
│
├── client
│   ├── public
│   ├── src
│   │   ├── assets
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── socket.js
│   │
│   ├── index.html
│   ├── package.json
│   └── README.md
│
├── server
│   ├── src
│   │   ├── config
│   │   ├── constants
│   │   ├── middlewares
│   │   ├── modules
│   │   │   ├── room
│   │   │   ├── participant
│   │   │   └── document
│   │   │
│   │   ├── routes
│   │   ├── shared
│   │   ├── sockets
│   │   │   ├── index.socket.js
│   │   │   ├── room.socket.js
│   │   │   ├── presence.socket.js
│   │   │   └── document.socket.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── README.md
```

---

## 🏛 Backend Architecture

```txt
Route
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
MongoDB
```

---

## 🔐 Host Authentication Flow

```txt
Create Room
 ↓
Generate Room Code
 ↓
Generate Host Key
 ↓
Create Room
 ↓
Create Host Participant
 ↓
Store participantId + hostKey in HTTP-only cookies
 ↓
Host Middleware checks cookies for protected actions
```

---

## 🌐 REST APIs

### Room APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/rooms/create` | Create room |
| POST | `/api/v1/rooms/join` | Join room |
| GET | `/api/v1/rooms/:roomCode` | Get room details |
| PATCH | `/api/v1/rooms/:roomCode/rename` | Rename room |
| PATCH | `/api/v1/rooms/:roomCode/lock` | Lock room |
| PATCH | `/api/v1/rooms/:roomCode/unlock` | Unlock room |
| DELETE | `/api/v1/rooms/:roomCode/delete` | Close room |
| DELETE | `/api/v1/rooms/:roomCode/participants/:participantId` | Remove participant |

### Participant APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/rooms/:roomCode/participants` | Get participants |

---

## ⚡ Socket.IO Events

### Client → Server

| Event | Description |
|---|---|
| `room:join` | Join Socket.IO room |
| `room:leave` | Leave Socket.IO room |
| `presence:typing` | User started typing |
| `presence:stop-typing` | User stopped typing |
| `document:get` | Get latest document |
| `document:change` | Send document delta |

### Server → Client

| Event | Description |
|---|---|
| `participant:list` | Updated participant list |
| `participant:joined` | Participant joined room |
| `participant:left` | Participant left room |
| `presence:typing` | Show typing indicator |
| `presence:stop-typing` | Hide typing indicator |
| `document:sync` | Send full current document once |
| `document:changed` | Broadcast document delta |
| `socket:error` | Socket error message |

---

## 🔄 Realtime Flow

```txt
User joins room from frontend
 ↓
Frontend connects Socket.IO
 ↓
Frontend emits room:join
 ↓
Backend socket.join(roomCode)
 ↓
Backend marks participant online
 ↓
Backend broadcasts participant:list
 ↓
All users see updated participants
```

---

## 📝 Document Sync Flow

```txt
User types in Monaco Editor
 ↓
Frontend creates delta
 ↓
Frontend emits document:change
 ↓
Backend applies delta
 ↓
Backend saves content in MongoDB
 ↓
Backend broadcasts document:changed
 ↓
Other users update editor
```

---

## 🗄 Database Models

### Room

```js
{
  roomCode,
  roomName,
  hostParticipantId,
  isLocked,
  isClosed
}
```

### Participant

```js
{
  roomId,
  name,
  socketId,
  isHost,
  hostKey,
  isOnline,
  isRemoved
}
```

### Document

```js
{
  roomId,
  content,
  version,
  lastEditedBy
}
```

---

## 🚀 Installation

### Clone repository

```bash
git clone <repo-url>
cd CODE-ROOM
```

---

### Backend setup

```bash
cd server
npm install
npm run dev
```

---

### Frontend setup

```bash
cd client
npm install
npm run dev
```

---

## ⚙️ Environment Variables

Create `.env` inside `server`.

```env
PORT=8000
NODE_ENV=development
DATABASE_URL=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Testing Socket.IO in Postman

1. Create room using REST API.
2. Copy `roomCode`.
3. Copy participant `_id`.
4. Open Postman Socket.IO request.
5. Connect to:

```txt
http://localhost:8000
```

6. Listen to:

```txt
participant:list
participant:joined
participant:left
presence:typing
presence:stop-typing
socket:error
```

7. Emit:

```txt
room:join
```

```json
{
  "roomCode": "LHHJS3",
  "participantId": "participant_id_here"
}
```

---

## 👨‍💻 Team Domains

| Domain | Responsibility |
|---|---|
| Domain A | Room Management + Host Privileges |
| Domain B | Document Sync Engine |
| Domain C | Realtime Presence |

---

## 📌 Future Improvements

- Live cursor position
- Multiple files
- Version history
- Rollback document version
- Per-line soft locking
- Chat system
- Better conflict resolution
- Deployment optimization

---

