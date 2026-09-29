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

  const style = document.createElement('style');
  style.id = 'kindr-web-focus-reset';
  style.textContent = `
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


