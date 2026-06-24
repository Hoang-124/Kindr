// @ts-nocheck
// components/WithdrawXuScreen.js - Màn hình 14: Rút Xu
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { withdrawXu } from '../../../app/store/walletSlice';
import { AppContext } from '../../../app/providers/AppProvider';

export default function WithdrawXuScreen({ navigation }: { navigation: any }) {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const wallet = useSelector(s => s.wallet);
  const dispatch = useDispatch();
  const { dispatch: appDispatch } = useContext(AppContext);

  const xuAmount = parseInt(amount) || 0;
  const fee = Math.ceil(xuAmount * 0.1);
  const netXu = xuAmount - fee;
  const netVnd = netXu * 10000;

  const handleWithdraw = () => {
    if (xuAmount <= 0 || xuAmount > wallet.balance) {
      Alert.alert('Ôi không! 🧸', 'Mẹ kiểm tra lại số Xu muốn rút nhé.'); return;
    }
    if (!bankName || !accountNumber) {
      Alert.alert('Thiếu thông tin 🧸', 'Mẹ cần điền thông tin ngân hàng để rút Xu nhé.'); return;
    }
    dispatch(withdrawXu({ amount: xuAmount }));
    
    // Add notification to app state
    appDispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type: 'escrow',
        text: `Yêu cầu rút ${xuAmount} Xu (khấu trừ ${fee} Xu phí dịch vụ) đang được xem xét.`,
        time: 'Vừa xong',
        icon: '💸',
        read: false,
      }
    });

    Alert.alert('Đã gửi yêu cầu! 📨', `Yêu cầu rút ${xuAmount} Xu (Phí ${fee} Xu) đã được gửi và đang chờ duyệt.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Rút Xu</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Xu khả dụng</Text>
          <Text style={styles.balanceAmount}>🪙 {wallet.balance} Xu</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Số Xu muốn rút</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Nhập số Xu" placeholderTextColor="#C4BFB6" />
          </View>

          {xuAmount > 0 && (
            <View style={styles.feeBox}>
              <View style={styles.feeRow}><Text style={styles.feeLabel}>Phí rút (10%)</Text><Text style={styles.feeValue}>- {fee} Xu</Text></View>
              <View style={styles.feeRow}><Text style={styles.feeLabel}>Xu thực nhận</Text><Text style={styles.feeValueGreen}>{netXu} Xu</Text></View>
              <View style={[styles.feeRow, { borderTopWidth: 1, borderTopColor: '#E8E3DB', paddingTop: 8 }]}>
                <Text style={styles.feeLabel}>Số tiền thực nhận</Text>
                <Text style={styles.feeValueBig}>{netVnd.toLocaleString()} VNĐ</Text>
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Tên ngân hàng</Text>
            <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="VD: Vietcombank" placeholderTextColor="#C4BFB6" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Số tài khoản</Text>
            <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="Nhập số tài khoản" placeholderTextColor="#C4BFB6" keyboardType="numeric" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Chủ tài khoản</Text>
            <TextInput style={styles.input} value={accountHolder} onChangeText={setAccountHolder} placeholder="Tên chủ tài khoản" placeholderTextColor="#C4BFB6" />
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteEmoji}>⚠️</Text>
            <Text style={styles.noteText}>
              <Text style={{ fontWeight: '700' }}>Lưu ý: </Text>
              Rút Xu sẽ bị khấu trừ <Text style={{ fontWeight: '700', color: '#D4577A' }}>10% phí rút</Text>. Yêu cầu sẽ được admin kiểm duyệt và chuyển khoản ngân hàng trong vòng 1-3 ngày làm việc.
            </Text>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleWithdraw}>
            <Text style={styles.submitBtnText}>Gửi yêu cầu rút Xu 📨</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  balanceInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16 },
  balanceLabel: { fontSize: 14, color: '#8B7E74', fontWeight: '600' },
  balanceAmount: { fontSize: 18, fontWeight: '800', color: '#8B6914' },
  card: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 24, padding: 22 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#3D3D3D', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#E8E3DB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#3D3D3D', backgroundColor: '#FDFCFA' },
  feeBox: { backgroundColor: '#F5F0E8', borderRadius: 16, padding: 14, marginBottom: 16, gap: 6 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 13, color: '#5D5347' },
  feeValue: { fontSize: 13, fontWeight: '700', color: '#D4577A' },
  feeValueGreen: { fontSize: 14, fontWeight: '700', color: '#5B9A8B' },
  feeValueBig: { fontSize: 16, fontWeight: '800', color: '#3D3D3D' },
  noteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8EB', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#FFE0A3' },
  noteEmoji: { fontSize: 20, marginRight: 10 },
  noteText: { flex: 1, fontSize: 12, color: '#8B6914', lineHeight: 18 },
  submitBtn: { backgroundColor: '#D4577A', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
