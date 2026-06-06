import asyncio
import os
import glob
import subprocess
import shutil
from playwright.async_api import async_playwright

# 1. Narrator voiceover text
VOICEOVER_TEXT = (
    "Welcome to Afterparty Digital—the ultimate interactive networking and project-launch platform designed for hackathon late-hours. "
    "Instead of a static event page, we've designed a stepped cavern descent that gamifies connections, fully powered by a live Node.js and Socket.io backend. "
    "Right at the surface launch room, organizers deploy custom event caverns, instantly synced to our MongoDB Atlas database. "
    "As we descend into the Amethyst Networking Mine, we reveal the active hackers inside the shaft. "
    "Here, participants search profiles by skills or filter by developer roles to spark immediate matches. "
    "Let's find full stack developers, inspect an icebreaker card, and register a connection. "
    "Further down, hackers gather around the crystal campfire to chat in real-time, and post snapshots to the live Photo Wall. "
    "The caverns also feature an active mining mini-game. "
    "Mined crystals serve as currency in the upgrading shop to buy helper companions. "
    "We can click the amethyst gemstone to mine, buy a pickaxe, locate hidden crystals, and capture a flash moment snapshot. "
    "Next, the Alliance Forge solves team formation. "
    "Teams register their project names and technical stacks, making it easy for solo hackers to search listings, send inquiries, and join active alliances. "
    "When brainstorms hit a wall, developers spin the Oracle of Ideas dials. "
    "This slot-machine concept uses combination logic to generate randomized hackathon project prompts. "
    "Finally, we reach the Sponsor Bounty Board to view integration rewards, before smooth-scrolling back to the surface. "
    "Afterparty Digital turns event networking into an unforgettable real-time journey."
)

# 2. Virtual cursor CSS/JS to inject on page load
CURSOR_INJECT_JS = """
const cursor = document.createElement('div');
cursor.id = 'virtual-cursor';
cursor.style.position = 'fixed';
cursor.style.width = '14px';
cursor.style.height = '14px';
cursor.style.background = '#00FFFF';
cursor.style.borderRadius = '50%';
cursor.style.border = '2px solid #ffffff';
cursor.style.boxShadow = '0 0 10px #00FFFF, 0 0 20px #00FFFF';
cursor.style.pointerEvents = 'none';
cursor.style.zIndex = '99999';
cursor.style.transform = 'translate(-50%, -50%)';
cursor.style.transition = 'width 0.1s, height 0.1s, background-color 0.1s';

function initCursor() {
  if (!document.getElementById('virtual-cursor')) {
    document.body.appendChild(cursor);
  }
}
if (document.body) {
  initCursor();
} else {
  document.addEventListener('DOMContentLoaded', initCursor);
}

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

document.addEventListener('mousedown', () => {
  cursor.style.width = '8px';
  cursor.style.height = '8px';
  cursor.style.backgroundColor = '#FF007F';
  cursor.style.boxShadow = '0 0 8px #FF007F, 0 0 15px #FF007F';
});

document.addEventListener('mouseup', () => {
  cursor.style.width = '14px';
  cursor.style.height = '14px';
  cursor.style.backgroundColor = '#00FFFF';
  cursor.style.boxShadow = '0 0 10px #00FFFF, 0 0 20px #00FFFF';
});
"""

# Mouse coordinate state tracking (Centered at 1280x720 viewport center)
current_mouse_x = 640
current_mouse_y = 360

async def smooth_move_to(page, selector):
    global current_mouse_x, current_mouse_y
    locator = page.locator(selector).first
    box = await locator.bounding_box()
    if not box:
        print(f"Warning: Selector '{selector}' bounding box not found.")
        return
    
    target_x = box["x"] + box["width"] / 2
    target_y = box["y"] + box["height"] / 2
    
    steps = 8
    for i in range(1, steps + 1):
        t = i / steps
        # Cubic ease-in-out movement
        t_smooth = t * t * (3 - 2 * t)
        x = current_mouse_x + (target_x - current_mouse_x) * t_smooth
        y = current_mouse_y + (target_y - current_mouse_y) * t_smooth
        await page.mouse.move(x, y)
        await asyncio.sleep(0.005)
        
    current_mouse_x = target_x
    current_mouse_y = target_y
    await asyncio.sleep(0.05)

