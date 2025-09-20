// ==UserScript==
// @name         reCAPTCHA Badge Visibility Checker
// @version      1.6
// @description  Detect and show reCAPTCHA badge. Always assume Google-owned sites use it. Continuously check for late-injected elements. User can choose fade-out behavior on first use.
// @author       EthanJoyce
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
    const RESET_SETTINGS = true; // set to true to show choice dialog again (will auto-reset to false after use)
    // ============================

    let alertShown = false;
    let badgeFound = false;
    let fadeOutEnabled = null; // Will be set based on user choice or saved preference

    // Add styles for the alert box and choice dialog
    GM_addStyle(`
      .recaptcha-alert {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #333;
        color: #fff;
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 999999;
        opacity: 0.95;
        cursor: pointer;
        transition: opacity 0.5s ease-out;
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
                <div class="recaptcha-choice-buttons">
                    <button class="recaptcha-choice-btn auto">Auto-fade (2s)</button>
                    <button class="recaptcha-choice-btn manual">Stay until clicked</button>
                </div>
            `;

            // Add event listeners
            const autoBtn = dialog.querySelector('.auto');
            const manualBtn = dialog.querySelector('.manual');

            autoBtn.addEventListener('click', () => {
                GM_setValue('fadeOutEnabled', true);
                fadeOutEnabled = true;
                document.body.removeChild(overlay);
                resolve(true);
            });

            manualBtn.addEventListener('click', () => {
                GM_setValue('fadeOutEnabled', false);
                fadeOutEnabled = false;
                document.body.removeChild(overlay);
                resolve(false);
            });

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
        });
    }

    async function initializeFadeOutSetting() {
        // Check if reset is requested
        if (RESET_SETTINGS) {
            console.log('reCAPTCHA Userscript: Reset requested, showing choice dialog...');
            // Clear existing setting and show dialog
            GM_setValue('fadeOutEnabled', null);
            fadeOutEnabled = await showChoiceDialog();
            // Note: The RESET_SETTINGS constant should be manually changed back to false in the script
            return;
        }

        const savedSetting = GM_getValue('fadeOutEnabled', null);

        if (savedSetting === null) {
            // First time use - show choice dialog
            fadeOutEnabled = await showChoiceDialog();
        } else {
            // Use saved setting
            fadeOutEnabled = savedSetting;
        }
    }

    function showAlert(message) {
        if (alertShown) return;
        alertShown = true;

        const alertBox = document.createElement("div");
        alertBox.className = "recaptcha-alert";
        alertBox.textContent = message;

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
        const badge = document.querySelector(".grecaptcha-badge");
        if (badge) {
            badge.style.visibility = "visible"; // force visible
            if (!badgeFound) {
                showAlert("This site uses reCAPTCHA");
                badgeFound = true;
            }
            return true;
        }
        return false;
    }

    // Special case: Google-owned sites -> always assume yes
    function isGoogleSite() {
        return /\.google\./.test(window.location.hostname) ||
               /\.youtube\./.test(window.location.hostname) ||
               /\.blogger\./.test(window.location.hostname) ||
               /\.gmail\./.test(window.location.hostname);
    }

    window.addEventListener("load", async () => {
        // Initialize fade-out setting first
        await initializeFadeOutSetting();

        setTimeout(() => {
            if (isGoogleSite()) {
                showAlert("This Google site uses reCAPTCHA");
            } else if (!checkReCaptcha()) {
                showAlert("This site does NOT use reCAPTCHA");
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
