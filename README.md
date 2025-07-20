# Stock Audit App

A modern, mobile-friendly stock auditing system for companies, built with Node.js, Express, EJS, MongoDB, and Bootstrap.

**Live Site:** [https://stockauditapp.onrender.com/](https://stockauditapp.onrender.com/)

## Features

- Company management (create, edit, delete companies)
- Categorized audit questions (Yes/No/N/A)
- Per-question comments and image upload (gallery or camera)
- Admin panel for managing questions and categories
- Info panel with editable company/audit info
- Dynamic scoring and summary panel
- AJAX-based answer saving and retrieval
- Responsive, modern UI (Bootstrap + custom styles)
- PDF export of audit results
- User authentication and roles (admin, user)

## Tech Stack
- Node.js + Express
- MongoDB (Mongoose)
- EJS templates
- Bootstrap 5
- Multer (file uploads)
- Cloudinary (optional, for image hosting)

## Getting Started

1. **Clone the repo:**
   ```sh
   git clone https://github.com/yourusername/stockauditapp.git
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
- `routes/` - API and page routes
- `models/` - Mongoose models (Company, Info, Category, Question, Answer)
- `views/` - EJS templates
- `public/` - Static files (CSS, JS, images)

## License
MIT

---

For questions or contributions, open an issue or pull request on GitHub.
