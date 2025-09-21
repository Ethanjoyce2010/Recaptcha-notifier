# reCAPTCHA Badge Visibility Checker

Short: Detects whether a page uses reCAPTCHA (grecaptcha badge) and notifies you with a small on-screen alert.
### Why

As [CHUPPL explains](https://www.youtube.com/watch?v=VTsBP21-XpI), reCAPTCHA isn’t just about blocking bots. It quietly tracks your mouse movements, clicks, IP, and browser fingerprint—building profiles across millions of sites.

Researchers and lawsuits suggest it’s poor at stopping bots but effective at surveillance and even unpaid labor for Google’s AI.

This script makes reCAPTCHA visible so you know when it’s watching.


Features
- Detects `.grecaptcha-badge` and forces it visible.
- Assumes Google-owned domains use reCAPTCHA and notifies automatically.
- Watches for late-injected badges using MutationObserver + 1s polling.
- On first run, prompts you whether alerts should auto-fade (2s) or stay until clicked.
- Preference persists across browser restarts (supports Greasemonkey/Tampermonkey, modern GM.* APIs, and falls back to localStorage).
- Small settings gear on alerts lets you reopen the choice dialog and change the preference later.

Install
1. Install a userscript manager (Tampermonkey, Greasemonkey, or Violentmonkey).
2. Create a new userscript and paste the contents of `userscript.js`, or install via your manager's "Add from file" feature.

Usage / Test
- Open any website. On first run you'll see a dialog asking your preferred alert behavior. Choose one.
- If a page contains a reCAPTCHA badge, you'll get an alert saying the site uses reCAPTCHA. If none is found, you'll see an alert saying it does NOT use reCAPTCHA.
- If a badge appears later (injected), the script will notify you when it shows up.
- Use the ⚙️ button on the alert to reopen settings and change the fade behavior anytime.

Notes
- Metadata in the userscript requests `GM_addStyle`, `GM_setValue`, and `GM_getValue`. The script also supports the modern `GM.*` promise-based API and falls back to `localStorage`.
- If you want strict modern-GM behavior only, you can adjust the `@grant` or remove the fallback logic in the script.
- I will review pull requests and will accept them if they fix something or help the script out.

License
- MIT
