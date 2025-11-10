# Inventory & Sales Management API

A RESTful API built with Node.js, Express, and MongoDB for managing inventory and sales across multiple business locations.

## Features

- 🔐 **User Authentication & Authorization** - JWT-based authentication with role-based access control
- 📍 **Multi-Location Support** - Manage multiple business locations with independent inventory and sales
- 📦 **Inventory Management** - Track items with auto-calculated costs
- 💰 **Daily Sales Tracking** - Record daily revenue with date-based uniqueness
- 👥 **User Management** - Assign users to locations with custom permissions
- 🔒 **Permission System** - Granular control over user capabilities per location

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd inventory-sales-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/inventory_sales_db
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRE=7d
   CORS_ORIGIN=*
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   brew services start mongodb-community
   
   # Or run directly
   mongod --config /usr/local/etc/mongod.conf
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "staff"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "staff"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "locations": []
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Location Endpoints

#### Create Location
```http
POST /locations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main Store",
  "address": "123 Main St, City",
  "description": "Primary retail location"
}
```

#### Get All Locations (for current user)
```http
GET /locations
Authorization: Bearer <token>
```

#### Get Single Location
```http
GET /locations/:locationId
Authorization: Bearer <token>
```

#### Update Location
```http
PUT /locations/:locationId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Store Name",
  "address": "New Address"
}
```

#### Delete Location (Soft Delete)
```http
DELETE /locations/:locationId
Authorization: Bearer <token>
```

### Inventory Endpoints

#### Add Inventory Item
```http
POST /locations/:locationId/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemName": "Product A",
  "unitCost": 25.50,
  "quantity": 100,
  "description": "Description of product",
  "sku": "PROD-A-001",
  "category": "Electronics"
}
```

#### Get All Inventory for Location
```http
GET /locations/:locationId/inventory
Authorization: Bearer <token>
Query Parameters:
  - isActive (boolean): Filter by active status
  - category (string): Filter by category
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "summary": {
    "totalValue": 5000,
    "totalItems": 250
  },
  "data": [...]
}
```

#### Get Single Inventory Item
```http
GET /locations/:locationId/inventory/:itemId
Authorization: Bearer <token>
```

#### Update Inventory Item
```http
PUT /locations/:locationId/inventory/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 150,
  "unitCost": 26.00
}
```

#### Delete Inventory Item (Soft Delete)
```http
DELETE /locations/:locationId/inventory/:itemId
Authorization: Bearer <token>
```

### Sales Endpoints

#### Add Daily Sales Record
```http
POST /locations/:locationId/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "saleDate": "2024-01-15",
  "totalSales": 1250.00,
  "notes": "Good sales day"
}
```

#### Get Sales Records
```http
GET /locations/:locationId/sales
Authorization: Bearer <token>
Query Parameters:
  - startDate (ISO date): Start date for range
  - endDate (ISO date): End date for range
  - limit (number): Number of records (default: 30)
```

#### Get Single Sales Record
```http
GET /locations/:locationId/sales/:salesId
Authorization: Bearer <token>
```

#### Update Sales Record
```http
PUT /locations/:locationId/sales/:salesId
Authorization: Bearer <token>
Content-Type: application/json

{
  "totalSales": 1300.00,
  "notes": "Updated amount"
}
```

#### Delete Sales Record
```http
DELETE /locations/:locationId/sales/:salesId
Authorization: Bearer <token>
```

#### Get Sales Summary
```http
GET /locations/:locationId/sales/summary
Authorization: Bearer <token>
Query Parameters:
  - startDate (ISO date): Start date for range
  - endDate (ISO date): End date for range
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 25000,
    "averageDailySales": 833.33,
    "numberOfDays": 30,
    "highestSalesDay": {
      "date": "2024-01-20",
      "amount": 1500
    },
    "lowestSalesDay": {
      "date": "2024-01-05",
      "amount": 500
    }
  }
}
```

## User Roles & Permissions

### System Roles
- **admin**: Full system access
- **manager**: Can manage locations they're assigned to
- **staff**: Limited access based on location permissions

### Location-Specific Roles
- **owner**: Full control over the location
- **manager**: Can manage inventory and view reports
- **staff**: Basic access based on permissions

### Permissions
Each user-location assignment has specific permissions:
- `canManageInventory`: Add/edit/delete inventory items
- `canAddSales`: Add/edit daily sales records
- `canViewReports`: View analytics and summaries
- `canManageUsers`: Assign users to the location

## Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed schema documentation.

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Project Structure

```
inventory-sales-api/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── inventoryController.js
│   │   ├── locationController.js
│   │   └── salesController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── locationAccess.js    # Permission checks
│   ├── models/
│   │   ├── User.js
│   │   ├── Location.js
│   │   ├── LocationUser.js
│   │   ├── Inventory.js
│   │   └── DailySales.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── locationRoutes.js
│   │   └── salesRoutes.js
│   └── server.js                # App entry point
├── .env.example
├── .gitignore
├── package.json
├── DATABASE_SCHEMA.md
└── README.md
```

## Testing the API

### Using curl

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Create a location (replace TOKEN with your JWT)
curl -X POST http://localhost:5000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Test Store","address":"123 Test St"}'
```

### Using Postman

1. Import the API endpoints into Postman
2. Set up an environment variable for the JWT token
3. Use `{{token}}` in Authorization headers

## Future Enhancements

- [ ] Inventory transaction history
- [ ] Item-level sales tracking
- [ ] Advanced analytics and reporting
- [ ] Low stock alerts
- [ ] Multi-currency support
- [ ] Export data (CSV, PDF)
- [ ] Email notifications
- [ ] Webhook support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on the repository.

## Deployment: Docker & Google Cloud Run

### Build and Run Locally with Docker

1. Build the image:
   ```bash
   docker build -t inventory-sales-api .
   ```

2. Run the container (provide required environment variables):
   ```bash
   docker run -p 8080:8080 \
     -e NODE_ENV=production \
     -e MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority" \
     -e JWT_SECRET="your_secure_jwt_secret" \
     -e CORS_ORIGIN="*" \
     inventory-sales-api
   ```

3. Verify health:
   ```bash
   curl http://localhost:8080/health
   ```

The API base URL in Docker will be `http://localhost:8080/api`.

### Deploy to Google Cloud Run

Prerequisites:
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- A Google Cloud project selected (`gcloud config set project <PROJECT_ID>`)

1. Build and push the container image using Cloud Build:
   ```bash
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/inventory-sales-api ./inventory-sales-api
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy inventory-sales-api \
     --image gcr.io/<PROJECT_ID>/inventory-sales-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,JWT_SECRET=your_secure_jwt_secret,CORS_ORIGIN=*,MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
   ```

Notes:
- Cloud Run injects `PORT` automatically (defaults to `8080`); the app reads `process.env.PORT`.
- If using MongoDB Atlas, ensure network access allows connections from Cloud Run.
- Set `CORS_ORIGIN` to your frontend domain (e.g., Cloud Run URL) rather than `*` for production.

### Update Flutter Base URL

After deployment, update the Flutter app’s API base URL in `inventory_sales_app/lib/utils/constants.dart`:
```dart
static const String apiBaseUrl = 'https://<your-cloud-run-url>/api';
```
