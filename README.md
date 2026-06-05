# 🖥️ EduPredict Math — Backend Server

> RESTful API backend untuk platform pembelajaran Matematika adaptif berbasis prediksi AI, dibangun dengan Express.js + MongoDB.

## 📖 Deskripsi

**EduPredict Math Server** adalah backend API yang mendukung platform EduPredict Math. Server ini menangani autentikasi pengguna, manajemen quiz & pertanyaan, pelacakan progres siswa, integrasi AI untuk prediksi kemampuan siswa, manajemen kelas, notifikasi, leaderboard, achievement, serta penyimpanan file melalui Supabase Storage.

## 🚀 Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| [Express.js](https://expressjs.com/) | ^5.2.1 | Web framework |
| [MongoDB](https://www.mongodb.com/) | — | Database NoSQL |
| [Mongoose](https://mongoosejs.com/) | ^9.6.3 | MongoDB ODM |
| [Supabase](https://supabase.com/) | ^2.107.0 | Storage file (avatar, lampiran) |
| [JSON Web Token](https://github.com/auth0/node-jsonwebtoken) | ^9.0.3 | Autentikasi JWT |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | ^3.0.3 | Hashing password |
| [Nodemailer](https://nodemailer.com/) | ^8.0.10 | Pengiriman email (reset password) |
| [Multer](https://github.com/expressjs/multer) | ^2.1.1 | Upload file middleware |
| [Axios](https://axios-http.com/) | ^1.16.1 | HTTP client (integrasi AI API) |
| [dotenv](https://github.com/motdotla/dotenv) | ^17.4.2 | Manajemen environment variables |
| [cors](https://github.com/expressjs/cors) | ^2.8.6 | CORS middleware |
| [Nodemon](https://nodemon.io/) | ^3.1.14 | Hot-reload saat development |

## 📁 Struktur Folder

```
server/
├── src/
│   ├── config/
│   │   ├── db.js              # Koneksi MongoDB (Mongoose)
│   │   └── supabase.js        # Konfigurasi Supabase client
│   ├── controllers/
│   │   ├── achievementController.js   # Logic achievement/badge
│   │   ├── aiController.js            # Integrasi AI prediction
│   │   ├── authController.js          # Register, login, reset password
│   │   ├── classController.js         # CRUD kelas
│   │   ├── leaderboardController.js   # Leaderboard siswa
│   │   ├── notificationController.js  # Manajemen notifikasi
│   │   ├── questionController.js      # Manajemen bank soal
│   │   ├── quizController.js          # Sesi quiz & penilaian
│   │   ├── studentController.js       # Data & progres siswa
│   │   ├── teacherController.js       # Data & dashboard guru
│   │   └── uploadController.js        # Upload file ke Supabase
│   ├── data/                  # Data statis / seed data soal
│   ├── middlewares/
│   │   ├── authMiddleware.js  # Verifikasi JWT & role-based access
│   │   └── uploadMiddleware.js # Konfigurasi Multer
│   ├── models/
│   │   ├── Attempt.js         # Model percobaan jawaban siswa
│   │   ├── Class.js           # Model kelas
│   │   ├── Notification.js    # Model notifikasi
│   │   ├── Prediction.js      # Model hasil prediksi AI
│   │   ├── Question.js        # Model soal/pertanyaan
│   │   ├── QuizSession.js     # Model sesi quiz
│   │   └── User.js            # Model user (siswa & guru)
│   ├── routes/
│   │   ├── achievementRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── authRoutes.js
│   │   ├── classRoutes.js
│   │   ├── leaderboardRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── teacherRoutes.js
│   │   └── uploadRoutes.js
│   ├── scripts/
│   │   └── importQuestions.js # Script import soal ke database
│   ├── seeds/
│   │   └── users.js           # Seed data pengguna awal
│   ├── services/
│   │   └── aiService.js       # Client untuk AI prediction API
│   ├── utils/                 # Fungsi utilitas
│   ├── app.js                 # Konfigurasi Express app & routes
│   └── server.js              # Entry point — start server & koneksi DB
├── .env                       # Environment variables (jangan di-commit!)
├── .gitignore
└── package.json
```

## ⚙️ Prasyarat

- **Node.js** >= 18.x
- **npm** >= 9.x (atau pnpm/yarn)
- **MongoDB** — instance lokal atau [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Supabase** — project untuk storage file (opsional jika tidak menggunakan upload)

## 🛠️ Instalasi & Menjalankan

1. **Clone repository** dan masuk ke folder server:

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Buat file `.env`** di root folder `server/` dengan variabel berikut:

   ```env
   # Server
   PORT=5000

   # MongoDB
   MONGO_URI=mongodb://localhost:27017/edupredict-math

   # JWT
   JWT_SECRET=your_jwt_secret_key

   # Supabase (Storage)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Prediction API
   AI_API_URL=http://your-ai-api-endpoint/predict

   # Email (Nodemailer) — untuk fitur reset password
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Jalankan development server:**

   ```bash
   npm run dev
   ```

   Server akan berjalan di `http://localhost:5000` (default).

5. **(Opsional) Import soal ke database:**

   ```bash
   npm run import:questions
   ```

## 📜 Skrip yang Tersedia

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Menjalankan server dengan Nodemon (hot-reload) |
| `npm start` | Menjalankan server untuk production |
| `npm run import:questions` | Import bank soal dari file data ke MongoDB |

## 🔌 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/register` | Registrasi pengguna baru |
| `POST` | `/api/auth/login` | Login & mendapatkan JWT token |
| `POST` | `/api/auth/forgot-password` | Kirim email reset password |
| `POST` | `/api/auth/reset-password/:token` | Reset password via token |

### 📝 Quiz (`/api/quiz`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/quiz/start` | Mulai sesi quiz baru |
| `POST` | `/api/quiz/submit` | Submit jawaban quiz |
| `GET` | `/api/quiz/history` | Riwayat quiz siswa |

### ❓ Questions (`/api/questions`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/questions` | Ambil daftar soal |

### 🤖 AI Prediction (`/api/ai`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/ai/predict` | Prediksi kemampuan siswa |

### 👨‍🎓 Student (`/api/student`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/student/profile` | Data profil siswa |
| `GET` | `/api/student/progress` | Data progres belajar |
| `PUT` | `/api/student/profile` | Update profil siswa |

### 👨‍🏫 Teacher (`/api/teacher`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/teacher/dashboard` | Data dashboard guru |
| `GET` | `/api/teacher/students` | Daftar siswa |
| `GET` | `/api/teacher/students/:id` | Detail siswa tertentu |

### 🏫 Classes (`/api/classes`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/classes` | Daftar kelas |
| `POST` | `/api/classes` | Buat kelas baru |
| `GET` | `/api/classes/:id` | Detail kelas |
| `PUT` | `/api/classes/:id` | Update kelas |
| `DELETE` | `/api/classes/:id` | Hapus kelas |
| `POST` | `/api/classes/:id/join` | Siswa bergabung ke kelas |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/notifications` | Daftar notifikasi pengguna |
| `PUT` | `/api/notifications/:id/read` | Tandai notifikasi sudah dibaca |

### 🏆 Leaderboard (`/api/leaderboard`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/leaderboard` | Data leaderboard siswa |

### 🎖️ Achievements (`/api/achievements`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/achievements` | Daftar achievement pengguna |

### 📤 Upload (`/api/upload`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/upload/avatar` | Upload foto profil ke Supabase Storage |

## 🗄️ Database Models

### User
| Field | Type | Deskripsi |
|---|---|---|
| `name` | String | Nama pengguna |
| `email` | String | Email (unique) |
| `password` | String | Password (hashed bcrypt) |
| `role` | String | `student` atau `teacher` |
| `avatar` | String | URL foto profil |

### Question
| Field | Type | Deskripsi |
|---|---|---|
| `question` | String | Teks soal |
| `options` | Array | Pilihan jawaban |
| `correctAnswer` | String | Jawaban yang benar |
| `category` | String | Kategori/topik soal |
| `difficulty` | String | Tingkat kesulitan |

### QuizSession
| Field | Type | Deskripsi |
|---|---|---|
| `userId` | ObjectId | Referensi ke User |
| `questions` | Array | Soal-soal dalam sesi |
| `score` | Number | Skor akhir |
| `startedAt` | Date | Waktu mulai |
| `completedAt` | Date | Waktu selesai |

### Attempt
| Field | Type | Deskripsi |
|---|---|---|
| `userId` | ObjectId | Referensi ke User |
| `questionId` | ObjectId | Referensi ke Question |
| `selectedAnswer` | String | Jawaban yang dipilih |
| `isCorrect` | Boolean | Benar/salah |

### Class
| Field | Type | Deskripsi |
|---|---|---|
| `name` | String | Nama kelas |
| `teacherId` | ObjectId | Referensi ke User (guru) |
| `students` | Array | Daftar siswa di kelas |
| `code` | String | Kode join kelas |

### Prediction
| Field | Type | Deskripsi |
|---|---|---|
| `userId` | ObjectId | Referensi ke User |
| `prediction` | Object | Hasil prediksi AI |

### Notification
| Field | Type | Deskripsi |
|---|---|---|
| `userId` | ObjectId | Referensi ke User |
| `title` | String | Judul notifikasi |
| `message` | String | Isi pesan |
| `isRead` | Boolean | Status sudah dibaca |

## 🔑 Environment Variables

| Variable | Wajib | Deskripsi |
|---|---|---|
| `PORT` | ✅ | Port server (default: `5000`) |
| `MONGO_URI` | ✅ | Connection string MongoDB |
| `JWT_SECRET` | ✅ | Secret key untuk JWT token |
| `SUPABASE_URL` | ✅ | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key Supabase |
| `AI_API_URL` | ✅ | Endpoint AI prediction API |
| `EMAIL_HOST` | ⚠️ | SMTP host untuk email |
| `EMAIL_PORT` | ⚠️ | SMTP port |
| `EMAIL_USER` | ⚠️ | Email address pengirim |
| `EMAIL_PASS` | ⚠️ | App password email |

> ✅ = Wajib | ⚠️ = Wajib jika menggunakan fitur reset password

## 🏗️ Arsitektur

```
Client Request
     │
     ▼
[Express App]  ──────────────────────────────────────
     │              │              │              │
     ▼              ▼              ▼              ▼
 [Routes]      [Middleware]   [Static Files]  [CORS]
     │         (JWT Auth,
     │          Multer)
     ▼
[Controllers]  ◄── Business logic
     │
     ├──► [Models]     ◄── MongoDB via Mongoose
     ├──► [Services]   ◄── AI API integration
     └──► [Supabase]   ◄── File storage
```

## 📄 Lisensi

Proyek ini dibuat untuk keperluan **Coding Camp 2026**.
