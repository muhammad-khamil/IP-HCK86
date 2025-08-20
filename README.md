# Aplikasi SPPD (Surat Perintah Perjalanan Dinas)

Aplikasi untuk mengelola rekap SPPD dengan 2 role: Staff dan Admin.

## Features

### Staff
- ✅ Membuat SPPD baru
- ✅ Melihat SPPD yang dibuat sendiri
- ✅ Edit/hapus SPPD milik sendiri (hanya jika status masih "pending")

### Admin
- ✅ Melihat semua SPPD dari semua staff
- ✅ Approve/Reject SPPD (mengubah status)
- ✅ Dashboard statistik
- ✅ Mengelola semua SPPD

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcrypt

## Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd IP-HCK86
```

2. **Install dependencies**
```bash
cd server
npm install
```

3. **Setup Database**
- Pastikan PostgreSQL sudah terinstall dan berjalan
- Buat database dengan nama sesuai config

4. **Setup Environment**
```bash
# Copy .env.example ke .env dan sesuaikan konfigurasi
cp .env.example .env
```

Isi file `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sppd_database
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_jwt_secret
```

5. **Run Migrations & Seeders**
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

6. **Start Server**
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## Test Accounts

Setelah menjalankan seeder, Anda dapat menggunakan akun berikut:

### Admin
- Email: `admin@gmail.com`
- Password: `12345`

### Staff
- Email: `kemil@gmail.com`
- Password: `12345`

## API Documentation

Lihat dokumentasi lengkap API di file [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Database Schema

### User
- id (Primary Key)
- name
- email (Unique)
- password (Hashed)
- role (ENUM: 'staff', 'admin')

### SPPD
- id (Primary Key)
- daerah_tujuan
- maksud_perjalanan
- instansi_dituju
- tanggalBerangkat
- tanggalPulang
- jenisTransportasi
- hargaTiket
- imgTiket (base64)
- namaHotel
- hargaHotel
- imgBill (base64)
- status (ENUM: 'pending', 'approved', 'rejected')
- userId (Foreign Key to User)

## API Endpoints Summary

### Public
- `POST /register` - Registrasi user baru
- `POST /login` - Login user

### Authenticated (Staff & Admin)
- `GET /profile` - Get user profile
- `POST /sppd` - Create SPPD (Staff only)
- `GET /sppd` - Get SPPD list (filtered by role)
- `GET /sppd/:id` - Get SPPD detail
- `PUT /sppd/:id` - Update SPPD
- `DELETE /sppd/:id` - Delete SPPD

### Admin Only
- `PATCH /sppd/:id/status` - Update SPPD status
- `GET /dashboard/stats` - Dashboard statistics

## Testing

### Test dengan cURL

1. **Login Admin:**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"12345"}'
```

2. **Create SPPD (Staff):**
```bash
# Login dulu sebagai staff untuk dapat token
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kemil@gmail.com","password":"12345"}'

# Gunakan token untuk create SPPD
curl -X POST http://localhost:3000/sppd \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daerah_tujuan": "Jakarta",
    "maksud_perjalanan": "Rapat koordinasi",
    "instansi_dituju": "Kantor Pusat",
    "tanggalBerangkat": "2024-01-15",
    "tanggalPulang": "2024-01-17",
    "jenisTransportasi": "Pesawat",
    "hargaTiket": 1500000,
    "imgTiket": "base64_string_here",
    "namaHotel": "Hotel Santika", 
    "hargaHotel": 800000,
    "imgBill": "base64_string_here"
  }'
```

3. **Approve SPPD (Admin):**
```bash
curl -X PATCH http://localhost:3000/sppd/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

## Project Structure

```
server/
├── app.js              # Main Express application
├── bin/www             # Server startup
├── config/
│   └── config.json     # Database configuration
├── controllers/
│   └── Controller.js   # Main controller
├── helpers/
│   ├── bcrypt.js       # Password hashing
│   └── jwt.js          # JWT token handling
├── middleware/
│   ├── authentication.js  # JWT authentication
│   ├── authorization.js   # Role-based authorization
│   └── errorHandler.js    # Global error handler
├── migrations/         # Database migrations
├── models/            # Sequelize models
│   ├── user.js
│   └── sppd.js
├── seeders/          # Database seeders
└── package.json
```

## Development

Untuk development dengan auto-reload:

```bash
npm install -g nodemon
npm run dev
```

## License

ISC License