async def smooth_click(page, selector):
    await smooth_move_to(page, selector)
    await page.mouse.down()
    await asyncio.sleep(0.04)
    await page.mouse.up()
    await asyncio.sleep(0.1)

async def smooth_type(page, selector, text):
    await smooth_click(page, selector)
    await page.keyboard.type(text, delay=20)
    await asyncio.sleep(0.05)

async def smooth_scroll_to(page, target_percent):
    current_y = await page.evaluate("window.scrollY")
    max_scroll = await page.evaluate("document.documentElement.scrollHeight - window.innerHeight")
    target_y = int(target_percent * max_scroll)
    
    step = 40 if target_y > current_y else -40
    if step == 0:
        return
    steps_count = int(abs(target_y - current_y) / abs(step))
    
    print(f"Scrolling smoothly to {int(target_percent * 100)}% depth...")
    for _ in range(steps_count):
        current_y += step
        await page.evaluate(f"window.scrollTo(0, {current_y})")
        await asyncio.sleep(0.005)
        
    await page.evaluate(f"window.scrollTo(0, {target_y})")
    await asyncio.sleep(0.3)

def generate_voiceover(text, output_file):
    print(f"1. Synthesizing voiceover narration with edge-tts (Ava voice)...")
    if os.path.exists(output_file):
        os.remove(output_file)
    cmd = [
        "edge-tts",
        "--voice", "en-US-AvaNeural",
        "--text", text,
        "--write-media", output_file
    ]
    subprocess.run(cmd, check=True)
    print(f"   [SUCCESS] Narration audio saved to {output_file}")

