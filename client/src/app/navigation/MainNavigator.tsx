// src/app/navigation/MainNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './navigationTypes';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react-native';
import { COLORS } from '../../theme';

// Import Screens
import HomeScreen from '../../features/home/screens/HomeScreen';
import SearchScreen from '../../features/home/screens/SearchScreen';
import PostItemScreen from '../../features/post/screens/PostItemScreen';
import ChatListScreen from '../../features/chat/screens/ChatListScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.06)',
          height: Platform.OS === 'ios' ? 86 : 66,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#1A1D20',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Tìm kiếm',
          tabBarIcon: ({ color }) => <Search size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostItemScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={styles.postFabContainer}>
              <View style={[styles.postFabButton, focused && styles.postFabButtonActive]}>
                <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Tin nhắn',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2.2} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  postFabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -16,
  },
  postFabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  postFabButtonActive: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 1.05 }],
  },
});

export default MainNavigator;
