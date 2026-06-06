# Afterparty Digital - Devpost Submission

## 🌌 Elevator Pitch
An immersive, stepped cavern networking descent designed specifically for hackathon afterparties. Hackers check in at the surface, pick their development roles, and descend step-by-step down a diagonal cavern shaft. Along the way, they explore hacker profiles, strike matchmaking connections, engage at a real-time campfire chat room, mine amethyst crystals in a clicker game, forge teams, and spin slot machines for random project prompts—fully backed by a production AWS Node.js + MongoDB database.

---

## 💡 Inspiration & The Challenge
For Name.com's **Domain Roulette** challenge, we selected **`afterparty.digital`**. 

Hackathons are incredible engines of innovation, but the networking and team-formation phases can often feel dry and awkward. Traditional attendee directories are boring spreadsheets, and virtual rooms often lack direct utility. 

We wanted to build something that does true justice to our chosen domain. We envisioned **Afterparty Digital** as the ultimate virtual afterparty—a visual, responsive, and highly polished "descent" down a mining shaft where hackers hang out after hours. By combining essential utilities (team formation, candidate filters, dynamic project generators) with gamified loops (crystal clickers, secure upgrade shops, and hidden easter egg gems), we keep developers engaged, talking, and matching long into the night.

---

## 🛠️ What it Does
Afterparty Digital takes hackers on a sloped diagonal journey through 6 custom-themed Realms:

1. **Realm 1: Launch Room**: The event gateway. Organizers deploy custom event caverns via a WebSocket form submission that instantly syncs to the active status dashboard and check-in QR codes, preventing page reloads.
2. **Realm 2: Amethyst Networking Mine**: A visual developer card gallery. Hackers check in and select their real roles (AI Engineer, ML Researcher, UX Designer, etc.). Users search or filter the active gallery to spot matching stack developers.
3. **Realm 3: Crystal Campfire & Mini-Game**: A social hub containing:
   * A flickering CSS campfire and real-time live chat board.
   * An **Amethyst gemstone mining clicker game**.
   * A **Secure Upgrades Shop** where players use mined crystals to upgrade their Steel Pickaxes or hire Goose Miners. Upgrades and costs are validated server-side to prevent console hacking.
   * A **Live Photo Wall** where users upload images. The wall container is restricted to a scrollable feed, preventing large uploads from breaking layout symmetry.
   * Floating purple particle sparks and hidden amethyst crystals (easter eggs) styled adjacent to logs.
4. **Realm 4: The Alliance Forge**: A real-time, database-backed team recruitment and alliance-building registry. Teams publish concepts and stack vacancies. Solo developers submit join inquiries that persist in MongoDB. Team creators review pending requests in real-time, approving or declining applicants to update team rosters and broadcast system-wide updates.
5. **Realm 5: Oracle of Ideas**: A production-grade 3-dial slot machine. Staggered physical reel animations (built using dynamic CSS translations and ease-out cubic-bezier curves) spin through technologies, industry sectors, and product goals. A custom-designed rule engine dynamically synthesizes a cohesive, professional-grade 3-sentence project prompt, calculates a realistic estimated feasibility percentage, and computes a complexity rating (from Low to Very High) color-coded by badge.
6. **Realm 6: Sponsor Bounty Board**: A showcase of API challenges (OpenAI, MongoDB, Vercel) alongside requirements and rewards.

---

## 💻 How We Built It
* **Frontend**: Highly polished, responsive Vanilla HTML5 and CSS3 (Glassmorphism UI) with Tailwind styling. Structured as clean ES6 modular JS modules (separating state, sockets, UI triggers, and clicker gameplay loops).
* **Backend**: Node.js, Express, and Socket.io deployed on **AWS Elastic Beanstalk** behind a secure HTTPS CloudFront proxy.
* **Database**: MongoDB Atlas database integration. Every check-in, team, chat post, upgrades state, and photo moment upload is persisted in real time.
* **Stepped Scroll Transforms**: Mapped standard scrollwheel events to segmented translations—translating vertically down by `10vh` during the inspection phase to keep elements in scope, before sliding diagonally (`100vw` right, `50vh` down) to the next realm.
* **Progress Glider**: A viewport-fixed minecart goose overlay (`crystal_goose.png`) that glides horizontally across the bottom of the screen as progress increases.

---

## 🚧 Challenges We Ran Into
* **Text Wrapping & Scope in Sizing:** Designing a highly visual WebGL-like experience inside standard document viewports without heavy frameworks (React/Next) required strict height containment. We restructured the layout into a balanced, 3-column desktop layout so that the clicker shop, chat room, and scrolling photo wall sit side-by-side with maximum horizontal space, preventing truncation.
* **State Syncing Over WebSockets:** Ensuring that click power, auto-miner increments, chat histories, and profile card listings sync instantly to all clients required a lightweight, robust Socket.io event tree.
* **Relative Positioning of Easter Eggs:** Aligning absolute-positioned hidden gemstones to dynamic flex grid elements (like campfire logs) meant that resizing the browser caused them to drift. We solved this by nesting the gemstones relatively inside their parents, ensuring they remain adjacent at all screen sizes.

---

## 🎉 Accomplishments That We're Proud Of
* Built a fully production-ready, database-backed web application without relying on heavy frontend frameworks, resulting in extremely fast loading times and smooth rendering.
* Engineered a real-time WebSocket connection loop that synchronizes user check-ins, active cavern status, upgrades, live photos, and team join inquiries.
* Designed a dual-perspective team recruitment interface (The Alliance Forge) allowing applicants to request joins and creators to review, accept, or decline inquiries in real-time with automatic database persistence.
* Created secure, server-side validation rules for clicker upgrades, making the mini-game proof against console click hacks.
* Solved responsive diagonal-to-vertical layout routing to ensure a premium, modern design aesthetic.
* Engineered a high-fidelity staggered dial spinner and dynamic template synthesizer for the Oracle of Ideas, generating 512 distinct, coherent hackathon prompt concepts with realistic feasibility/complexity scoring completely offline in the browser.

---

## 🚀 What's Next for Afterparty Digital
* **Name.com Domain Integration**: Connecting the Launch Room directly to the Name.com API so organizers can register and configure custom `afterparty.digital` subdomains for each cavern event instance.
* **WebRTC Voice Proximity Channels**: Layering spatial voice chat on top of our existing Socket.io text chat, so hackers can hear nearby miners as they scroll past each other in the cavern.
* **Physical QR Portals**: A companion mobile app for event staff to physically scan attendee badges and check them directly into active cavern shafts.
* **Leaderboard Tournaments**: Timed competitive mining sessions where the top crystal miners win real sponsor prizes at the end of the event.
