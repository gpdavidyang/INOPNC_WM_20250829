/**
 * Force Desktop UI Initialization Script
 * This runs IMMEDIATELY before any React hydration to prevent FOUC
 */
(function() {
  'use strict';
  
  // Check if feature is enabled
  if (typeof window === 'undefined') return;
  
  // Get role from cookie
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  
  const role = getCookie('user-role');
  const desktopRoles = ['admin', 'system_admin'];
  
  // If user has a desktop role, apply classes IMMEDIATELY
  if (role && desktopRoles.includes(role)) {
    // Apply classes to html and body
    document.documentElement.classList.add('force-desktop-ui');
    if (document.body) {
      document.body.classList.add('force-desktop-ui');
    }
    
    // Force viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth < 768;
    
    if (isMobile) {
      // For mobile devices, set very small scale to show full desktop
      viewport.content = 'width=1536, initial-scale=0.25, minimum-scale=0.1, maximum-scale=10, user-scalable=yes';
    } else {
      // For desktop devices
      viewport.content = 'width=1536, initial-scale=1, minimum-scale=0.5, maximum-scale=10, user-scalable=yes';
    }
    
    // Apply inline styles immediately
    document.documentElement.style.minWidth = '1536px';
    document.documentElement.style.overflow = 'auto';
    if (document.body) {
      document.body.style.minWidth = '1536px';
      document.body.style.overflow = 'auto';
      document.body.style.position = 'relative';
      document.body.style.height = 'auto';
    }
  }
})();