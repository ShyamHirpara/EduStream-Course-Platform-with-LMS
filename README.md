<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" alt="Django" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
</p>

<h1 align="center">🎓 EduStream </h1>
<h4 align="center">A Comprehensive Learning Management System (LMS) Platform</h4>

<p align="center">
  EduStream is a modern, responsive, full-stack Learning Management System designed to bridge the gap between instructors and students. It allows instructors to create rich, media-driven courses with interactive assessments, while students benefit from structured learning paths, progress tracking, and secure video playback.
</p>

---

## ✨ Key Features

### 🛡️ Core System
* **Role-Based Accounts:** Secure registration and login flows separated into `Student` and `Instructor` roles.
* **JWT Authentication:** Stateful user sessions using secure JSON Web Tokens with automatic refresh mechanisms.
* **Theme Support:** Fully responsive light and dark mode UI toggles natively built into the frontend.

### 📚 For Students
* **Course Catalog:** Browse available courses, view ratings, and seamlessly enroll.
* **Immersive Lesson Player:** A dedicated two-panel learning view featuring interactive sidebar navigation and responsive content areas.
* **Assessment-Gated Learning:** Lessons containing quizzes require a passing score of **≥ 60%** before the student can mark them as completed and proceed.
* **Progress Tracking:** Interactive dashboards showcasing course completion percentages, directing students exactly where they left off.
* **Peer Reviews:** Leave star ratings and text reviews upon 100% course completion.

### 👨‍🏫 For Instructors
* **Course Creation Builder:** A powerful interface to draft courses, upload thumbnails, and add sequenced text & video lessons.
* **Assessment Editor:** Attach multiple-choice quizzes (with graded success criteria) directly to individual lessons.
* **Analytics Dashboard:** Monitor course performance, track active student enrollments, and view aggregated course ratings at a glance.
* **Content Protection:** Custom video player implementations preventing casual right-click menu and video file downloads to protect intellectual property.

---

## 🛠️ Technology Stack

**Frontend Architecture (SPA)**
* **Framework:** React.js (via Vite)
* **Routing:** React Router v6
* **HTTP Client:** Axios (with custom interceptors for JWT)
* **Styling:** Vanilla CSS 3 with dynamic custom properties, flexbox, and CSS Grids
* **Icons:** Lucide React

**Backend API Structure**
* **Framework:** Django 5.0 + Django REST Framework 3.15
* **Authentication:** `djangorestframework-simplejwt`
* **Media & CDN Layer:** Cloudinary SDK (`django-cloudinary-storage`)
* **Security Middleware:** Django CORS Headers & built-in CSRF/Clickjacking protections

**Database**
* **RDBMS:** PostgreSQL (via `psycopg2`)

---

## 🚀 Local Installation & Setup

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & `npm`
* **PostgreSQL** running locally
* A **Cloudinary** account (for video and thumbnail uploads)

### 1. Clone the repository
```bash
git clone https://github.com/ShyamHirpara/EduStream-Course-Platform-with-LMS.git
cd EduStream-Course-Platform-with-LMS
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/Scripts/activate  # (On Windows) or `source .venv/bin/activate` (Mac/Linux)

# Install dependencies
pip install -r requirements.txt

# Create an environment variables file
touch .env
```

**Inside `backend/.env`, paste your configurations:**
```env
DEBUG=True
SECRET_KEY=your_django_secret_key_here
DB_NAME=edustream_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Run Migrations & Start Server:**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```
*(The API will be available at `http://localhost:8000`)*

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start the Vite development server
npm run dev
```
*(The Frontend application will be available at `http://localhost:5173`)*

---

## 📁 System Architecture Overview

* **Users App:** Handles `CustomUser` models overriding AbstractUser to bind distinct Instructor and Student roles seamlessly.
* **Courses App:** Controls the primary schemas (`Course`, `Lesson`, `Enrollment`, `LessonProgress`), ensuring 3NF validation alongside referential integrity mechanisms.
* **Assessments Layer:** Defines One-to-One relationships with Lessons holding sequential `Questions` mapped to Boolean `Choices`.
* **API Endpoints:** Separated into Class-Based Views (ViewSets) bounded by deeply granular Authorization policies (`IsCourseOwner`, `IsInstructorOrReadOnly`).

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information. Built as a Mini Project for Computer Science & Engineering.
