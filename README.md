## Tabungin API Documentation

## 📖 Overview
**Tabungin** is a savings application designed to help users manage their finances efficiently. This API serves as the backend for Tabungin, allowing users to create savings, set goals, track additions and reductions, and monitor progress.

## 🚀 Features
- User authentication and authorization.
- Create, update, and delete savings, history, and goals records.
- Record additions and reductions to savings.
- Monitor savings progress.

## 🛠️ Technologies Used
- **Backend Framework**: Node.js
- **Database**: Firestore (NoSQL)
- **Cloud Services**: Google Cloud Platform (GCP)
  - Cloud Run
  - Cloud Build
  - Firebase Authentication

---

## 📊 Diagrams
To understand the architecture and hierarchy of this project, refer to the following diagrams:

**Cloud Architecture Diagram** and **Database Hierarchy Diagram**:  
[Tabungin Cloud Architecture Diagram and Database Hierarchy Diagram on Figma](https://www.figma.com/board/H3embkqn8caWyggV5a04P5/Tabungin-Architecture?node-id=0-1&t=nT9PWv92zcNxSLGW-1)

---

## 📡 API Documentation
Comprehensive API documentation is available on Postman:  
[Tabungin API Documentation on Postman](https://documenter.getpostman.com/view/39297796/2sAYBUEY3r)

---

## 📝 How to Use This API
### Prerequisites
1. Register first to save your data on database.
1. Obtain an authentication token via the **Login** endpoints.
2. Use tools like Postman or cURL to interact with the API.

### Steps to Use:
1. **Authentication**:
   - Register a new user using the `/auth/register` endpoint.
   - Login to obtain a token with `/auth/login.

2. **Manage Savings**:
   - View the saving with `/savings/:userId`.

3. **Track Additions and Reductions**:
   - Add or Reduce savings with `/savings/:userId`.
   - Delete transaction history as needed.

4. **Set Goals**:
   - Create a saving goal with `/goals/:userId/:savingId`.
   - Track progress of goals with `/goals/:userId/:savingId`.
   - Update saving goal with `/goals/:userId/:savingId/:goalId`.
   - Delete saving goal with `/goals/:userId/:savingId/:goalId`.