async def record_walkthrough(html_path, temp_dir):
    print("2. Starting Playwright video recording...")
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir)

    async with async_playwright() as p:
        # Launch headless browser — use a smaller viewport so content appears zoomed in
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            device_scale_factor=1.25,
            record_video_dir=temp_dir,
            record_video_size={"width": 1280, "height": 720}
        )
        
        page = await context.new_page()
        
        # Add console and error handlers
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        file_url = os.environ.get("DEMO_URL", "http://localhost:5500")
        print(f"   Opening page: {file_url}")
        
        # Inject the virtual cursor script on load
        await page.add_init_script(CURSOR_INJECT_JS)
        await page.goto(file_url, wait_until="networkidle")
        await page.wait_for_timeout(3000) # let initial animations settle
        
        # --- SCENE 0: Dismiss Join Modal ---
        print("   - Recording Scene 0: Dismissing Join Modal")
        try:
            join_modal = page.locator("#join-modal")
            if await join_modal.is_visible(timeout=3000):
                await smooth_type(page, "#join-username", "DemoHacker")
                await smooth_click(page, "#join-modal button[type='submit']")
                await page.wait_for_timeout(2000) # wait for modal to dismiss and socket to connect
        except Exception:
            print("     (No join modal found, continuing...)")
        
        # Seed demo attendees via JS so the gallery populates for the video
        print("   - Seeding demo attendees for video walkthrough...")
        await page.evaluate("""() => {
            const demoUsers = [
                { name: 'Alice Chen', gems: 142 },
                { name: 'Marcus Rivera', gems: 98 },
                { name: 'Priya Sharma', gems: 76 },
                { name: 'Jake Thompson', gems: 55 },
                { name: 'Sofia Nakamura', gems: 43 },
                { name: 'DemoHacker', gems: 30 },
                { name: 'Liam O\\'Brien', gems: 21 },
                { name: 'Zara Mitchell', gems: 15 }
            ];
            // Call the global function that sets onlineUsers internally
            if (typeof updateLeaderboardAndAttendees === 'function') {
                updateLeaderboardAndAttendees(demoUsers);
            }
        }""")
        await page.wait_for_timeout(500)
              # --- SCENE 1: Launch Room Onboarding (Form entry) ---
        print("   - Recording Scene 1: Launch Room Form Entry")
        await smooth_type(page, "#event-name", "Quantum Hackers Cavern")
        await smooth_type(page, "#event-time", "10 PM")
        await smooth_type(page, "#event-max", "80")
        await smooth_click(page, "button[type='submit']")
        await page.wait_for_timeout(22000) # Wait for narration to finish speaking about Realm 1
        
        # --- SCENE 2: Networking Arena (Filters and modal checks) ---
        print("   - Recording Scene 2: Amethyst Networking Mine")
        await smooth_scroll_to(page, 0.20)
        
        try:
            await page.wait_for_selector("#attendee-gallery .glass-panel", timeout=3000)
            print("     Developer cards visible!")
            await smooth_click(page, "#btn-filter-Dev")
            await page.wait_for_timeout(500)
            
            # Click Icebreaker on the first visible card
            icebreaker_btn = page.locator("#attendee-gallery button:has-text('Icebreaker')").first
            if await icebreaker_btn.is_visible(timeout=3000):
                await smooth_click(page, "#attendee-gallery button:has-text('Icebreaker')")
                await page.wait_for_timeout(1500)
                try:
                    await smooth_click(page, "button:has-text('DISCOVERY CONFIRMED')")
                except Exception:
                    pass
            await page.wait_for_timeout(500)
            
            # Click Match
            match_btn = page.locator("#attendee-gallery button:has-text('Match')").first
            if await match_btn.is_visible(timeout=2000):
                await smooth_click(page, "#attendee-gallery button:has-text('Match')")
                await page.wait_for_timeout(500)
        except Exception as e:
            print(f"     (Attendee interaction skipped: {e})")
            await page.wait_for_timeout(1000)
            
        await page.wait_for_timeout(15000) # Wait for narration to finish speaking about Realm 2
        
        # --- SCENE 3: Campfire & Crystal Clicker Mini-Game ---
        print("   - Recording Scene 3: Crystal Campfire & Clicker")
        await smooth_scroll_to(page, 0.40)
        try:
            await smooth_type(page, "#chat-input", "Hey everyone! Let's mine some crystals!")
            await smooth_click(page, "button:has-text('SPARK')")
        except Exception:
            print("     (Chat input not found, continuing...)")
        
        # Click Amethyst gemstone 10 times to earn currency
        try:
            gem_selector = ".gem-clicker"
            await smooth_move_to(page, gem_selector)
            print("     Mining crystals...")
            for _ in range(10):
                await page.mouse.down()
                await asyncio.sleep(0.02)
                await page.mouse.up()
                await asyncio.sleep(0.02)
                
            await page.wait_for_timeout(300)
            # Buy Steel Pickaxe upgrade
            await smooth_click(page, "#btn-upgrade-pickaxe")
        except Exception:
            print("     (Gem clicker not found, continuing...)")
        
        # Click the hidden gem near campfire
        try:
            await smooth_click(page, ".hidden-gem")
            await page.wait_for_timeout(500)
        except Exception:
            pass
        
        # Capture a Flash Moment photo
        try:
            await smooth_click(page, "button:has-text('Capture Moment')")
            await page.wait_for_timeout(1000)
        except Exception:
            print("     (Capture Moment button not found, continuing...)")
            
        await page.wait_for_timeout(20000) # Wait for narration to finish speaking about Realm 3
        
        # --- SCENE 4: The Alliance Forge ---
        print("   - Recording Scene 4: Team Forge Registration")
        await smooth_scroll_to(page, 0.60)
        try:
            await smooth_type(page, "#team-name", "Holographic Sensors")
            await smooth_type(page, "#team-looking", "UX/UI Designers, Rust Dev")
            await smooth_type(page, "#team-tech", "React, Rust, Tailwind")
            await smooth_click(page, "#team-form button[type='submit']")
            await page.wait_for_timeout(500)
        except Exception:
            print("     (Team form not found, continuing...)")
        
        try:
            await smooth_click(page, "#teams-container button:has-text('Send Inquiry')")
            await page.wait_for_timeout(500)
        except Exception:
            print("     (Send Inquiry button not found, continuing...)")
            
        await page.wait_for_timeout(10000) # Wait for narration to finish speaking about Realm 4

        # --- SCENE 5: Oracle of Ideas ---
        print("   - Recording Scene 5: Oracle Idea Generator")
        await smooth_scroll_to(page, 0.80)
        try:
            await smooth_click(page, "button:has-text('ROLL IDEA DIALS')")
            await page.wait_for_timeout(2000) # wait for slot spinner
        except Exception:
            print("     (Oracle dials not found, continuing...)")
            
        await page.wait_for_timeout(8000) # Wait for narration to finish speaking about Realm 5
        
        # --- SCENE 6: Bounty Board & Back to Surface ---
        print("   - Recording Scene 6: Sponsor Bounties & Scroll to Top")
        await smooth_scroll_to(page, 1.00)
        await page.wait_for_timeout(1000) # admire bounties
        # Click header logo to scroll smoothly to top
        try:
            await smooth_click(page, "header a.cursor-pointer")
        except Exception:
            print("     (Header logo not found, scrolling manually...)")
            await page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        await page.wait_for_timeout(6000) # wait for smooth scroll animation to reach Realm 1 and narration to finish
        
        # Close page and context to finish video saving
        await page.close()
        await context.close()
        await browser.close()
    print("   [SUCCESS] Playwright video recording completed.")
 
