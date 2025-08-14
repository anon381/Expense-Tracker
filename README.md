<div align="center">

# 💰 Expense Tracker App

Full‑stack expense tracking application built with **React (Vite)** on the frontend and **Express.js (Node.js)** backend. Data is persisted locally using simple **JSON file storage** (no external database) plus JWT authentication.

</div>

---

## 🚀 Features (Current)

- JWT registration & login
- Add / list / update / delete transactions (income & expense)
- Basic filtering (date range, category, type, search term)
- Monthly summary (income, expense, net)
- Default seeded categories + ability to extend (API support ready)
- File‑based persistence (users, categories, transactions JSON files)
- CORS enabled for local React dev

## 🧭 Planned / Nice to Have

- Frontend UI for auth & transactions
- Charts & category breakdowns
- Budgets & recurring transactions
- Export (CSV / JSON)
- Theming & responsive polishing

---

## 🛠️ Tech Stack

### Frontend
- React 18 (Vite build tool)
- (Planned) React Router, Axios, Tailwind CSS (not yet added to dependencies)

### Backend
- Node.js + Express.js
- JSON Web Tokens (jsonwebtoken) + bcryptjs for password hashing
- Flat JSON file storage (no DB) under `server/data/`

### Tooling
- ESLint 8
- Nodemon + concurrently (combined dev workflow)

---

## 📂 Project Structure (Actual)

```
expense-tracker/
├── .env                     # Environment variables (PORT, CORS, JWT secret)
├── package.json             # Scripts & dependencies
├── vite.config.js           # Vite build config
├── index.html               # App entry HTML
├── src/                     # React source
│   ├── main.jsx             # Mount + StrictMode
│   ├── App.jsx              # Placeholder root component
│   └── index.css            # Base styles
└── server/                  # Express backend
		├── index.js             # Server bootstrap
		├── loadEnv.js           # Loads .env
		├── middleware/
		│   └── auth.js          # JWT auth middleware
		├── routes/
		│   ├── auth.js          # /api/auth (register/login)
		│   └── transactions.js  # /api/transactions & summary endpoints
		├── store/               # File-backed stores
		│   ├── userStore.js
		│   ├── categoryStore.js
		│   └── transactionStore.js
		└── data/                # Persistent JSON data
				├── users.json
				├── categories.json
				└── transactions.json
```

---

## ⚙️ Installation & Setup

1. Clone repository
```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```
2. Install dependencies
```bash
npm install
```
3. (Optional) Adjust `.env`
```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace_this_in_production
```
4. Run backend only
```bash
npm run server:dev
```
5. Run frontend only
```bash
npm run dev
```
6. Run both concurrently
```bash
npm run dev:full
```

Backend API default: `http://localhost:4000`  
Vite dev server: `http://localhost:5173`

---

## 🔐 Authentication Flow

1. Register via `POST /api/auth/register` (username + password) → JWT token
2. Store token client-side (e.g., memory or localStorage) *(frontend not yet implemented)*
3. Authorize subsequent requests with `Authorization: Bearer <token>` header

---

## 🔗 API Endpoints

| Method | Endpoint                              | Description |
|--------|----------------------------------------|-------------|
| GET    | /api/health                            | Health/status ping |
| POST   | /api/auth/register                     | Register new user (returns JWT) |
| POST   | /api/auth/login                        | Login existing user (returns JWT) |
| GET    | /api/transactions                      | List transactions (filters: start, end, category, type, search) |
| POST   | /api/transactions                      | Create transaction (income/expense) |
| PUT    | /api/transactions/:id                  | Update transaction |
| DELETE | /api/transactions/:id                  | Delete transaction |
| GET    | /api/transactions/summary/monthly      | Current month summary (income/expense/net) |
| GET    | /api/transactions/categories           | List categories |

All `/api/transactions*` endpoints require `Authorization: Bearer <token>`.

Example create transaction request body:
```json
{
	"type": "expense",
	"amount": 12.99,
	"currency": "USD",
	"category": "Food",
	"description": "Lunch wrap",
	"date": "2025-08-14T10:15:00Z"
}
```

---

## 🧪 Quick Test (via curl)
```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
	-H "Content-Type: application/json" \
	-d '{"username":"user1","password":"pass123"}'

# Login (if already registered)
curl -X POST http://localhost:4000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"username":"user1","password":"pass123"}'
```

Copy the token and use it to create a transaction:
```bash
TOKEN=eyJ...your.jwt...
curl -X POST http://localhost:4000/api/transactions \
	-H "Authorization: Bearer $TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"type":"expense","amount":15.5,"category":"Food","description":"Sandwich"}'
```



---



---

