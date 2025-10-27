# CAPTCHA Detection & Visibility Notifier

Short: Detects whether a page uses reCAPTCHA, hCaptcha, or Cloudflare Turnstile and notifies you with a beautiful on-screen alert.

## Why

As [CHUPPL explains](https://www.youtube.com/watch?v=VTsBP21-XpI), reCAPTCHA isn't just about blocking bots. It quietly tracks your mouse movements, clicks, IP, and browser fingerprint—building profiles across millions of sites.

Researchers and lawsuits suggest it's poor at stopping bots but effective at surveillance and even unpaid labor for Google's AI.

This script makes CAPTCHA systems visible so you know when they're watching.

## Features

### Detection Capabilities
- **reCAPTCHA Detection:**
  - Detects `.grecaptcha-badge` and forces it visible
  - Detects reCAPTCHA v2 (checkbox & invisible)
  - Detects reCAPTCHA v3 (score-based, hidden tokens)
  - Detects reCAPTCHA Enterprise
  - Checks for `grecaptcha` JavaScript objects and callbacks
  - Scans scripts, iframes, and meta tags for reCAPTCHA references
  
- **hCaptcha Detection:**
  - Detects hCaptcha widgets and badges
  - Checks for hCaptcha JavaScript objects
  - Scans for hCaptcha response tokens
  
- **Cloudflare Turnstile Detection:**
  - Detects Turnstile widgets
  - Checks for Turnstile JavaScript objects
  - Scans for Turnstile response tokens

- **Google Properties:**
  - Automatically assumes Google-owned domains use reCAPTCHA and notifies with special styling

### User Experience
- **Modern, Beautiful UI:**
  - Gradient-styled alerts with smooth animations
  - Different colors for different CAPTCHA types
  - Icons to quickly identify alert types
  - Smooth slide-in animations and hover effects
  
- **Customizable Behavior:**
  - On first run, choose between auto-fade (3s) or persistent alerts
  - Easy-to-access settings via gear icon (⚙️) on any alert
  - Preferences persist across browser restarts
  
- **Smart Detection:**
  - Watches for late-injected badges using MutationObserver + 1s polling
  - Prevents duplicate notifications for the same CAPTCHA
  - Continuously monitors for CAPTCHA changes

## Install

1. Install a userscript manager (Tampermonkey, Greasemonkey, or Violentmonkey).  
2. Create a new userscript and paste the contents of `userscript.js`, or install via your manager's "Add from file" feature.

## Usage / Test

- Open any website. On first run you'll see a dialog asking your preferred alert behavior. Choose one.  
- If a page contains a CAPTCHA (reCAPTCHA, hCaptcha, or Turnstile), you'll get a color-coded alert indicating which type is in use.
- If none is found, you'll see a green checkmark alert saying it does NOT use CAPTCHA.  
- If a CAPTCHA appears later (injected dynamically), the script will notify you when it shows up.  
- Use the ⚙️ button on any alert to reopen settings and change the fade behavior anytime.

## Alert Types

- **Red Gradient (⚠️):** reCAPTCHA detected - Google is tracking you
- **Orange Gradient (🛡️):** hCaptcha detected - Alternative CAPTCHA system
- **Purple Gradient (☁️):** Cloudflare Turnstile detected - Cloudflare verification
- **Green Gradient (✓):** No CAPTCHA detected - You're clear!

## Notes

- Metadata in the userscript requests `GM_addStyle`, `GM_setValue`, and `GM_getValue`. The script also supports the modern `GM.*` promise-based API and falls back to `localStorage`.  
- If you want strict modern-GM behavior only, you can adjust the `@grant` or remove the fallback logic in the script.

## License

MIT
