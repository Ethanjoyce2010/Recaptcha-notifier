// ==UserScript==
// @name         reCAPTCHA Badge Visibility Notifier
// @version      1.9.1
// @description  Detect and show reCAPTCHA badge. Always assume Google-owned sites use it. Continuously check for late-injected elements. User can choose fade-out behavior on first use.
// @author       EthanJoyce
// @namespace    https://github.com/Ethanjoyce2010/Recaptcha-notifier
// @license      MIT
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/Ethanjoyce2010/Recaptcha-notifier/refs/heads/main/userscript.js
// @downloadURL  https://raw.githubusercontent.com/Ethanjoyce2010/Recaptcha-notifier/refs/heads/main/userscript.js
// ==/UserScript==
(function() {
    'use strict';

    // ====== CONFIGURATION ======
    const FADE_OUT_TIME = 2000; // milliseconds (only used if fade out is enabled)
    // ============================

  // Tracks the last alert type shown: 'present', 'absent', or null
  let lastAlertType = null;
    let badgeFound = false;
    let fadeOutEnabled = null; // Will be set based on user choice or saved preference

    // Add styles for the alert box and choice dialog
    GM_addStyle(`
      .recaptcha-alert {
        position: fixed;
        top: 20px;
        left: 20px;
        background: #333;
        color: #fff;
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 999999;
        opacity: 0.95;
        cursor: pointer;
        transition: opacity 0.5s ease-out;
        font-weight: normal;
      }
      .recaptcha-alert.recaptcha-red {
        background: #d32f2f !important;
        color: #fff !important;
      }
      .recaptcha-alert.recaptcha-bold {
        font-weight: bold !important;
      }
      .recaptcha-alert.fade-out {
        opacity: 0;
      }
      .recaptcha-choice-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        color: #333;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000000;
        font-family: Arial, sans-serif;
        max-width: 400px;
        text-align: center;
      }
      .recaptcha-choice-dialog h3 {
        margin: 0 0 15px 0;
        font-size: 18px;
      }
      .recaptcha-choice-dialog p {
        margin: 0 0 20px 0;
        font-size: 14px;
        line-height: 1.4;
      }
      .recaptcha-choice-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
      }
      .recaptcha-choice-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      .recaptcha-choice-btn.auto {
        background: #4CAF50;
        color: white;
      }
      .recaptcha-choice-btn.auto:hover {
        background: #45a049;
      }
      .recaptcha-choice-btn.manual {
        background: #2196F3;
        color: white;
      }
      .recaptcha-choice-btn.manual:hover {
        background: #1976D2;
      }
      .recaptcha-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 999999;
      }
    `);

  // Preference helpers: try GM_* APIs (sync or promise), GM.* APIs, then localStorage fallback
  async function getPref(key, defaultValue) {
    try {
      // Greasemonkey/Tampermonkey legacy functions
      if (typeof GM_getValue === 'function') {
        const value = GM_getValue(key, defaultValue);
        // If it returned a Promise (modern GM), await it
        if (value != null && typeof value.then === 'function') return await value;
        return (typeof value === 'undefined') ? defaultValue : value;
      }

      // Newer GM.* API
      if (typeof GM !== 'undefined' && typeof GM.getValue === 'function') {
        const v = await GM.getValue(key, defaultValue);
        return (typeof v === 'undefined') ? defaultValue : v;
      }
    } catch (e) {
      // fallthrough to localStorage
    }

    try {
      const raw = localStorage.getItem('recaptcha_' + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      return defaultValue;
    }
  }

  async function setPref(key, value) {
    try {
      if (typeof GM_setValue === 'function') {
        const res = GM_setValue(key, value);
        if (res && typeof res.then === 'function') await res;
        return;
      }

      if (typeof GM !== 'undefined' && typeof GM.setValue === 'function') {
        await GM.setValue(key, value);
        return;
      }
    } catch (e) {
      // fallthrough to localStorage
    }

    try {
      localStorage.setItem('recaptcha_' + key, JSON.stringify(value));
    } catch (e) {
      // ignore
    }
  }

  function showChoiceDialog() {
        return new Promise((resolve) => {
            // Create overlay
            const overlay = document.createElement("div");
            overlay.className = "recaptcha-overlay";

            // Create dialog
            const dialog = document.createElement("div");
            dialog.className = "recaptcha-choice-dialog";
            dialog.innerHTML = `
                <h3>reCAPTCHA Notification Settings</h3>
                <p>How would you like reCAPTCHA notifications to behave?</p>
                <p>(You can change this later by clicking the gear icon in notifications)</p>
                <p>(Will apply when reloaded)</p>
                <div class="recaptcha-choice-buttons">
                    <button class="recaptcha-choice-btn auto">Auto-fade (2s)</button>
                    <button class="recaptcha-choice-btn manual">Stay until clicked</button>
                </div>
            `;

            // Add event listeners
            const autoBtn = dialog.querySelector('.auto');
            const manualBtn = dialog.querySelector('.manual');

      autoBtn.addEventListener('click', async () => {
        await setPref('fadeOutEnabled', true);
        fadeOutEnabled = true;
        document.body.removeChild(overlay);
        resolve(true);
      });

      manualBtn.addEventListener('click', async () => {
        await setPref('fadeOutEnabled', false);
        fadeOutEnabled = false;
        document.body.removeChild(overlay);
        resolve(false);
      });

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
        });
    }

  async function initializeFadeOutSetting() {
    const savedSetting = await getPref('fadeOutEnabled', null);

    if (savedSetting === null) {
      // First time use - show choice dialog
      fadeOutEnabled = await showChoiceDialog();
    } else {
      // Use saved setting
      fadeOutEnabled = savedSetting;
    }
  }

  function showAlert(message, type, opts = {}) {
    // type is 'present' or 'absent'. Only suppress if it's identical to lastAlertType
    if (type && lastAlertType === type) return;
    lastAlertType = type || null;

    const alertBox = document.createElement("div");
    alertBox.className = "recaptcha-alert";

    // Add red background if Google site or reCAPTCHA present
    if (opts.isGoogle || opts.isRecaptcha) {
      alertBox.classList.add('recaptcha-red');
    }
    // Add bold if Google site
    if (opts.isGoogle) {
      alertBox.classList.add('recaptcha-bold');
    }

    // Message container
    const msg = document.createElement('span');
    msg.textContent = message;
    alertBox.appendChild(msg);

    // Settings gear to reopen choice dialog
    const gear = document.createElement('button');
    gear.title = 'Notification settings';
    gear.style.marginLeft = '10px';
    gear.style.background = 'transparent';
    gear.style.border = 'none';
    gear.style.color = 'inherit';
    gear.style.cursor = 'pointer';
    gear.textContent = '⚙️';
    gear.addEventListener('click', async (e) => {
      e.stopPropagation();
      await showChoiceDialog();
    });
    alertBox.appendChild(gear);

    // Remove on click
    alertBox.addEventListener("click", () => {
      alertBox.remove();
    });

    document.body.appendChild(alertBox);

    if (fadeOutEnabled) {
      setTimeout(() => {
        alertBox.classList.add("fade-out");
        setTimeout(() => {
          if (alertBox.parentNode) {
            alertBox.remove();
          }
        }, 500);
      }, FADE_OUT_TIME);
    }
  }

  function checkReCaptcha() {
    // Returns true if reCAPTCHA is detected by any heuristic.
    // Heuristics: badge, .g-recaptcha or data-sitekey, grecaptcha object, script/iframe srcs, inline script text.
    let found = false;
    try {
      // 1) Visible badge
      const badge = document.querySelector('.grecaptcha-badge');
      if (badge) {
        try { badge.style.visibility = 'visible'; } catch(e) {}
        showAlert('This site uses reCAPTCHA', 'present', { isRecaptcha: true });
        return true;
      }

      // 2) Common widget markers: g-recaptcha class or data-sitekey attribute
      const widget = document.querySelector('.g-recaptcha, [data-sitekey]');
      if (widget) {
        showAlert('This site uses reCAPTCHA', 'present', { isRecaptcha: true });
        return true;
      }

      // 3) grecaptcha JS object (render, enterprise, etc.)
      if (typeof window.grecaptcha !== 'undefined') {
        try {
          if (window.grecaptcha && (typeof window.grecaptcha.render === 'function' || window.grecaptcha.enterprise)) {
            showAlert('This site uses reCAPTCHA', 'present', { isRecaptcha: true });
            return true;
          }
        } catch (e) {}
      }

      // 4) External scripts that reference reCAPTCHA
      const scripts = Array.from(document.getElementsByTagName('script'));
      for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        const src = s.src || '';
        if (src && /recaptcha|google.*recaptcha|recaptcha\/api/i.test(src)) {
          showAlert('This site uses reCAPTCHA', 'present', { isRecaptcha: true });
          return true;
        }
        // Inline script content may reference grecaptcha
        if (!src && s.textContent && /grecaptcha|recaptcha/i.test(s.textContent)) {
          showAlert('This site uses reCAPTCHA', 'present', { isRecaptcha: true });
          return true;
        }
      }

      // 5) Iframes that load recaptcha content
      const iframes = Array.from(document.getElementsByTagName('iframe'));
      for (let i = 0; i < iframes.length; i++) {
        const f = iframes[i];
        const src = f.src || '';
        if (src && /recaptcha|google.*recaptcha/i.test(src)) {
          showAlert('This site uses reCAPTCHA', 'present', { isRecaptcha: true });
          return true;
        }
      }
    } catch (e) {
      // Swallow errors from odd pages
    }

    return false;
  }

    // Special case: Google-owned sites -> always assume yes
  function isGoogleSite() {
    const host = window.location.hostname;
    return host.endsWith('.google.com') ||
         host.endsWith('.youtube.com') ||
         host.endsWith('.blogger.com') ||
         host.endsWith('.gmail.com');
  }

  window.addEventListener("load", async () => {
    // Initialize fade-out setting first
    await initializeFadeOutSetting();

    setTimeout(() => {
      if (isGoogleSite()) {
        showAlert("This Google site uses reCAPTCHA", 'present', { isGoogle: true, isRecaptcha: true });
      } else if (!checkReCaptcha()) {
        showAlert("This site does NOT use reCAPTCHA", 'absent');
      }

      // Watch for late injection
      const observer = new MutationObserver(() => checkReCaptcha());
      observer.observe(document.body, { childList: true, subtree: true });

      // Poll every 1s until found
      const interval = setInterval(() => {
        if (checkReCaptcha()) {
          clearInterval(interval);
        }
      }, 1000);
    }, 1000);
  });
})();