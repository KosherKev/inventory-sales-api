# Database Schema Design

## Overview
This document outlines the MongoDB schema for the Inventory & Sales Management System.

## Collections

### 1. Users Collection
Stores user authentication and profile information.

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  role: String (enum: ['admin', 'manager', 'staff'], default: 'staff'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- email (unique)
- role

---

### 2. Locations Collection
Stores business location information.

```javascript
{
  _id: ObjectId,
  name: String (required),
  address: String,
  description: String,
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- name
- createdBy

---

### 3. LocationUsers Collection
Maps users to locations with their roles (many-to-many relationship).

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users, required),
  locationId: ObjectId (ref: Locations, required),
  role: String (enum: ['owner', 'manager', 'staff'], default: 'staff'),
  permissions: {
    canManageInventory: Boolean (default: true),
    canAddSales: Boolean (default: true),
    canViewReports: Boolean (default: true),
    canManageUsers: Boolean (default: false)
  },
  assignedAt: Date,
  assignedBy: ObjectId (ref: Users)
}
```

**Indexes:**
- userId + locationId (compound unique)
- locationId

---

### 4. Inventory Collection
Stores inventory items for each location.

```javascript
{
  _id: ObjectId,
  locationId: ObjectId (ref: Locations, required),
  itemName: String (required),
  unitCost: Number (required, min: 0),
  quantity: Number (required, min: 0),
  totalCost: Number (auto-calculated: unitCost * quantity),
  description: String,
  sku: String (optional, for future use),
  category: String (optional, for future categorization),
  isActive: Boolean (default: true),
  addedBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- locationId + itemName (compound)
- locationId + isActive (compound)
- sku (sparse, unique)

---

### 5. DailySales Collection
Stores daily sales records for each location.

```javascript
{
  _id: ObjectId,
  locationId: ObjectId (ref: Locations, required),
  saleDate: Date (required),
  totalSales: Number (required, min: 0),
  notes: String (optional),
  recordedBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- locationId + saleDate (compound unique - one record per location per day)
- locationId + saleDate (sorted descending for recent sales queries)

---

## Future Enhancements Schema (Prepared for Phase 2)

### 6. InventoryTransactions Collection (Future)
Track inventory changes over time.

```javascript
{
  _id: ObjectId,
  locationId: ObjectId (ref: Locations),
  inventoryId: ObjectId (ref: Inventory),
  transactionType: String (enum: ['purchase', 'sale', 'adjustment', 'return']),
  quantity: Number,
  unitCost: Number,
  totalAmount: Number,
  transactionDate: Date,
  notes: String,
  recordedBy: ObjectId (ref: Users),
  createdAt: Date
}
```

---

### 7. SaleItems Collection (Future)
Track individual items sold (for detailed analytics).

```javascript
{
  _id: ObjectId,
  dailySaleId: ObjectId (ref: DailySales),
  inventoryId: ObjectId (ref: Inventory),
  quantity: Number,
  unitPrice: Number,
  totalPrice: Number,
  createdAt: Date
}
```

---

## Relationships Summary

- **Users ↔ Locations**: Many-to-Many (via LocationUsers)
- **Locations → Inventory**: One-to-Many
- **Locations → DailySales**: One-to-Many
- **Users → Inventory**: One-to-Many (addedBy)
- **Users → DailySales**: One-to-Many (recordedBy)

---

## Key Design Decisions

1. **Separate LocationUsers Collection**: Allows flexible user-location assignments with role-based permissions per location.

2. **Auto-calculated totalCost**: Computed on save/update to maintain data consistency.

3. **Soft Deletes**: Using `isActive` flags instead of hard deletes for audit trail.

4. **One Sale Record Per Day Per Location**: Enforced via compound unique index on `locationId + saleDate`.

5. **Future-Ready**: Schema includes optional fields (sku, category) for future features without breaking changes.

---

## Sample Queries

### Get all inventory for a location
```javascript
db.inventory.find({ locationId: locationId, isActive: true })
```

### Get sales for a date range
```javascript
db.dailySales.find({
  locationId: locationId,
  saleDate: { $gte: startDate, $lte: endDate }
}).sort({ saleDate: -1 })
```

### Get locations for a user
```javascript
db.locationUsers.aggregate([
  { $match: { userId: userId } },
  { $lookup: {
      from: 'locations',
      localField: 'locationId',
      foreignField: '_id',
      as: 'location'
    }
  }
])
```
