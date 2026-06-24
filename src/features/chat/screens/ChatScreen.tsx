// @ts-nocheck
// components/ChatScreen.js - Màn hình 18: Chat
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const quickMessages = ['Mẹ còn món này không ạ?', 'Mình hẹn ở đâu tiện nhất?', 'Món đồ đã được vệ sinh chưa ạ?'];

const initialMessages = [
  { id: '1', sender: 'other', text: 'Chào mẹ! Món xe đẩy Combi vẫn còn nha. Mình dùng khoảng 6 tháng thôi, còn rất mới ạ 🧸', time: '10:30' },
  { id: '2', sender: 'me', text: 'Dạ cảm ơn mẹ! Mình xem được ở đâu ạ?', time: '10:32' },
  { id: '3', sender: 'other', text: 'Mình ở Quận 7 ạ. Mẹ tiện ghé nhà mình xem trực tiếp được không? Chiều nay mình rảnh ạ 😊', time: '10:35' },
  { id: '4', sender: 'me', text: 'Vâng mẹ ơi! Chiều nay 4h mình qua được không ạ?', time: '10:37' },
];

export default function ChatScreen({ navigation, route }: { navigation: any, route: any }) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const item = route?.params?.item || { title: 'Xe đẩy Combi', seller: { name: 'Mẹ Bống' } };

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'me', text: text.trim(), time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>{item.seller?.avatar || 'B'}</Text></View>
          <View>
            <Text style={styles.headerName}>{item.seller?.name || 'Mẹ Bống'}</Text>
            <Text style={styles.headerItem}>📦 {item.title}</Text>
          </View>
        </View>
        <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color="#8B7E74" /></TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item: msg }) => (
          <View style={[styles.messageBubbleRow, msg.sender === 'me' && styles.messageBubbleRowMe]}>
            <View style={[styles.messageBubble, msg.sender === 'me' ? styles.messageBubbleMe : styles.messageBubbleOther]}>
              <Text style={[styles.messageText, msg.sender === 'me' && styles.messageTextMe]}>{msg.text}</Text>
              <Text style={[styles.messageTime, msg.sender === 'me' && styles.messageTimeMe]}>{msg.time}</Text>
            </View>
          </View>
        )}
      />

      {/* Quick messages */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
        {quickMessages.map((qm, i) => (
          <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => sendMessage(qm)}>
            <Text style={styles.quickBtnText}>{qm}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn}><Ionicons name="image-outline" size={22} color="#A3D5C6" /></TouchableOpacity>
        <TextInput style={styles.textInput} placeholder="Nhắn tin cho mẹ..." placeholderTextColor="#C4BFB6" value={inputText} onChangeText={setInputText} multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(inputText)}>
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E8E3DB' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A3D5C6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerAvatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerName: { fontSize: 15, fontWeight: '700', color: '#3D3D3D' },
  headerItem: { fontSize: 11, color: '#8B7E74', marginTop: 2 },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubbleRow: { marginBottom: 10, alignItems: 'flex-start' },
  messageBubbleRowMe: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '80%', borderRadius: 20, padding: 14 },
  messageBubbleOther: { backgroundColor: '#ffffff', borderBottomLeftRadius: 6 },
  messageBubbleMe: { backgroundColor: '#5B9A8B', borderBottomRightRadius: 6 },
  messageText: { fontSize: 14, color: '#3D3D3D', lineHeight: 20 },
  messageTextMe: { color: '#ffffff' },
  messageTime: { fontSize: 10, color: '#8B7E74', marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMe: { color: 'rgba(255,255,255,0.7)' },
  quickScroll: { paddingHorizontal: 16, paddingVertical: 8 },
  quickBtn: { backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#E8E3DB' },
  quickBtnText: { fontSize: 12, color: '#5B9A8B', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E8E3DB', gap: 8 },
  attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: '#F5F0E8', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#3D3D3D', maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#5B9A8B', justifyContent: 'center', alignItems: 'center' },
});
