# Afterparty Digital - Devpost Submission

## 🌌 Elevator Pitch
A gamified stepped cavern networking descent designed for hackathon after-hours. From the surface event launch room, hackers descend along a diagonal railroad track through interactive matchmaking quarries, a crystal campfire mining game, team formation forge, and randomized project idea generators down to the sponsor API bounty boards.

---

## 💡 Inspiration
Hackathons are incredible engines for building, but the networking and team-formation phases can often feel awkward or static. Traditional event listing sites are dry bullet points, and virtual gather spaces often lack direct utility. 

We wanted to build something that feels **alive, responsive, and visual**—an immersive diagonal journey inspired by premium event page aesthetics (like Hack the North). By combining practical utility tools (team registries, candidate lists, project prompt slot machines) with gaming loops (amethyst mining clicker shops, easter eggs), we keep hackers engaged, communicating, and inspired long after the main hacking hours begin.

---

## 🛠️ What it Does
Afterparty Digital takes participants on a sloped diagonal descent through 6 custom-themed Realms:

1. **Realm 1: Launch Room**: The entry point where event organizers deploy custom event caverns with capacity limits, synced instantly to active status dashboards and printable check-in QR codes.
2. **Realm 2: Amethyst Networking Mine**: A developer gallery where users can search profiles or filter by skillsets (AI, Frontends, Backends, Designers) to spark immediate matchmaking connections.
3. **Realm 3: Crystal Campfire & Mini-Game**: A social arena containing:
   * A flickering CSS campfire and live chat feed.
   * An **Amethyst Gemstone mining clicker game** where clicking the crystal awards gems.
   * An **Upgrades Shop** where players purchase steel pickaxes (increasing click yield) or hire helper geese (generating passive gems per second) using mined gems.
   * Floating purple confetti and hidden crystals (easter eggs) scattered across the caverns.
4. **Realm 4: The Alliance Forge**: A team recruitment listing board. Teams publish project concepts and technical needs, and solo developers send instant inquiries to join.
5. **Realm 5: Oracle of Ideas**: A randomized project generator styled as a slot machine. Spin three dials (Tech, Industry, Product Focus) to generate randomized project briefs alongside feasibility ratings.
6. **Realm 6: Sponsor Bounty Board**: A repository of sponsor bounties (OpenAI, MongoDB, Vercel) showing requirements, APIs, and cash incentives.

---

## 💻 How We Built It
* **Frontend**: HTML5, CSS3 Glassmorphism, Tailwind CDN for layout utilities.
* **Backend**: Node.js, Express, and Socket.io deployed on AWS Elastic Beanstalk behind a secure HTTPS CloudFront CDN proxy.
* **Database**: Real-time integration with MongoDB Atlas to persist all caverns, teams, users, and photo wall uploads.
* **Fonts & Icons**: Space Grotesk & Outfit typography (Google Fonts) with Font Awesome indicators.
* **Math-derived SVG Track**: Built a custom dynamic sleepers generator that renders wooden ties mathematically perpendicular to the rail slope on load.
* **Continuous Diagonal Translation**: Mapped mouse vertical scroll percentages to horizontal (`-500vw`) and vertical (`-300vh`) CSS transforms on the main container, aligning a floating minecart goose to lock onto the sloped rails.
* **Automated Walkthrough & Video Renderer (`generate_demo.py`)**: Built a Python script that launches Playwright to record a 720p visual walkthrough (injecting a custom glowing virtual cursor and keyboard typing simulation), calls the Microsoft Ava Neural TTS engine (`edge-tts`) to generate high-quality voiceover, and uses FFmpeg to compile and scale the final `1920x1080` presentation video.

---

## 🚧 Challenges We Ran Into
* **Scroll-Pan Viewport Alignment**: Mapping translations linearly so that each stepped diagonal chamber centers exactly inside the user's viewport on the vertical scroll axis required careful geometry and relative math.
* **Visual Non-Interference**: We wanted the guide rails and minecart to be decorative without blocking interactions. We designed them as ultra-transparent holographic HUD overlays, set their z-index behind content cards, and configured `pointer-events: none` to keep elements click-through.
* **Headless Screen Recording**: Capturing the exact browser visual performance programmatically on a headless system required setting Playwright viewport dimensions and upscaling the outputs using FFmpeg bicubic scaling.

---

## 🎉 Accomplishments That We're Proud Of
* We created a fully client-side static landing page that feels like a premium WebGL experience without any heavy frameworks (React/Next) or build step dependencies.
* Built a complete, automated presentation generator that produces a 1:40 widescreen submission video with natural-sounding neural voiceovers in under a minute!

---

## 🧠 What We Learned
* How to use CSS panned transforms effectively to route vertical mouse-wheel events into multi-axis diagonal scroll transitions.
* Integrating custom mouse cursor listeners within automated browser testing frameworks to create smooth screencast pointers.

---

## 🚀 What's Next for Afterparty Digital
* **Live WebSockets Backend**: Backing the campfire chat board and developer match sparkings with a live Node/Socket.io backend.
* **Real Database Persistence**: Storing registered teams and custom caverns in a database (like MongoDB Atlas) so updates persist across check-ins.
