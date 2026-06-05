# Afterparty Digital 🌌

> Immersive Diagonal Cavern Descent & Gamified Hackathon Networking

**Afterparty Digital** (`afterparty.digital`) is a highly polished, gamified event networking and project-launch landing page. Designed specifically for hackathon after-hours, it guides developers down a diagonal cavern shaft along a railroad track through matchmaking mine shafts, real-time campfire chat rooms, clicker mini-games, team formation registries, and idea prompt slot machines.

---

## 🚀 Live Demo & Presentation
* **Live Deployment**: Deployable to Vercel.
* **Submission Demo Video**: Located at `afterparty_digital_demo.mp4` (1080p upscaled walkthrough featuring Microsoft Ava Neural voiceover narration).

---

## 🎨 Key Features & Realms

1. **Launch Room (Realm 1)**: Ignites new event cavern shafts with capacity tracking and check-in QR codes.
2. **Amethyst Networking Mine (Realm 2)**: Gallery showing developer profiles with search and role filters (AI, Devs, Design).
3. **Crystal Campfire (Realm 3)**: Immersive CSS campfire, chat logs, and an **Amethyst Mining clicker game** containing a companion upgrades shop (steel pickaxes, helper geese) and hidden gemstones.
4. **Alliance Forge (Realm 4)**: Recruits teammates for active projects by stack and missing roles.
5. **Oracle of Ideas (Realm 5)**: Randomized tech/industry/goal slot-machine project generator.
6. **Sponsor Bounty Board (Realm 6)**: OpenAI, MongoDB, and Vercel API rewards and rules.

---

## 🛠️ Quick Start

### Running the Application Locally
Since the frontend is built on top of high-performance vanilla HTML5, CSS3, and Tailwind, it runs instantly in any browser. It is fully connected to our production **AWS Elastic Beanstalk Node.js backend** and **MongoDB Atlas** database via `socket.io` to provide real-time chat, live photo wall uploads, and team sync.

### Project Structure
* `index.html` — The main static frontend, containing SVG railroad paths, and Socket.io JavaScript handlers connecting to the AWS backend.
* `backend-mongo/` — The complete Node.js + Socket.io backend that interacts with MongoDB Atlas.
* `crystal_goose.png` — Asset image for the sloped minecart glider.
* `deploy_eb.py` — Automation script for bundling and pushing backend releases to AWS Elastic Beanstalk.
* `generate_demo.py` — Automated demo video creator script.
* `devpost.md` — Submission summary for Devpost.

---

## 📹 Generating the Demo Presentation Video

We've packaged a custom Python pipeline to record a high-definition walk-through of the website, synchronize it with a neural text-to-speech voiceover, and compile the final output.

### Prerequisites
Make sure you have Playwright, `edge-tts`, and `ffmpeg` installed:
```bash
pip install playwright edge-tts
playwright install chromium
```

### Run the Generator
Run the script from your terminal:
```bash
python generate_demo.py
```
This automatically:
1. Synthesizes a narration script using the **Microsoft Ava Neural voice** (`narration.mp3`).
2. Opens Chromium at `1280x720` and records the scrolling and clicking actions (injecting a custom virtual cursor).
3. Merges the clips and upscales them back to a crisp `1920x1080` H.264 file (`afterparty_digital_demo.mp4`).

---

## 📦 Deployment (Vercel)
The project is configured for direct static deployment to Vercel.

To deploy, make sure you have Vercel CLI installed, and run:
```bash
vercel --yes
```
*(The `.vercelignore` file prevents the heavy WebM/MP4 videos from uploading to Vercel, keeping the build size lightweight).*
