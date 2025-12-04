# Testing Guide - Backend Improvements

## 🧪 Quick Test Commands

### 1. Test Health Check
```bash
curl http://localhost:8000/api/health/
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is healthy and running.",
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "authenticated": false,
    "user": null
  }
}
```

---

### 2. Test Registration
```bash
curl -X POST http://localhost:8000/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password2": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Welcome!",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "first_name": "Test",
      "last_name": "User"
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
  }
}
```

---

### 3. Test Login
```bash
curl -X POST http://localhost:8000/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### 4. Test Settings Auto-Creation
```bash
# Save the access token from login
TOKEN="your_access_token_here"

curl http://localhost:8000/api/settings/ \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Settings retrieved successfully.",
  "data": {
    "id": 1,
    "owner": "testuser",
    "owner_id": 1,
    "brand_name": "",
    "brand_logo": "",
    "domain_url": "",
    "currency": "INR",
    "cta_style": "cart",
    "whatsapp_phone": "",
    "whatsapp_message": "",
    "catalogue_template": "minimal",
    "created_at": "2024-12-04T...",
    "updated_at": "2024-12-04T..."
  }
}
```

---

### 5. Test Product Creation
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 99.99,
    "category": "Electronics",
    "sku": "TEST-001",
    "images": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Product created successfully.",
  "data": {
    "id": 1,
    "owner": "testuser",
    "owner_id": 1,
    "store_name": "testuser",
    "name": "Test Product",
    "description": "A test product",
    "price": "99.99",
    "category": "Electronics",
    "sku": "TEST-001",
    "images": [],
    "created_at": "2024-12-04T...",
    "updated_at": "2024-12-04T..."
  }
}
```

---

### 6. Test Multi-Tenant Isolation

**Create Second User:**
```bash
curl -X POST http://localhost:8000/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user2",
    "email": "user2@example.com",
    "password": "testpass123",
    "password2": "testpass123"
  }'
```

**Try to Access User1's Product with User2's Token:**
```bash
# This should return 404 or empty list
curl http://localhost:8000/api/products/1/ \
  -H "Authorization: Bearer $USER2_TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Product not found or you don't have permission to access it.",
  "data": {
    "errors": {
      "detail": "..."
    }
  }
}
```

---

### 7. Test SKU Uniqueness Per User

**User1 Creates Product:**
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product A",
    "price": 50,
    "sku": "SHARED-SKU"
  }'
```

**User2 Creates Product with Same SKU (Should Succeed):**
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product B",
    "price": 60,
    "sku": "SHARED-SKU"
  }'
```

**Expected:** Both succeed! SKU is unique per user, not globally.

**User1 Creates Another Product with Same SKU (Should Fail):**
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product C",
    "price": 70,
    "sku": "SHARED-SKU"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Product creation failed.",
  "data": {
    "errors": {
      "sku": ["You already have a product with this SKU."]
    }
  }
}
```

---

### 8. Test Logout
```bash
curl -X POST http://localhost:8000/auth/logout/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logout successful. Token blacklisted."
}
```

---

### 9. Test Settings Update
```bash
curl -X PATCH http://localhost:8000/api/settings/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "My Awesome Store",
    "currency": "USD"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully.",
  "data": {
    "id": 1,
    "owner": "testuser",
    "brand_name": "My Awesome Store",
    "currency": "USD",
    ...
  }
}
```

---

### 10. Test Error Handling

**Try to Create Product Without Authentication:**
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "price": 10,
    "sku": "TEST"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Authentication required. Please log in.",
  "data": {
    "errors": {
      "detail": "Authentication credentials were not provided."
    }
  }
}
```

---

## 🎯 Frontend Testing (Browser)

### 1. Start Server
```bash
python manage.py runserver
```

### 2. Open Browser
Navigate to: `http://localhost:8000/register.html`

### 3. Test Registration
- Fill in the form
- Submit
- Should redirect to dashboard
- Check browser console for tokens

### 4. Test Settings Auto-Save
- Go to Brand Settings
- Change brand name
- Click away from field
- Check console: "✅ brand_name saved: ..."
- Refresh page
- Brand name should persist

### 5. Test Product Creation
- Go to Add Products
- Fill in product details
- Click "Add Product"
- Should see success toast
- Go to Manage Products
- Product should appear in list

### 6. Test Multi-Tenant
- Logout
- Register new user
- Add products
- Should only see own products
- Cannot see first user's products

---

## ✅ Success Criteria

All tests should pass with:
- ✅ Consistent JSON responses
- ✅ Proper success/error messages
- ✅ Multi-tenant isolation working
- ✅ Settings auto-created
- ✅ SKU validation working
- ✅ Authentication working
- ✅ Logout working
- ✅ No cross-user data access

---

## 🐛 Troubleshooting

### Issue: "Authentication credentials were not provided"
**Solution:** Include `Authorization: Bearer <token>` header

### Issue: "Product not found"
**Solution:** Check if you're using the correct user's token

### Issue: "Settings not found"
**Solution:** Settings should auto-create. Check middleware is enabled.

### Issue: "SKU already exists"
**Solution:** Each user can only have one product with that SKU. Use different SKU or update existing product.

---

## 📊 Performance Testing

### Test Response Times:
```bash
# Install Apache Bench
# Test health endpoint
ab -n 1000 -c 10 http://localhost:8000/api/health/

# Test authenticated endpoint (with token)
ab -n 100 -c 5 -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/products/
```

### Expected Performance:
- Health check: < 50ms
- Product list: < 100ms
- Product create: < 200ms
- Settings update: < 150ms

---

## 🔍 Debugging

### Enable Django Debug Toolbar (Optional):
```bash
pip install django-debug-toolbar
```

Add to `INSTALLED_APPS` and `MIDDLEWARE` in settings.py

### Check Logs:
```bash
# In settings.py, add:
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
```

---

## 📝 Test Checklist

- [ ] Health check works
- [ ] Registration creates user + settings + tokens
- [ ] Login returns tokens
- [ ] Logout blacklists token
- [ ] Settings auto-created on first request
- [ ] Product CRUD works
- [ ] Multi-tenant isolation verified
- [ ] SKU unique per user
- [ ] Error responses are consistent
- [ ] Frontend integration works
- [ ] Auto-save works
- [ ] Page refresh persists data

**All tests passing? You're ready for production! 🚀**
