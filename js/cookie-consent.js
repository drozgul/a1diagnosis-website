/**
 * A1 Diagnosis Cookie Consent Banner
 * Self-contained IIFE — injects its own CSS + HTML, zero dependencies
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'a1_cookie_consent';
    var GA_ID = 'G-27QM6KXY13';

    // If user already declined, disable GA before it can initialize
    if (localStorage.getItem(STORAGE_KEY) === 'declined') {
        window['ga-disable-' + GA_ID] = true;
    }

    // Public method to re-show the banner (used by footer "Cookie Settings" link)
    window.a1ShowCookieConsent = function() {
        localStorage.removeItem(STORAGE_KEY);
        showBanner();
    };

    function injectStyles() {
        var css = [
            '.a1cc-overlay {',
            '  position: fixed; bottom: 0; left: 0; right: 0;',
            '  z-index: 9997;',
            '  pointer-events: none;',
            '  transition: opacity 0.3s ease;',
            '}',
            '.a1cc-banner {',
            '  pointer-events: auto;',
            '  background: #ffffff;',
            '  box-shadow: 0 -2px 16px rgba(0,0,0,0.1);',
            '  padding: 20px 24px;',
            '  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
            '  transform: translateY(100%);',
            '  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);',
            '}',
            '.a1cc-banner.a1cc-visible {',
            '  transform: translateY(0);',
            '}',
            '.a1cc-inner {',
            '  max-width: 1200px;',
            '  margin: 0 auto;',
            '  display: flex;',
            '  align-items: center;',
            '  justify-content: space-between;',
            '  gap: 20px;',
            '}',
            '.a1cc-text {',
            '  color: #1e293b;',
            '  font-size: 14px;',
            '  line-height: 1.5;',
            '  flex: 1;',
            '}',
            '.a1cc-text a {',
            '  color: #0d9488;',
            '  text-decoration: underline;',
            '}',
            '.a1cc-text a:hover {',
            '  color: #14b8a6;',
            '}',
            '.a1cc-buttons {',
            '  display: flex;',
            '  gap: 10px;',
            '  flex-shrink: 0;',
            '}',
            '.a1cc-btn {',
            '  padding: 10px 24px;',
            '  border-radius: 6px;',
            '  font-size: 14px;',
            '  font-weight: 600;',
            '  cursor: pointer;',
            '  border: none;',
            '  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;',
            '  font-family: inherit;',
            '  white-space: nowrap;',
            '}',
            '.a1cc-btn-accept {',
            '  background: #14b8a6;',
            '  color: #ffffff;',
            '}',
            '.a1cc-btn-accept:hover {',
            '  background: #0d9488;',
            '  box-shadow: 0 2px 8px rgba(20,184,166,0.3);',
            '}',
            '.a1cc-btn-decline {',
            '  background: #ffffff;',
            '  color: #64748b;',
            '  border: 1px solid #cbd5e1;',
            '}',
            '.a1cc-btn-decline:hover {',
            '  background: #f8fafc;',
            '  color: #475569;',
            '}',
            '@media (max-width: 600px) {',
            '  .a1cc-inner {',
            '    flex-direction: column;',
            '    text-align: center;',
            '  }',
            '  .a1cc-buttons {',
            '    width: 100%;',
            '    justify-content: center;',
            '  }',
            '  .a1cc-btn {',
            '    flex: 1;',
            '  }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    function showBanner() {
        // Remove existing banner if present
        var existing = document.getElementById('a1cc-overlay');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'a1cc-overlay';
        overlay.className = 'a1cc-overlay';

        overlay.innerHTML = [
            '<div class="a1cc-banner" id="a1cc-banner">',
            '  <div class="a1cc-inner">',
            '    <div class="a1cc-text">',
            '      We use cookies to analyze site traffic and improve your experience. ',
            '      <a href="/privacy-policy.html">Learn more</a>',
            '    </div>',
            '    <div class="a1cc-buttons">',
            '      <button class="a1cc-btn a1cc-btn-accept" id="a1cc-accept">Accept</button>',
            '      <button class="a1cc-btn a1cc-btn-decline" id="a1cc-decline">Decline</button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        document.body.appendChild(overlay);

        // Trigger slide-up animation on next frame
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                document.getElementById('a1cc-banner').classList.add('a1cc-visible');
            });
        });

        // Bind buttons
        document.getElementById('a1cc-accept').addEventListener('click', onAccept);
        document.getElementById('a1cc-decline').addEventListener('click', onDecline);
    }

    function dismissBanner() {
        var banner = document.getElementById('a1cc-banner');
        if (!banner) return;
        banner.classList.remove('a1cc-visible');
        setTimeout(function() {
            var overlay = document.getElementById('a1cc-overlay');
            if (overlay) overlay.remove();
        }, 400);
    }

    function onAccept() {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        dismissBanner();
        loadGoogleAnalytics();
    }

    function onDecline() {
        localStorage.setItem(STORAGE_KEY, 'declined');
        window['ga-disable-' + GA_ID] = true;
        dismissBanner();
    }

    function loadGoogleAnalytics() {
        // Only load if not already present
        if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        function gtag(){ window.dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', GA_ID);
    }

    // Initialization
    injectStyles();

    var consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
        // First visit — show banner after a brief delay for page to settle
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(showBanner, 500);
            });
        } else {
            setTimeout(showBanner, 500);
        }
    }
    // If consent === 'accepted', GA is loaded by the conditional block in <head>
    // If consent === 'declined', GA disable flag was set at the top of this file
})();
