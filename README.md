# Inventory Application

<div align="center">

A medieval music record inventory with full CRUD for releases and genres, built on Express, EJS and PostgreSQL.

Built with:

![NodeJS](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node-dot-js&logoColor=white) ![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![EJS](https://img.shields.io/badge/EJS-%23B4CA65.svg?style=for-the-badge&logo=ejs&logoColor=black)

[View Code](https://github.com/BatetDev/top-project-inventory-application)
[Live Demo](https://top-project-inventory-application-u2oi.onrender.com)

</div>

## 📖 About

An inventory application for a record shop specialising in medieval music. Users can browse releases by genre, and create, edit and delete both releases and genres.

The application emphasises server-side fundamentals:

- Express routing with separate route and controller files
- A PostgreSQL schema with a foreign key relationship and `ON DELETE RESTRICT`
- Parameterised SQL queries via `pg` and a connection pool
- Server-side validation and constraint-error handling
- EJS templating with server-rendered HTML
- A seed script that rebuilds the schema and populates it with sample data

Built as part of The Odin Project's NodeJS curriculum.

## 🌫️ Key Features

✅ Full CRUD for releases and genres  
✅ Browse all releases, or filter by browsing a single genre  
✅ Genre pages list every release in that genre  
✅ Genre deletion is blocked while releases still reference it  
✅ Duplicate genre names and invalid foreign keys surface as readable form errors  
✅ Server-side validation independent of browser `required` attributes  
✅ Cover art with a fallback placeholder for releases without one  
✅ Seeded with 5 genres and 35 releases

## 🛠 Built With

- [Node.js](https://nodejs.org/) as the runtime
- [Express](https://expressjs.com/) for routing and middleware
- [PostgreSQL](https://www.postgresql.org/) for persistence
- [pg](https://node-postgres.com/) as the PostgreSQL client
- [EJS](https://ejs.co/) for server-rendered views

## 🧪 Getting Started

Requires Node.js and a running local PostgreSQL instance.

```bash
# Clone the repository
git clone https://github.com/BatetDev/top-project-inventory-application.git

# Navigate to project directory
cd top-project-inventory-application

# Install dependencies
npm install

# Create your local database
createdb top_project_inventory_app

# Configure environment variables
cp .env.example .env
# then edit .env with your database name and connection details

# Create the tables and seed sample data
npm run seed

# Run development server (with file watching)
npm run dev
```

The app runs at `http://localhost:3000`.

## 📜 Credits

- Original project by: [The Odin Project](https://www.theodinproject.com/lessons/node-path-nodejs-inventory-application)
- Cover art: AI-generated placeholder images
