// @ts-nocheck
// components/NotificationsScreen.js - Màn hình 19: Thông báo
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';

export default function NotificationsScreen({ navigation }: { navigation: any }) {
  const { state, dispatch } = useContext(AppContext);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {state.notifications.map(notif => (
          <TouchableOpacity key={notif.id} style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
            onPress={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notif.id })}>
            <View style={styles.notifIcon}><Text style={styles.notifIconText}>{notif.icon}</Text></View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifText, !notif.read && styles.notifTextUnread]}>{notif.text}</Text>
              <Text style={styles.notifTime}>{notif.time}</Text>
            </View>
            {!notif.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  notifCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 10 },
  notifCardUnread: { backgroundColor: '#F0FAF7', borderWidth: 1.5, borderColor: '#A3D5C6' },
  notifIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifIconText: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifText: { fontSize: 13, color: '#5D5347', lineHeight: 20 },
  notifTextUnread: { fontWeight: '700', color: '#3D3D3D' },
  notifTime: { fontSize: 11, color: '#8B7E74', marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B9A8B' },
});
