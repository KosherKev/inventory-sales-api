# Quick Start Guide

## Prerequisites Check
- ✅ Node.js (v14+)
- ✅ MongoDB (v4.4+)
- ✅ npm or yarn

## Installation Steps

### 1. Run Setup Script (macOS/Linux)
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup (Alternative)

```bash
# Install dependencies
npm install

# Start MongoDB
brew services start mongodb-community

# Start the server
npm run dev
```

## Verify Installation

### Check API Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## First Steps

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Save the `token` from the response!

### 3. Create a Location
```bash
curl -X POST http://localhost:5000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Main Store",
    "address": "123 Main Street",
    "description": "Primary retail location"
  }'
```

Save the location `_id` from the response!

### 4. Add Inventory Item
```bash
curl -X POST http://localhost:5000/api/locations/LOCATION_ID/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "itemName": "Product A",
    "unitCost": 25.50,
    "quantity": 100,
    "description": "Sample product"
  }'
```

### 5. Add Daily Sales
```bash
curl -X POST http://localhost:5000/api/locations/LOCATION_ID/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "saleDate": "2024-01-15",
    "totalSales": 1250.00,
    "notes": "Good sales day"
  }'
```

## Using Postman

1. Import `postman_collection.json` into Postman
2. Create an environment with variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: (will be auto-populated after login)
   - `locationId`: (will be auto-populated after creating location)

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Start MongoDB
```bash
brew services start mongodb-community
# or
mongod --config /usr/local/etc/mongod.conf
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:** Change port in `.env` file or kill the process using port 5000
```bash
lsof -ti:5000 | xargs kill -9
```

### JWT Token Expired
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Solution:** Login again to get a new token

## Next Steps

- Read the full [README.md](./README.md) for detailed API documentation
- Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for database structure
- Explore the API endpoints in Postman
- Start building your Flutter frontend!

## Development Tips

### Auto-Restart on Changes
```bash
npm run dev
```

### View MongoDB Data
```bash
mongosh
use inventory_sales_db
db.users.find()
db.locations.find()
db.inventory.find()
db.dailySales.find()
```

### Clear All Data (Reset Database)
```bash
mongosh
use inventory_sales_db
db.dropDatabase()
```

## Support

For issues and questions:
1. Check the [README.md](./README.md)
2. Review error messages carefully
3. Ensure MongoDB is running
4. Verify your JWT token is valid
