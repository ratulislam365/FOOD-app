# 💬 Real-Time Chat System Documentation

This document outlines the architecture, API endpoints, and Socket.IO events for the **EMDR Chat System**.

## 📌 1. Overview
The chat system allows **Customers** to chat with **Providers** (and vice-versa).
- **Technology**: Socket.IO (Real-time), MongoDB (Persistence), Express (REST API).
- **Authentication**: JWT Bearer Token (shared with REST API).
- **Security**: strict Role-Based Access Control (RBAC).

## 🔒 2. Authentication & Connection
Clients must connect using the standard JWT token.

**Client URL:** `http://localhost:5000`
**Connection Options:**
```javascript
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  auth: {
    token: "Bearer <YOUR_JWT_TOKEN>"
  }
});
```

---

## 📡 3. Socket.IO Events

### ➤ Client Emits (Requests)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| **`join_room`** | `{ "targetUserId": "USER_ID" }` | Request to chat with a user. Backend creates a room if none exists and returns history. |
| **`send_message`** | `{ "chatRoomId": "ROOM_ID", "content": "Hello" }` | Sends a message to a specific room. |
| **`typing`** | `{ "chatRoomId": "ROOM_ID" }` | Emits typing status to the room. |
| **`stop_typing`** | `{ "chatRoomId": "ROOM_ID" }` | Removes typing status. |

### ➤ Server Emits (Responses)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| **`receive_message`** | `{ "_id": "...", "content": "..." }` | Fired when a new message arrives in the room you are viewing. |
| **`notification`** | `{ "type": "message", "senderName": "..." }` | Fired when you receive a message but are NOT in that chat room (System Toast). |
| **`typing`** | `{ "userId": "..." }` | Other user started typing. |

---

## 🌐 4. REST API Endpoints

These endpoints support the UI logic (Inbox list, history loading).

### **GET** `/api/v1/chats/inbox`
**Use Case:** Load the main "Messages" tab.
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "status": "success",
    "results": 5,
    "data": {
      "inbox": [
         {
           "_id": "ROOM_ID",
           "unreadCount": 3,
           "lastMessage": { "content": "See you soon!" },
           "participants": [{ "fullName": "Provider Name" }]
         }
      ]
    }
  }
  ```

### **GET** `/api/v1/chats/:roomId/messages`
**Use Case:** Load previous chat history when scrolling up.
- **Query Params:** `?page=1&limit=50`
- **Response:** Array of Message objects.

### **PATCH** `/api/v1/chats/:roomId/read`
**Use Case:** Mark a conversation as "Read" (clears the unread badge).
- **Call when:** User clicks to open a chat.

---

## 🧪 5. Testing with Postman (How-To)

Since Socket.IO is stateful, it is tested differently than REST APIs.

### Setup
1. Open Postman.
2. Click **New > Socket.IO Request**.
3. Enter URL: `http://localhost:5000`.
4.  **Settings > Handshake Auth**:
    - Key: `token`
    - Value: `Bearer <YOUR_TOKEN>`

### Test Flow
1. **Connect**: Click the blue "Connect" button. Ensure status is "Connected".
2. **Join Room**:
   - In "Message" field, type: `join_room`
   - In "Arguments" (JSON), type: `{ "targetUserId": "<PROVIDER_ID>" }`
   - Click **Send**.
   - **Check 'Events' tab**: Look for the Acknowledgement response containing `roomId`.
3. **Send Message**:
   - Event: `send_message`
   - Arg: `{ "chatRoomId": "<ROOM_ID_FROM_ABOVE>", "content": "Hi there!" }`
   - Click **Send**.
4. **Verify**:
   - Open standard Request tab in Postman.
   - GET `{{baseUrl}}/chats/inbox`
   - You should see the updated `lastMessage` and `unreadCount`.
