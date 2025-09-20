// ==UserScript==
// @name         reCAPTCHA Badge Visibility Checker
// @version      1.5
// @description  Detect and show reCAPTCHA badge. Always assume Google-owned sites use it. Continuously check for late-injected elements. Includes menu option to toggle fade-out alerts.
// @author       EthanJoyce
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/Ethanjoyce2010/Recaptcha-notifier/refs/heads/main/userscript.js
// @downloadURL  https://raw.githubusercontent.com/Ethanjoyce2010/Recaptcha-notifier/refs/heads/main/userscript.js
// ==/UserScript==

(function() {
    'use strict';

    const FADE_OUT_TIME = 2000; // milliseconds

    let alertShown = false;
    let badgeFound = false;

    // Load setting or default to true
    let fadeOutEnabled = GM_getValue("fadeOutEnabled", true);

    // Add a menu command to toggle fade setting
    function registerMenu() {
        GM_registerMenuCommand(
            `Toggle Fade-Out (Currently: ${fadeOutEnabled ? "ON" : "OFF"})`,
            () => {
                fadeOutEnabled = !fadeOutEnabled;
                GM_setValue("fadeOutEnabled", fadeOutEnabled);
                alert(`Fade-Out is now ${fadeOutEnabled ? "ENABLED" : "DISABLED"}. Reload page to apply.`);
            }
        );
    }
    registerMenu();

    // Add styles for the alert box
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
    `);

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
                setTimeout(() => alertBox.remove(), 500);
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

    window.addEventListener("load", () => {
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
