# Django Backend - Multi-Tenant Catalogue System

## 🎯 Overview

Production-ready Django REST API backend for a multi-tenant catalogue builder SaaS application with complete data isolation, JWT authentication, and comprehensive security features.

---

## ✨ Features

### 🔒 Security
- **Multi-tenant isolation** - Users can only access their own data
- **JWT authentication** - Secure token-based auth with blacklist
- **Owner protection** - Owner field cannot be modified via API
- **Input validation** - All user input validated and sanitized
- **Consistent error handling** - No information leakage

### 🚀 Functionality
- **Product management** - Full CRUD with images and categories
- **Store settings** - Brand customization and configuration
- **Auto-creation** - Settings created automatically for every user
- **SKU validation** - Unique per user (not globally)
- **Bulk operations** - Support for bulk product uploads

### 📊 API
- **RESTful design** - Standard HTTP methods
- **Consistent responses** - All endpoints return `{success, message, data}`
- **Comprehensive errors** - Clear, user-friendly error messages
- **Health check** - Connectivity testing endpoint
- **Documentation** - Complete API documentation included

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Migrations
```bash
python manage.py migrate
```

### 3. Start Server
```bash
python manage.py runserver
```

### 4. Test Health Check
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
    "version": "1.0.0"
  }
}
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register/` | Register new user | No |
| POST | `/auth/login/` | Login and get JWT tokens | No |
| POST | `/auth/logout/` | Logout and blacklist token | Yes |
| POST | `/auth/refresh/` | Refresh access token | No |
| GET | `/auth/profile/` | Get user profile | Yes |
| PATCH | `/auth/profile/` | Update user profile | Yes |

### Products
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products/` | List user's products | Yes |
| POST | `/api/products/` | Create new product | Yes |
| GET | `/api/products/{id}/` | Get product details | Yes |
| PATCH | `/api/products/{id}/` | Update product | Yes |
| DELETE | `/api/products/{id}/` | Delete product | Yes |

### Settings
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/settings/` | Get user's settings | Yes |
| GET | `/api/settings/me/` | Get user's settings (alias) | Yes |
| PATCH | `/api/settings/{id}/` | Update settings | Yes |

### Health
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health/` | Health check | No |

