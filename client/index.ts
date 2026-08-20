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

import App from './App';

registerRootComponent(App);


