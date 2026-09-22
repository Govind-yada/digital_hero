# Digital Heroes

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Govind-yada/digital_hero)

Digital Heroes is a web platform for golf score tracking, charity, subscriptions, and monthly prize draws.

Tech Stack
Frontend: React, Vite, Tailwind CSS, React Router
Backend: Node.js, Express.js
Database: PostgreSQL / Supabase
Auth: JWT + bcrypt
Payments: Stripe
Storage: Supabase Storage
Main Features
Monthly and yearly subscriptions
Stableford score tracking with latest 5 scores
Monthly random/algorithmic prize draws
Prize pool and jackpot rollover
Charity directory and donations
Winner proof upload and admin verification
User and Admin dashboards
Run Locally
cd server
npm install
npm run dev
cd client
npm install
npm run dev

Backend: http://localhost:5000
Frontend: http://localhost:5173

Test Accounts
Admin:
admin@digitalheroes.co.in
AdminPass123!

Subscriber:
subscriber@digitalheroes.co.in
SubPass123!
Tests
cd server
npm test