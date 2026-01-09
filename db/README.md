# Local Database Setup

This directory contains the Docker Compose configuration to run MongoDB locally.

## Prerequisites
- Docker Desktop installed and running.

## How to Run

1. Open a terminal in this directory:
   ```bash
   cd db
   ```

2. Start the database:
   ```bash
   docker-compose up -d
   ```

3. Access the database:
   - **Connection URI**: `mongodb://admin:password123@localhost:27017/essenceflow?authSource=admin`
   - **Web Interface (Mongo Express)**: [http://localhost:8081](http://localhost:8081)
     - User: `admin`
     - Pass: `password123`

## Update Backend Configuration
Update your `backend/.env` file to use this local instance:

```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/essenceflow?authSource=admin
```