---

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "name": "Product Name",
    ...
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Operation failed",
  "data": {
    "errors": {
      "field": ["Error message"]
    }
  }
}
```

---

## 🔐 Authentication Flow

### 1. Register
```bash
POST /auth/register/
{
  "username": "john",
  "email": "john@example.com",
  "password": "securepass123",
  "password2": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Welcome!",
  "data": {
    "user": {...},
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
  }
}
```

### 2. Login
```bash
POST /auth/login/
{
  "username": "john",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 3. Use Token
```bash
GET /api/products/
Headers:
  Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 4. Logout
```bash
POST /auth/logout/
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 🏗️ Architecture

### Models
- **Product** - Product information with owner relationship
- **StoreSettings** - One-to-one with User for store customization

### Security Layers
1. **Authentication** - JWT tokens required
2. **Permission Classes** - IsOwner validates ownership
3. **Queryset Filtering** - Users only see their own data
4. **Serializer Validation** - Owner cannot be modified
5. **View Validation** - Double-check ownership on updates

### Auto-Creation
1. **Registration** - Settings created with user
2. **Middleware** - Settings created on first request
3. **ViewSet** - Settings created on first API access

---

## 🔒 Security Features

### Multi-Tenant Isolation
✅ Queryset filtering by owner
✅ Object-level permissions
✅ Owner field read-only
✅ Validation on all operations
✅ 404 for unauthorized access

### Data Protection
✅ Input validation
✅ Data sanitization
✅ SQL injection prevention
✅ XSS prevention
✅ CSRF protection

### Authentication
✅ JWT tokens
✅ Token blacklist on logout
✅ Token refresh
✅ Password hashing
✅ Session security

---

## 📊 Database Models

### Product
```python
- owner (ForeignKey to User)
- name (CharField)
- description (TextField)
- price (DecimalField)
- category (CharField)
- sku (CharField, unique per owner)
- images (JSONField)
- created_at (DateTimeField)
- updated_at (DateTimeField)
```

### StoreSettings
```python
- owner (OneToOneField to User)
- brand_name (CharField)
- brand_logo (TextField)
- domain_url (CharField)
- currency (CharField, default='INR')
- cta_style (CharField)
- whatsapp_phone (CharField)
- whatsapp_message (TextField)
- catalogue_template (CharField)
- created_at (DateTimeField)
- updated_at (DateTimeField)
```

---

## 🧪 Testing

### Manual Testing
See `TESTING_GUIDE.md` for comprehensive testing instructions.

### Quick Test
```bash
# Health check
curl http://localhost:8000/api/health/

# Register
curl -X POST http://localhost:8000/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test1234","password2":"test1234"}'

# Get settings (auto-created)
curl http://localhost:8000/api/settings/ \
  -H "Authorization: Bearer <token>"
```

---

## 📚 Documentation

### Complete Documentation
- **BACKEND_IMPROVEMENTS.md** - Technical documentation
- **TESTING_GUIDE.md** - Testing instructions
- **IMPLEMENTATION_SUMMARY.md** - Overview of changes
- **QUICK_START.md** - Quick reference
- **CHANGES_LOG.md** - Detailed change log

### Code Documentation
- Comprehensive docstrings
- Inline comments
- Type hints
- Clear function names

---

## 🔧 Configuration

### Environment Variables
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

### JWT Settings
```python
ACCESS_TOKEN_LIFETIME = 24 hours
REFRESH_TOKEN_LIFETIME = 7 days
ROTATE_REFRESH_TOKENS = True
BLACKLIST_AFTER_ROTATION = True
```

### CORS Settings
```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [configured in .env]
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Use strong `SECRET_KEY`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Configure static files
- [ ] Set up HTTPS
- [ ] Configure logging
- [ ] Set up monitoring

### Deployment Commands
```bash
# Collect static files
python manage.py collectstatic

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run with gunicorn
gunicorn backend.wsgi:application
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** "Authentication credentials were not provided"
**Solution:** Include `Authorization: Bearer <token>` header

**Issue:** "Product not found"
**Solution:** Check you're using the correct user's token

**Issue:** Settings not auto-created
**Solution:** Middleware should handle this automatically

**Issue:** CORS errors
**Solution:** Check `CORS_ALLOWED_ORIGINS` in settings

---

## 📈 Performance

### Optimizations
- `.select_related('owner')` - Reduces queries
- `.exists()` instead of `.count()` - Faster checks
- Transaction safety - Prevents partial saves
- Efficient validation - Minimal database hits

### Expected Performance
- Health check: < 50ms
- Product list: < 100ms
- Product create: < 200ms
- Settings update: < 150ms

---

## 🔮 Future Enhancements

### Recommended
- Unit tests (pytest)
- Integration tests
- API documentation (drf-spectacular)
- Rate limiting
- Caching (Redis)
- Structured logging
- Monitoring (Sentry)

### Optional
- GraphQL endpoint
- WebSocket support
- Celery for async tasks
- Elasticsearch for search
- S3 for image storage

---

## 📞 Support

### Getting Help
1. Check documentation files
2. Review inline code comments
3. Check error messages (now user-friendly!)
4. Review TESTING_GUIDE.md

### Reporting Issues
- Include error message
- Include request/response
- Include steps to reproduce
- Include environment details

---

## 🙏 Credits

**Framework:** Django 5.2.9
**REST Framework:** Django REST Framework
**Authentication:** Simple JWT
**CORS:** django-cors-headers

---

## 📄 License

This project is provided as-is for educational and commercial use.

---

## ✅ Summary

**Production-ready Django backend with:**
- ✅ Complete multi-tenant isolation
- ✅ Secure JWT authentication
- ✅ Comprehensive validation
- ✅ Consistent API responses
- ✅ Auto-creation of settings
- ✅ Enhanced security
- ✅ Complete documentation

**Ready to deploy! 🚀**

---

**For detailed technical documentation, see BACKEND_IMPROVEMENTS.md**
