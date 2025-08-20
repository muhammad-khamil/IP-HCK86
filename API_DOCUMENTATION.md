# API Documentation - Aplikasi SPPD

## Base URL
```
http://localhost:3000
```

## Authentication
Gunakan Bearer Token di header Authorization:
```
Authorization: Bearer <your_token>
```

## Test Accounts
### Admin Account
- Email: `admin@gmail.com`
- Password: `12345`
- Role: `admin`

### Staff Account
- Email: `kemil@gmail.com`
- Password: `12345` 
- Role: `staff`

## Endpoints

### 1. Authentication

#### Register
```http
POST /register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@email.com",
  "password": "password123",
  "role": "staff" // optional, default: "staff"
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "12345"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. User Profile

#### Get Profile
```http
GET /profile
Authorization: Bearer <token>
```

### 3. SPPD Management

#### Create SPPD (Staff Only)
```http
POST /sppd
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "daerah_tujuan": "Jakarta",
  "maksud_perjalanan": "Rapat koordinasi dengan kantor pusat",
  "instansi_dituju": "Kantor Pusat PT ABC",
  "tanggalBerangkat": "2024-01-15",
  "tanggalPulang": "2024-01-17",
  "jenisTransportasi": "Pesawat",
  "hargaTiket": 1500000,
  "imgTiket": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "namaHotel": "Hotel Santika",
  "hargaHotel": 800000,
  "imgBill": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

#### Get All SPPD
```http
GET /sppd
Authorization: Bearer <token>

Query Parameters:
- status: pending|approved|rejected (optional)
- page: 1 (optional, default: 1)
- limit: 10 (optional, default: 10)
```

**Behavior:**
- **Staff**: Hanya melihat SPPD milik sendiri
- **Admin**: Melihat semua SPPD dari semua staff

Response:
```json
{
  "sppds": [...],
  "pagination": {
    "totalItems": 50,
    "currentPage": 1,
    "totalPages": 5,
    "itemsPerPage": 10
  }
}
```

#### Get SPPD by ID
```http
GET /sppd/:id
Authorization: Bearer <token>
```

#### Update SPPD
```http
PUT /sppd/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "daerah_tujuan": "Surabaya",
  "maksud_perjalanan": "Updated purpose"
  // ... other fields
}
```

**Permissions:**
- **Staff**: Hanya bisa edit SPPD milik sendiri dan hanya jika status = "pending"
- **Admin**: Bisa edit semua SPPD

#### Delete SPPD
```http
DELETE /sppd/:id
Authorization: Bearer <token>
```

**Permissions:**
- **Staff**: Hanya bisa hapus SPPD milik sendiri dan hanya jika status = "pending"
- **Admin**: Bisa hapus semua SPPD

### 4. Admin Features

#### Update SPPD Status (Admin Only)
```http
PATCH /sppd/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved" // or "rejected"
}
```

#### Dashboard Statistics (Admin Only)
```http
GET /dashboard/stats
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "totalSPPD": 25,
  "pendingSPPD": 8,
  "approvedSPPD": 15,
  "rejectedSPPD": 2,
  "totalStaff": 10
}
```

## Role-based Access Control

### Staff Permissions:
- ✅ Create SPPD
- ✅ View own SPPD only
- ✅ Edit own SPPD (only if status = "pending")
- ✅ Delete own SPPD (only if status = "pending")
- ❌ View other users' SPPD
- ❌ Change SPPD status
- ❌ Access admin dashboard

### Admin Permissions:
- ✅ View all SPPD from all staff
- ✅ Edit any SPPD
- ✅ Delete any SPPD
- ✅ Approve/Reject SPPD (change status)
- ✅ Access dashboard statistics
- ❌ Create SPPD (typically admins don't create SPPD)

## Status Flow
1. **pending** - Default status when staff creates SPPD
2. **approved** - Admin approves the SPPD
3. **rejected** - Admin rejects the SPPD

## Error Responses

### 400 Bad Request
```json
{
  "message": "Email is required"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "message": "Access forbidden"
}
```

### 404 Not Found
```json
{
  "message": "SPPD not found"
}
```

## Testing dengan cURL

### Login as Admin
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"12345"}'
```

### Login as Staff
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kemil@gmail.com","password":"12345"}'
```

### Create SPPD (Staff)
```bash
curl -X POST http://localhost:3000/sppd \
  -H "Authorization: Bearer <staff_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "daerah_tujuan": "Jakarta",
    "maksud_perjalanan": "Rapat koordinasi",
    "instansi_dituju": "Kantor Pusat",
    "tanggalBerangkat": "2024-01-15",
    "tanggalPulang": "2024-01-17",
    "jenisTransportasi": "Pesawat",
    "hargaTiket": 1500000,
    "imgTiket": "base64_image_string",
    "namaHotel": "Hotel Santika",
    "hargaHotel": 800000,
    "imgBill": "base64_image_string"
  }'
```

### Approve SPPD (Admin)
```bash
curl -X PATCH http://localhost:3000/sppd/1/status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```
