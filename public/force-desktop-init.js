/**
 * Force Desktop UI Initialization Script - BULLETPROOF VERSION
 * This runs IMMEDIATELY before any React hydration to prevent FOUC
 * Enhanced with extensive debugging and multiple enforcement layers
 */
(function() {
  'use strict';
  
  // Debug flag - set to true for extensive logging
  const DEBUG = false; // Disabled to prevent console spam and infinite loops
  const LOG_PREFIX = '[FORCE-DESKTOP-INIT]';
  
  function log(...args) {
    if (DEBUG && typeof console !== 'undefined') {
      console.log(LOG_PREFIX, new Date().toISOString(), ...args);
    }
  }
  
  function logError(...args) {
    if (typeof console !== 'undefined') {
      console.error(LOG_PREFIX, new Date().toISOString(), ...args);
    }
  }
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    log('Not in browser environment, exiting');
    return;
  }
  
  log('Script starting...');
  
  // Get role from cookie with better error handling
  function getCookie(name) {
    try {
      const cookies = document.cookie.split(';');
      log('All cookies:', document.cookie);
      
      for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(name + '=')) {
          const value = trimmed.substring(name.length + 1);
          const decoded = decodeURIComponent(value);
          log(`Found cookie ${name}:`, decoded);
          return decoded;
        }
      }
      log(`Cookie ${name} not found`);
      return null;
    } catch (error) {
      logError('Error reading cookie:', error);
      return null;
    }
  }
  
  // Get user role
  const role = getCookie('user-role');
  const desktopRoles = ['admin', 'system_admin'];
  
  log('User role:', role);
  log('Should force desktop:', role && desktopRoles.includes(role));
  
  // Check if feature is enabled
  const featureEnabled = window.NEXT_PUBLIC_ENABLE_FIXED_UI_MODE === 'true' || 
                         (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ENABLE_FIXED_UI_MODE === 'true');
  
  log('Feature enabled:', featureEnabled);
  
  // If user has a desktop role and feature is enabled, apply AGGRESSIVE desktop enforcement
  if (role && desktopRoles.includes(role)) {
    log('Applying desktop UI enforcement for role:', role);
    
    // 1. Apply classes to html and body IMMEDIATELY
    document.documentElement.classList.add('force-desktop-ui', 'desktop-enforced');
    document.documentElement.setAttribute('data-desktop-mode', 'true');
    document.documentElement.setAttribute('data-user-role', role);
    
    if (document.body) {
      document.body.classList.add('force-desktop-ui', 'desktop-enforced');
      document.body.setAttribute('data-desktop-mode', 'true');
      log('Classes applied to body');
    } else {
      // If body doesn't exist yet, wait for it
      const bodyObserver = new MutationObserver(function(mutations, observer) {
        if (document.body) {
          document.body.classList.add('force-desktop-ui', 'desktop-enforced');
          document.body.setAttribute('data-desktop-mode', 'true');
          log('Classes applied to body (via observer)');
          observer.disconnect();
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    
    // 2. Force viewport meta tag with AGGRESSIVE settings
    function setViewport() {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
        log('Created viewport meta tag');
      }
      
      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth < 768 ||
                       ('ontouchstart' in window) ||
                       (navigator.maxTouchPoints > 0);
      
      log('Is mobile device:', isMobile);
      log('User agent:', navigator.userAgent);
      log('Window width:', window.innerWidth);
      
      if (isMobile) {
        // For mobile devices, use VERY aggressive settings
        const viewportContent = 'width=1536, initial-scale=0.2, minimum-scale=0.1, maximum-scale=10, user-scalable=yes';
        viewport.content = viewportContent;
        viewport.setAttribute('content', viewportContent); // Double set for safety
        log('Mobile viewport set:', viewportContent);
      } else {
        // For desktop devices
        const viewportContent = 'width=1536, initial-scale=1, minimum-scale=0.5, maximum-scale=10, user-scalable=yes';
        viewport.content = viewportContent;
        viewport.setAttribute('content', viewportContent);
        log('Desktop viewport set:', viewportContent);
      }
    }
    
    setViewport();
    
    // 3. Apply inline styles IMMEDIATELY (highest priority)
    function applyInlineStyles() {
      // HTML element
      document.documentElement.style.cssText = `
        min-width: 1536px !important;
        width: auto !important;
        overflow-x: auto !important;
        overflow-y: visible !important;
        position: relative !important;
        height: auto !important;
        transform: none !important;
        -webkit-overflow-scrolling: touch !important;
      `;
      
      // Body element
      if (document.body) {
        document.body.style.cssText = `
          min-width: 1536px !important;
          width: auto !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          position: relative !important;
          height: auto !important;
          transform: none !important;
          -webkit-overflow-scrolling: touch !important;
        `;
        log('Inline styles applied to body');
      }
    }
    
    applyInlineStyles();
    
    // 4. Inject CRITICAL CSS with HIGHEST specificity
    function injectCriticalCSS() {
      const styleId = 'force-desktop-critical-bulletproof';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.setAttribute('data-priority', 'critical');
        style.innerHTML = `
          /* BULLETPROOF DESKTOP ENFORCEMENT - CANNOT BE OVERRIDDEN */
          
          /* Use multiple selectors for maximum specificity */
          html.force-desktop-ui,
          html.desktop-enforced,
          html[data-desktop-mode="true"],
          body.force-desktop-ui,
          body.desktop-enforced,
          body[data-desktop-mode="true"],
          .force-desktop-ui,
          .desktop-enforced {
            min-width: 1536px !important;
            width: auto !important;
            overflow-x: auto !important;
            overflow-y: visible !important;
            position: relative !important;
            height: auto !important;
            transform: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          /* Override ALL media queries - use maximum specificity */
          @media all and (max-width: 99999px) {
            html.force-desktop-ui,
            html.desktop-enforced,
            body.force-desktop-ui,
            body.desktop-enforced {
              min-width: 1536px !important;
              width: auto !important;
              overflow-x: auto !important;
            }
            
            /* Force desktop visibility on ALL elements */
            .force-desktop-ui .lg\\:block,
            .force-desktop-ui .xl\\:block,
            .force-desktop-ui .2xl\\:block,
            .desktop-enforced .lg\\:block,
            .desktop-enforced .xl\\:block,
            .desktop-enforced .2xl\\:block { 
              display: block !important; 
            }
            
            .force-desktop-ui .lg\\:flex,
            .force-desktop-ui .xl\\:flex,
            .force-desktop-ui .2xl\\:flex,
            .desktop-enforced .lg\\:flex,
            .desktop-enforced .xl\\:flex,
            .desktop-enforced .2xl\\:flex { 
              display: flex !important; 
            }
            
            .force-desktop-ui .lg\\:inline-block,
            .desktop-enforced .lg\\:inline-block { 
              display: inline-block !important; 
            }
            
            .force-desktop-ui .lg\\:inline-flex,
            .desktop-enforced .lg\\:inline-flex { 
              display: inline-flex !important; 
            }
            
            .force-desktop-ui .lg\\:grid,
            .desktop-enforced .lg\\:grid { 
              display: grid !important; 
            }
            
            /* AGGRESSIVELY hide mobile elements */
            .force-desktop-ui .lg\\:hidden,
            .force-desktop-ui .xl\\:hidden,
            .force-desktop-ui .2xl\\:hidden,
            .force-desktop-ui .block.lg\\:hidden,
            .force-desktop-ui .flex.lg\\:hidden,
            .force-desktop-ui [class*="mobile-only"],
            .force-desktop-ui [class*="mobile-nav"],
            .force-desktop-ui [class*="bottom-navigation"],
            .desktop-enforced .lg\\:hidden,
            .desktop-enforced .xl\\:hidden,
            .desktop-enforced .2xl\\:hidden,
            .desktop-enforced [class*="mobile-only"],
            .desktop-enforced [class*="mobile-nav"],
            .desktop-enforced [class*="bottom-navigation"] { 
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              position: absolute !important;
              left: -9999px !important;
            }
            
            /* Force desktop widths and positions */
            .force-desktop-ui .lg\\:w-72,
            .desktop-enforced .lg\\:w-72 { width: 18rem !important; }
            
            .force-desktop-ui .lg\\:w-64,
            .desktop-enforced .lg\\:w-64 { width: 16rem !important; }
            
            .force-desktop-ui .lg\\:w-16,
            .desktop-enforced .lg\\:w-16 { width: 4rem !important; }
            
            .force-desktop-ui .lg\\:pl-72,
            .desktop-enforced .lg\\:pl-72 { padding-left: 18rem !important; }
            
            .force-desktop-ui .lg\\:pl-64,
            .desktop-enforced .lg\\:pl-64 { padding-left: 16rem !important; }
            
            .force-desktop-ui .lg\\:pl-16,
            .desktop-enforced .lg\\:pl-16 { padding-left: 4rem !important; }
            
            .force-desktop-ui .lg\\:fixed,
            .desktop-enforced .lg\\:fixed { position: fixed !important; }
            
            /* Ensure containers maintain desktop width */
            .force-desktop-ui .container,
            .force-desktop-ui main,
            .force-desktop-ui .main-content,
            .force-desktop-ui [role="main"],
            .force-desktop-ui #__next,
            .desktop-enforced .container,
            .desktop-enforced main,
            .desktop-enforced #__next {
              min-width: 1536px !important;
              width: auto !important;
            }
            
            /* Disable ALL transforms that might be used for mobile animations */
            .force-desktop-ui *,
            .desktop-enforced * {
              transform: none !important;
              transition: none !important;
            }
          }
          
          /* NUCLEAR OPTION: Override everything with !important */
          html.force-desktop-ui *:not(script):not(style),
          body.force-desktop-ui *:not(script):not(style) {
            max-width: none !important;
          }
        `;
        
        // Insert at the VERY END of head for maximum priority
        if (document.head) {
          document.head.appendChild(style);
          log('Critical CSS injected at end of head');
        } else {
          // If head doesn't exist, wait for it
          const headObserver = new MutationObserver(function(mutations, observer) {
            if (document.head) {
              document.head.appendChild(style);
              log('Critical CSS injected (via observer)');
              observer.disconnect();
            }
          });
          headObserver.observe(document.documentElement, { childList: true });
        }
      }
    }
    
    injectCriticalCSS();
    
    // 5. Set up MutationObserver to PREVENT removal of our classes
    function setupClassProtection() {
      const protectedClasses = ['force-desktop-ui', 'desktop-enforced'];
      const protectedAttributes = ['data-desktop-mode', 'data-user-role'];
      
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes') {
            const target = mutation.target;
            
            // Protect class attribute
            if (mutation.attributeName === 'class') {
              protectedClasses.forEach(cls => {
                if (!target.classList.contains(cls) && 
                    (target === document.documentElement || target === document.body)) {
                  target.classList.add(cls);
                  log('Re-added protected class:', cls);
                }
              });
            }
            
            // Protect data attributes
            protectedAttributes.forEach(attr => {
              if (mutation.attributeName === attr && 
                  (target === document.documentElement || target === document.body)) {
                if (attr === 'data-desktop-mode') {
                  target.setAttribute(attr, 'true');
                } else if (attr === 'data-user-role') {
                  target.setAttribute(attr, role);
                }
                log('Re-added protected attribute:', attr);
              }
            });
            
            // Protect viewport meta tag
            if (target.tagName === 'META' && target.getAttribute('name') === 'viewport') {
              setViewport();
              log('Viewport meta tag protected');
            }
          }
        });
      });
      
      // Start observing
      observer.observe(document.documentElement, {
        attributes: true,
        attributeOldValue: true,
        subtree: true
      });
      
      log('Class protection observer set up');
    }
    
    setupClassProtection();
    
    // 6. Re-apply everything after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        log('DOM ready, re-applying all desktop enforcement');
        applyInlineStyles();
        setViewport();
        injectCriticalCSS();
        setupClassProtection();
      });
    }
    
    // 7. Re-apply on window load (after all resources)
    window.addEventListener('load', function() {
      log('Window loaded, final desktop enforcement check');
      applyInlineStyles();
      setViewport();
      
      // Final check for mobile elements that might have appeared
      const mobileElements = document.querySelectorAll('.lg\\:hidden, [class*="mobile-only"], [class*="mobile-nav"]');
      mobileElements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      });
      log('Hidden', mobileElements.length, 'mobile elements');
    });
    
    // 8. Periodic enforcement DISABLED to prevent infinite loops
    // MutationObserver above is sufficient for protection
    log('Periodic enforcement disabled - using MutationObserver only');
    
    log('Desktop UI enforcement complete');
  } else {
    log('Desktop UI not enforced - role:', role, 'feature enabled:', featureEnabled);
  }
})();