def compile_final_video(temp_dir, narration_audio, final_output):
    print("3. Compiling final video with FFmpeg...")
    # Find the recorded webm file in the temp directory
    webm_files = glob.glob(os.path.join(temp_dir, "*.webm"))
    if not webm_files:
        raise FileNotFoundError("Could not find the recorded Playwright video file.")
    
    recorded_webm = webm_files[0]
    print(f"   Source WebM video: {recorded_webm}")
    print(f"   Source audio: {narration_audio}")
    
    if os.path.exists(final_output):
        os.remove(final_output)
        
    # FFmpeg command to compile H.264 video at native 1280x720
    cmd = [
        "C:\\Users\\Administrator\\Downloads\\ffmpeg\\bin\\ffmpeg.exe",
        "-y",
        "-i", recorded_webm,
        "-i", narration_audio,
        "-map", "0:v",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        final_output
    ]
    
    subprocess.run(cmd, check=True)
    print(f"   [SUCCESS] Final presentation compiled: {final_output}")

def main():
    narration_audio = "narration.mp3"
    temp_video_dir = "video_temp"
    final_output = "afterparty_digital_demo.mp4"
    html_path = "index.html"
    
    try:
        # Step 1: Synthesize voiceover audio
        generate_voiceover(VOICEOVER_TEXT, narration_audio)
        
        # Step 2: Record visual walk-through
        asyncio.run(record_walkthrough(html_path, temp_video_dir))
        
        # Allow Windows some time to release the file handle
        import time
        print("   Waiting 3 seconds for Playwright to release file handles...")
        time.sleep(3)
        
        # Step 3: Stitch tracks together
        compile_final_video(temp_video_dir, narration_audio, final_output)
        
        # Clean up temporary folders
        if os.path.exists(temp_video_dir):
            shutil.rmtree(temp_video_dir)
        if os.path.exists(narration_audio):
            os.remove(narration_audio)
            
        print(f"\n=======================================================")
        print(f"MASTERCLASS DEMO VIDEO COMPILATION COMPLETE!")
        print(f"File created: {os.path.abspath(final_output)}")
        print(f"=======================================================")
        
    except Exception as e:
        print(f"\n[ERROR] Video generation failed: {e}")

if __name__ == "__main__":
    main()
