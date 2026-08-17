# Stock Audit App

A modern, mobile-friendly stock auditing system for companies, built with Node.js, Express, EJS, MongoDB, and Bootstrap.

**Live Site:** [https://stockauditapp.onrender.com/](https://stockauditapp.onrender.com/)

## About

This is a stock auditing system built as a freelance engagement for a trading company based in Bahrain (May–June 2025). It gives auditors a structured, mobile-friendly way to walk through a company's inventory against a weighted checklist, attach evidence, and generate a scored report on the spot. The app handles inventory/company management, categorized audit questions with per-question weighting, and PDF audit reporting.

## Features

- Company management (create, edit, delete companies) with a dashboard listing all companies
- Categorized audit questions (Yes/No/N/A) with configurable, per-question weightage/scoring
- Admin panel for managing categories and questions, including drag-to-reorder
- Per-question comments and image upload (gallery or camera), backed by Cloudinary
- Editable info panel (company, location, date, branch, manager, inspector)
- Dynamic per-category and total scoring with a live summary panel
- AJAX-based answer saving/retrieval, so progress is autosaved as you go
- PDF export of the full audit report (via PDFKit/pdfmake)
- User authentication with role-based access (admin vs. regular user), including an admin "add user" flow

## Tech Stack
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose (Company, Category, Question, Answer, Info, User models)
- **Views:** EJS templates
- **Frontend:** Bootstrap 5, vanilla JS (AJAX)
- **File uploads:** Multer + Cloudinary (`multer-storage-cloudinary`) for image hosting
- **Image processing:** Sharp
- **PDF generation:** PDFKit and pdfmake
- **Auth/session:** express-session, bcryptjs
- **Config:** dotenv for environment variables

## Getting Started

1. **Clone the repo:**
   ```sh
   git clone https://github.com/nasihrahman/stockauditapp.git
   cd stockauditapp
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your MongoDB URI and (optionally) Cloudinary credentials.
4. **Run the app locally:**
   ```sh
   npm start
   ```
5. **Visit:**
   - [http://localhost:3000](http://localhost:3000) (local)
   - [https://stockauditapp.onrender.com/](https://stockauditapp.onrender.com/) (production)

## Folder Structure
- `app.js` - Main Express app
- `cloudinary.js` - Cloudinary + Multer storage configuration for image uploads
- `routes/` - API and page routes (auth, audit, admin, api, PDF generation)
- `models/` - Mongoose models (Company, Info, Category, Question, Answer, User)
- `views/` - EJS templates (audit form, admin panel, dashboard, login, user/category/question editors)
- `public/` - Static files (CSS, JS, images)
- `indstyle.css` - Styling for the main audit page


---

For questions or contributions, open an issue or pull request on GitHub.
