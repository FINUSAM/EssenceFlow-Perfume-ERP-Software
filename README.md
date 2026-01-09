# EssenceFlow Project

EssenceFlow is a Luxury Perfume Manufacturing & Inventory ERP.

## Structure
- **frontend/**: React + TypeScript + Vite (High-fidelity UI)
- **backend/**: Node.js + Express + TypeScript + MongoDB (API)

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- MongoDB Connection String (Atlas or Local)

## Getting Started

### 1. Backend Setup (API)
The backend must be running for the frontend to save/retrieve real data.

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your MONGODB_URI

# Seed the database (Optional)
npm run seed

# Start Development Server
npm run dev
```
*Runs on `http://localhost:5000`*

### 2. Frontend Setup (UI)
```bash
cd frontend
npm install

# Start Development Server
npm run dev
```
*Runs on `http://localhost:5173` (typically)*

## Documentation
- **API Spec**: See `frontend/openapi.yaml`
- **Project Status**: See `frontend/PROJECT_STATUS.md`
