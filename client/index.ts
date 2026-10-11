import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';
import { triggerCustomAlert } from './src/components/common/CustomAlert';

// Custom Polyfill for Alert.alert to render beautiful inside-app Modals
(Alert as any).alert = (title: string, message?: string, buttons?: any[]) => {
  triggerCustomAlert({
    title,
    message,
    buttons: buttons?.map(btn => ({
      text: btn.text,
      onPress: btn.onPress,
      style: btn.style,
    })),
  });
};

// Web global CSS reset to eliminate default browser focus rings (yellow/blue boxes) on inputs
if (typeof document !== 'undefined') {
  // Fix Google User Content (lh3.googleusercontent.com) 403 Forbidden / ORB block on web
  if (!document.querySelector('meta[name="referrer"]')) {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.appendChild(meta);
  }

  // Preconnect and inject Google Font Plus Jakarta Sans with full Vietnamese diacritics support
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap';
    document.head.appendChild(fontLink);
  }

  const style = document.createElement('style');
  style.id = 'kindr-web-focus-reset';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap');

    html, body, #root, div, span, p, a, input, textarea, select, button {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }

    input, textarea, select, [contenteditable] {
      outline: none !important;
      outline-width: 0 !important;
      outline-style: none !important;
      box-shadow: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    input:focus, textarea:focus, select:focus, [contenteditable]:focus {
      outline: none !important;
      outline-width: 0 !important;
      outline-style: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
}

import App from './App';

registerRootComponent(App);


