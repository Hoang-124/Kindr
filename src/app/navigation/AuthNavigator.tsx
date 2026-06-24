// src/app/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';

import SplashScreen from '../../features/auth/screens/SplashScreen';
import OnboardingScreen1 from '../../features/auth/screens/OnboardingScreen1';
import OnboardingScreen2 from '../../features/auth/screens/OnboardingScreen2';
import OnboardingScreen3 from '../../features/auth/screens/OnboardingScreen3';
import SignInScreen from '../../features/auth/screens/SignInScreen';
import SignUpScreen from '../../features/auth/screens/SignUpScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
      <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
      <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
