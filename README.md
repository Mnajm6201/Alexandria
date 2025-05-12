# Alexandria
## The Library of Today!
Alexandria s a community-focused application designed to help users find, review, discuss, and track books. Inspired by the legendary Library of Alexandria, our mission is to create a modern digital space that encourages knowledge sharing and brings communities together through literature.

# Table of Contents
- [Overview](#overview)
- [What is Alexandria?](#what-is-alexandria)
- [About 4900](#about-4900)
- [Inspiration](#inspiration)
- [Features](#features)
- [Screenshots](#screenshots)
- [Development Process](#development-process)
- [Directory Structure](#directory-structure)
- [Installation Steps](#installation-steps)
- [Progress](#progress)
- [Future Plans](#future-plans)
- [License](#license)

# Overview
Alexandria is an open-source platform that allows users to:
- Discover new books
- Write and read reviews
- Engage in discussions
- Track reading progress

Our goal is to build a vibrant community where book enthusiasts can connect and share their love for reading.

# What is Alexandria?
Alexandria is a monolithic full-stack application with the following architecture:
- **Frontend**: Developed with **Next.js** and **React**, supporting SSR (server-side rendering) and client-side interactivity
- **Backend**: Built using **Django (Python)** and **TypeScript**-based services for future extensions
- **Database**: Powered by **PostgreSQL** for relational data management
- **Authentication**: Clerk.dev integration for modern user auth and role management

# About 4900
**CISC 4900**, Independent and Group Projects, tasked us with creating a large-scale project which would test the skills we’ve honed during our tenure at Brooklyn College. We were also encouraged to select projects that address a real-world need or challenge, aiming to make a meaningful contribution to the community or industry. The three of us have been working together on projects for a year now, and we take all of our classes together.  Collaborating on CISC 4900 was a natural extension of our ongoing teamwork, providing us with an opportunity to tackle a complex, impactful project that draws on our collective knowledge and experience. Under the leadership of our project supervisor, Professor Priyanka Samanta, and Advisors Allen Lapid and Kathrine Chaung, we set out to build a project that not only showcased our technical capabilities but also addressed a meaningful gap in how readers discover and organize books online. Our goal was to design a platform that reimagines digital book discovery, one that balances user-friendly design with powerful backend architecture, grounded in real user needs and scalable engineering.

# Inspiration
The name and purpose of Alexandria draw inspiration from the **ancient Library of Alexandria**, a historical symbol of collective human knowledge and culture exchange. We aim to create a digital counterpart where readers come together, not just to consume books, but to engage with others and build community.

# Features
- **Book Discovery** - Search through over 28 million books provided by the Open Library API. Browse our Discover page to find curated shelves and personalized recommendations
- **Review System** - Read and write book reviews to share opinions and see what others in the community are saying
- **Book Clubs** - Join or create private/public book clubs to share reads, host discussions, and connect with readers with similar interests
- **Reading Tracker** - Track your current reads, finished books, and total time spent reading
- **User Profiles** - Edit your profile, upload avatars, and showcase your reading stats
- **Secure Authentication** - Powered by Clerk.dev, with support for JWT tokens and role-based access controls
- **Responsive UI** - A sleek and modern interface built with Next.js and TailwindCSS that works across desktop and mobile devices

# Screenshots
![Homepage](https://raw.githubusercontent.com/Mnajm6201/Alexandria/main/public/screenshots/welcomepage_1.png)

![Homepage](https://raw.githubusercontent.com/Mnajm6201/Alexandria/main/public/screenshots/welcomepage_2.png)

![Homepage](https://raw.githubusercontent.com/Mnajm6201/Alexandria/main/public/screenshots/welcomepage_3.png)

![Homepage](https://raw.githubusercontent.com/Mnajm6201/Alexandria/main/public/screenshots/welcomepage_4.png)


# Development Process
Our development follwed modern engineering practices modeled after industry standards:
- **TDD (Test-Driven Development)** - We wrote unit tests before implementing features to ensure each component met functional requirements from the outset.
- **SCRUM** - We used SCRUM methodology with defined sprint cycles, sprint planning, retrospectives, and daily check-ins
- **White Box Testing** - We validated the internal logic and structure of functions and services via unit and integration testing
- **Black Box Testing** - We ensured frontend features, APIs, and user flows matched functional specifications 
- **JIRA Board** - We organized our project using a SCRUM-style JIRA board with sprint backlogs, task breakdowns, and story point estimation

# Directory Structure
```bash
alexandria/
├── backend/                         # Django REST API backend
│   ├── accounts/                    # User account models, auth, serializers
│   ├── api/                         # Shared backend API interfaces
│   ├── bookclubs/                   # Book club models, views, endpoints
│   ├── config/                      # Django settings and configurations
│   ├── discovery/                   # Logic for homepage discoverable content
│   ├── entity_pages/                # General-purpose entity rendering (e.g. authors, editions)
│   ├── journals/                    # User journals and entries
│   ├── library/                     # Core data models and relationships
│   ├── logs/                        # Application and audit logs
│   ├── media/                       # Media uploads (e.g., user avatars)
│   ├── reviews/                     # Book review models and logic
│   ├── search/                      # Search endpoints and result ranking
│   ├── shelves/                     # User and featured shelves
│   ├── staticfiles/                 # Static asset configuration
│   ├── userbooks/                   # User-book relationships (reading status, progress)
│   ├── .env.local                   # Environment variables for local dev
│   ├── config.py                    # WSGI/ASGI configuration
│   └── requirements.txt             # Python dependencies

├── frontend/                        # Next.js 14 frontend
│   ├── public/                      # Static files (images, icons, screenshots)
│   │   └── screenshots/             # App screenshots for README
│   ├── src/
│   │   ├── app/                     # Route-level Next.js pages (App Router)
│   │   │   ├── book/                # Book detail routes
│   │   │   ├── club/                # Book club routes
│   │   │   ├── community/           # Community-facing features
│   │   │   ├── discovery/           # Homepage discovery content
│   │   │   ├── edition/             # Edition detail pages
│   │   │   ├── profile/             # User profile and stats
│   │   │   ├── search/              # Search results and filters
│   │   │   ├── shelf/               # Individual shelf routes
│   │   │   └── shelves/             # All shelves listing and browsing
│   │   ├── components/              # Reusable UI components
│   │   │   ├── auth/                # Clerk integration
│   │   │   ├── club/                # Club cards, join buttons, etc.
│   │   │   ├── layout/              # Shared layout wrappers
│   │   │   ├── profiles/            # User profile modules
│   │   │   └── ui/                  # Button, form, modal, and utility components
│   │   └── globals.css              # Global styles
│   ├── .next/                       # Build artifacts (ignored)
│   └── package.json                 # Frontend dependencies and scripts

├── docs/                            # Documentation and Markdown files
├── scripts/                         # Optional utility and setup scripts
├── .gitignore
└── README.md
```

# Installation Steps
### Prerequisites
- Node.js
- Python 3.11+
- PostgreSQL 14+
- Clerk.deve API Key

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### .env.example for frontend and backend
```bash
frontend:
# Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= Your publishable key
CLERK_SECRET_KEY= Your Clerk secret key


# Current progress
NODE_ENV= Your testing progress (development or production)


backend:
# Database credentials.
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_HOST=
POSTGRES_PORT=

# Key for django app.
SECRET_KEY=

# Allowed hosts for django app.
ALLOWED_HOSTS=127.0.0.1,localhost

# Debuging flag for app
DEBUG=
# Origins allowed to make API requests of app.
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Email credentials of django admin
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=


# Clerk API key
CLERK_SECRET_KEY= Your clerk secret key
```

### Don't forget to setup the .env.local files for both frontend and backend based on .env.example


# Progress

So far, we've accomplished:
- Full JWT-based auth with Clerk integration
-

# Future Plans
- Mobile-first PWA or native app version
- ML-based book recommendation engine using collaborative filtering
- Admin dashboard with club/user analytics
- Internationalization and localization support
- Docker-based deployment and CI/CD setup