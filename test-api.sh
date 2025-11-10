#!/bin/bash

BASE_URL="http://localhost:5000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Inventory & Sales API"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s $BASE_URL/../health)
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Register User
echo "2️⃣  Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User",
    "role": "admin"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ User registration successful${NC}"
    TEST_EMAIL=$(echo "$REGISTER_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
    echo "   Email: $TEST_EMAIL"
else
    echo -e "${RED}❌ User registration failed${NC}"
    echo "$REGISTER_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Login
echo "3️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "test123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get Current User
echo "4️⃣  Getting current user info..."
ME_RESPONSE=$(curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ User info retrieved${NC}"
else
    echo -e "${RED}❌ Failed to get user info${NC}"
    exit 1
fi
echo ""

# Test 5: Create Location
echo "5️⃣  Creating a location..."
LOCATION_RESPONSE=$(curl -s -X POST $BASE_URL/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Store",
    "address": "123 Test Street",
    "description": "Testing location"
  }')

if echo "$LOCATION_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Location created${NC}"
    LOCATION_ID=$(echo "$LOCATION_RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
    echo "   Location ID: $LOCATION_ID"
else
    echo -e "${RED}❌ Failed to create location${NC}"
    echo "$LOCATION_RESPONSE"
    exit 1
fi
echo ""

# Test 6: Add Inventory Item
echo "6️⃣  Adding inventory item..."
INVENTORY_RESPONSE=$(curl -s -X POST $BASE_URL/locations/$LOCATION_ID/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "itemName": "Test Product",
    "unitCost": 25.50,
    "quantity": 100,
    "description": "Test inventory item"
  }')

if echo "$INVENTORY_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Inventory item added${NC}"
    ITEM_ID=$(echo "$INVENTORY_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Item ID: $ITEM_ID"
else
    echo -e "${RED}❌ Failed to add inventory item${NC}"
    echo "$INVENTORY_RESPONSE"
    exit 1
fi
echo ""

# Test 7: Get Inventory
echo "7️⃣  Retrieving inventory..."
GET_INVENTORY=$(curl -s -X GET $BASE_URL/locations/$LOCATION_ID/inventory \
  -H "Authorization: Bearer $TOKEN")

if echo "$GET_INVENTORY" | grep -q "totalValue"; then
    echo -e "${GREEN}✅ Inventory retrieved${NC}"
    TOTAL_VALUE=$(echo "$GET_INVENTORY" | grep -o '"totalValue":[0-9.]*' | cut -d':' -f2)
    echo "   Total Inventory Value: $TOTAL_VALUE"
else
    echo -e "${RED}❌ Failed to retrieve inventory${NC}"
    exit 1
fi
echo ""

# Test 8: Add Daily Sales
echo "8️⃣  Adding daily sales record..."
SALES_RESPONSE=$(curl -s -X POST $BASE_URL/locations/$LOCATION_ID/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "saleDate": "'$(date +%Y-%m-%d)'",
    "totalSales": 1250.00,
    "notes": "Test sales record"
  }')

if echo "$SALES_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Sales record added${NC}"
    SALES_ID=$(echo "$SALES_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Sales ID: $SALES_ID"
else
    echo -e "${RED}❌ Failed to add sales record${NC}"
    echo "$SALES_RESPONSE"
    exit 1
fi
echo ""

# Test 9: Get Sales Summary
echo "9️⃣  Getting sales summary..."
SUMMARY_RESPONSE=$(curl -s -X GET $BASE_URL/locations/$LOCATION_ID/sales/summary \
  -H "Authorization: Bearer $TOKEN")

if echo "$SUMMARY_RESPONSE" | grep -q "totalRevenue"; then
    echo -e "${GREEN}✅ Sales summary retrieved${NC}"
    TOTAL_REVENUE=$(echo "$SUMMARY_RESPONSE" | grep -o '"totalRevenue":[0-9.]*' | cut -d':' -f2)
    echo "   Total Revenue: $TOTAL_REVENUE"
else
    echo -e "${RED}❌ Failed to retrieve sales summary${NC}"
    exit 1
fi
echo ""

echo "================================"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Test user credentials:"
echo "  Email: $TEST_EMAIL"
echo "  Password: test123"
echo ""
echo "You can use these credentials to test the API further."
echo "Or import the Postman collection for more detailed testing."
