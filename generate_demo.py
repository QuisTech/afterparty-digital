import asyncio
import os
import glob
import subprocess
import shutil
from playwright.async_api import async_playwright

# 1. Narrator voiceover text
VOICEOVER_TEXT = (
    "Welcome to Afterparty Digital—the ultimate interactive networking and project-launch platform designed for hackathon late-hours. "
    "Instead of a static event page, we've designed a stepped cavern descent that gamifies connections. "
    "Right at the surface launch room, organizers deploy custom event caverns with capacity controls, linked instantly to real-time status trackers. "
    "As we descend into the Amethyst Networking Mine, we reveal the active hackers inside the shaft. "
    "Here, participants search profiles by skills or filter by developer roles to spark immediate matches. "
    "Let's find full stack developers, inspect an icebreaker card, and register a connection. "
    "Further down, hackers gather around the crystal campfire to chat in real-time. "
    "But the caverns also feature an active mining mini-game. "
    "Mined crystals serve as currency in the upgrading shop to buy helper companions. "
    "We can click the amethyst gemstone to mine, buy a pickaxe, and locate hidden crystals hidden in the cave walls. "
    "Next, the Alliance Forge solves team formation. "
    "Teams register their project names, technical stacks, and talent requirements, making it easy for solo hackers to search listings, send inquiries, and join active alliances. "
    "When brainstorms hit a wall, developers spin the Oracle of Ideas dials. "
    "This slot-machine concept uses combination logic to generate randomized hackathon project prompts along with feasibility metrics. "
    "Finally, we reach the Sponsor Bounty Board to view integration rewards, before smooth-scrolling back to the surface. "
    "Afterparty Digital turns event networking into an unforgettable journey."
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
document.body.appendChild(cursor);

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
    
    steps = 22
    for i in range(1, steps + 1):
        t = i / steps
        # Cubic ease-in-out movement
        t_smooth = t * t * (3 - 2 * t)
        x = current_mouse_x + (target_x - current_mouse_x) * t_smooth
        y = current_mouse_y + (target_y - current_mouse_y) * t_smooth
        await page.mouse.move(x, y)
        await asyncio.sleep(0.01) # 10ms
        
    current_mouse_x = target_x
    current_mouse_y = target_y
    await asyncio.sleep(0.12)

async def smooth_click(page, selector):
    await smooth_move_to(page, selector)
    await page.mouse.down()
    await asyncio.sleep(0.08)
    await page.mouse.up()
    await asyncio.sleep(0.2)

async def smooth_type(page, selector, text):
    await smooth_click(page, selector)
    await page.keyboard.type(text, delay=70)
    await asyncio.sleep(0.1)

async def smooth_scroll_to(page, target_percent):
    current_y = await page.evaluate("window.scrollY")
    max_scroll = await page.evaluate("document.documentElement.scrollHeight - window.innerHeight")
    target_y = int(target_percent * max_scroll)
    
    step = 8 if target_y > current_y else -8
    if step == 0:
        return
    steps_count = int(abs(target_y - current_y) / abs(step))
    
    print(f"Scrolling smoothly to {int(target_percent * 100)}% depth...")
    for _ in range(steps_count):
        current_y += step
        await page.evaluate(f"window.scrollTo(0, {current_y})")
        await asyncio.sleep(0.008) # smooth high framerate scroll wait
        
    await page.evaluate(f"window.scrollTo(0, {target_y})")
    await asyncio.sleep(0.6) # allow visual layout elements to settle

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
        # Launch headless browser to render visual elements at high quality on headless VM
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=temp_dir,
            record_video_size={"width": 1280, "height": 720}
        )
        
        page = await context.new_page()
        file_url = f"file:///{os.path.abspath(html_path).replace(os.sep, '/')}"
        print(f"   Opening page: {file_url}")
        
        # Inject the virtual cursor script on load
        await page.add_init_script(CURSOR_INJECT_JS)
        await page.goto(file_url)
        await page.wait_for_timeout(1500) # let initial animations settle
        
        # --- SCENE 1: Launch Room Onboarding (Form entry) ---
        print("   - Recording Scene 1: Launch Room Form Entry")
        await smooth_type(page, "#event-name", "Quantum Hackers Cavern")
        await smooth_type(page, "#event-time", "10 PM")
        await smooth_type(page, "#event-max", "80")
        await smooth_click(page, "button[type='submit']")
        await page.wait_for_timeout(2000) # enjoy the confetti
        
        # --- SCENE 2: Networking Arena (Filters and modal checks) ---
        print("   - Recording Scene 2: Amethyst Networking Mine")
        await smooth_scroll_to(page, 0.20)
        await smooth_click(page, "#btn-filter-Dev")
        await smooth_type(page, "#search-input", "Alex")
        await smooth_click(page, "button:has-text('Icebreaker')")
        await page.wait_for_timeout(2000) # view icebreaker text
        await smooth_click(page, "button:has-text('DISCOVERY CONFIRMED')")
        await smooth_click(page, "#attendee-gallery button:has-text('Match')")
        await page.wait_for_timeout(1000)
        
        # --- SCENE 3: Campfire & Crystal Clicker Mini-Game ---
        print("   - Recording Scene 3: Crystal Campfire & Clicker")
        await smooth_scroll_to(page, 0.40)
        await smooth_type(page, "#chat-input", "Hey everyone! Let's mine some crystals!")
        await smooth_click(page, "button:has-text('SPARK')")
        
        # Click Amethyst gemstone 15 times to earn currency
        gem_selector = ".gem-clicker"
        await smooth_move_to(page, gem_selector)
        print("     Mining crystals...")
        for _ in range(15):
            await page.mouse.down()
            await asyncio.sleep(0.04)
            await page.mouse.up()
            await asyncio.sleep(0.04)
            
        await page.wait_for_timeout(500)
        # Buy Steel Pickaxe upgrade
        await smooth_click(page, "#btn-upgrade-pickaxe")
        # Click the hidden gem near campfire
        await smooth_click(page, ".hidden-gem")
        await page.wait_for_timeout(1500)
        
        # --- SCENE 4: The Alliance Forge ---
        print("   - Recording Scene 4: Team Forge Registration")
        await smooth_scroll_to(page, 0.60)
        await smooth_type(page, "#team-name", "Holographic Sensors")
        await smooth_type(page, "#team-looking", "UX/UI Designers, Rust Dev")
        await smooth_type(page, "#team-tech", "React, Rust, Tailwind")
        await smooth_click(page, "#team-form button[type='submit']")
        await page.wait_for_timeout(1000)
        await smooth_click(page, "#teams-container button:has-text('Send Inquiry')")
        await page.wait_for_timeout(1000)

        # --- SCENE 5: Oracle of Ideas ---
        print("   - Recording Scene 5: Oracle Idea Generator")
        await smooth_scroll_to(page, 0.80)
        await smooth_click(page, "button:has-text('ROLL IDEA DIALS')")
        await page.wait_for_timeout(2000) # wait for slot spinner
        
        # --- SCENE 6: Bounty Board & Back to Surface ---
        print("   - Recording Scene 6: Sponsor Bounties & Scroll to Top")
        await smooth_scroll_to(page, 1.00)
        await page.wait_for_timeout(2000) # admire bounties
        # Click header logo to scroll smoothly to top
        await smooth_click(page, "header a.cursor-pointer")
        await page.wait_for_timeout(3500) # wait for smooth scroll animation to reach Realm 1
        
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
        
    # FFmpeg command using absolute path to compile and scale to 1920x1080 H.264
    cmd = [
        "C:\\Users\\Administrator\\Downloads\\ffmpeg\\bin\\ffmpeg.exe",
        "-y",
        "-i", recorded_webm,
        "-i", narration_audio,
        "-map", "0:v",
        "-map", "1:a",
        "-vf", "scale=1920:1080",
        "-c:v", "libx264",
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
