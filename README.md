# Afterparty Digital 🌌

> Immersive Stepped Cavern Descent & Gamified Hackathon Networking
> Built for the **Name.com Domain Roulette Challenge** (Domain: `afterparty.digital`)

**Afterparty Digital** ([afterparty.digital](https://afterparty-digital.vercel.app)) is a production-ready, gamified event networking and project-launch platform designed to breathe life into hackathon afterparties. Rather than staring at dry list directories or generic event maps, developers descend step-by-step through a deep amethyst cavern shaft. 

Hackers explore candidate galleries, engage at a real-time campfire chat board, mine crystals in a clicker mini-game, coordinate Stack requirements in the Alliance Forge, spin random idea prompts, and browse sponsor bounties in an immersive, math-driven visual experience.

---

## 🎭 Key Features & Realms

1. **Launch Room (Realm 1)**: Deploy custom event caverns with capacity limits, synced instantly to active status dashboards and printable check-in QR codes.
2. **Amethyst Networking Mine (Realm 2)**: A developer gallery displaying live profiles. Hackers can select their specific developer roles (AI Engineer, Full Stack Dev, UX Designer, etc.) during check-in, search profiles, and trigger instant matches.
3. **Crystal Campfire & Upgrades Shop (Realm 3)**: A social arena containing:
   * A flickering CSS campfire (with a stable nested hidden amethyst crystal easter egg).
   * A real-time chat feed.
   * An **Amethyst Mining clicker game** linked to a **Secure Upgrades Shop**. Click currency is validated server-side to prevent console click hacks, allowing users to buy Steel Pickaxes or hire Goose Miners.
   * A **Live Photo Wall** feed with a vertically contained scroll layout so that live uploads never break the viewport height.
4. **Alliance Forge (Realm 4)**: Coordinate project teams. Teams publish stack details and vacancies, and solo developers send instant inquiries.
5. **Oracle of Ideas (Realm 5)**: A 3-dial slot machine that spins tech stacks, industry categories, and goals to generate prompt ideas with dynamic feasibility scores.
6. **Sponsor Bounty Board (Realm 6)**: A showcase of developer challenges (OpenAI, MongoDB, Vercel) alongside API rules and awards.

---

## 🛠️ Architecture & Stack

The system is built as a highly optimized production app to provide zero-latency updates and reliable persistence:

* **Frontend**: Highly polished, responsive Vanilla HTML5 & CSS3 with Tailwind. Employs a custom ES6 modular structure ([js/](file:///c:/Users/Administrator/.gemini/antigravity-ide/scratch/afterparty-digital-latest/js)) separating state, rendering, socket listeners, and gameplay.
* **Backend**: Node.js, Express, and Socket.io deployed on **AWS Elastic Beanstalk** behind a secure HTTPS CloudFront proxy.
* **Database**: MongoDB Atlas persisting all cavern instances, active users, chat history, teams, and liked moment uploads.
* **Stepped Scroll Physics**: Converts standard mouse scroll events into segmented translations—sliding vertically down (`10vh`) to inspect the current realm fully, before sliding diagonally to the next.
* **Viewport-Fixed Glider**: A custom-positioned minecart progress overlay (`crystal_goose.png`) that glides horizontally across the screen as you descend.

---

## 📦 Running Locally

### Prerequisites
* Node.js v18+
* MongoDB Atlas connection string (already configured in our EB environment settings)

### 1. Launch the Backend Server
Navigate to the backend directory, install dependencies, and run:
```bash
cd backend-mongo
npm install
npm start
```
This spins up the backend server locally at `http://localhost:3000`.

### 2. Launch the Frontend
Serve the root directory using any local web server. For example:
```bash
python -m http.server 5500
```
Open `http://localhost:5500` in your browser. The frontend automatically detects localhost and establishes a websocket connection.

---

## 🚀 Deployment

* **Frontend**: Directly deployable to Vercel. Pushing to the `main` branch automatically triggers Vercel static build deploys based on the [vercel.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/scratch/afterparty-digital-latest/vercel.json) config.
* **Backend**: Deployed to AWS Elastic Beanstalk. The [deploy_eb.py](file:///c:/Users/Administrator/.gemini/antigravity-ide/scratch/afterparty-digital-latest/deploy_eb.py) Python utility automatically packages, uploads, and deploys updates to the environment using the AWS CLI.
