import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text, Button, IconButton, Menu } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppTextInput from '../../components/AppTextInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../../api/client';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';

const SLOTS = ['08:00 – 10:00', '10:00 – 12:00', '12:00 – 14:00', '14:00 – 16:00', '16:00 – 18:00', '18:00 – 20:00'];
const NAVY = '#0E2346';
const GOLD = '#B08D2C';

// Mirrors the web app's create_order usage-tracking so the total shown here
// matches what the server will actually bill.
function withPlanSplit(lines, planState) {
  const membership = planState?.membership;
  if (!membership) return lines.map((l) => ({ ...l, freeQty: 0, extraQty: l.quantity }));
  const planItemIds = planState.planItemIds || [];
  const bookingsRemaining = Math.max(0, (membership.bookings_allowed || 0) - (membership.bookings_used || 0));
  let itemsRemaining = bookingsRemaining > 0 ? Math.max(0, (membership.items_allowed || 0) - (membership.items_used || 0)) : 0;
  return lines.map((l) => {
    if (!planItemIds.includes(l.id) || itemsRemaining <= 0) return { ...l, freeQty: 0, extraQty: l.quantity };
    const freeQty = Math.min(l.quantity, itemsRemaining);
    itemsRemaining -= freeQty;
    return { ...l, freeQty, extraQty: l.quantity - freeQty };
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function CartLines({ splitLines, changeQty, removeLine }) {
  return splitLines.map((l) => (
    <View key={`${l.id}-${l.serviceKey}`} style={styles.lineRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.navyBold}>{l.name}</Text>
        {l.freeQty > 0 ? (
          <Text style={styles.freeText}>{l.serviceLabel} · {l.freeQty} FREE{l.extraQty > 0 ? ` + ${l.extraQty} x ${l.price} QAR` : ' (plan)'}</Text>
        ) : (
          <Text style={styles.dim}>{l.serviceLabel} · {l.price} QAR</Text>
        )}
      </View>
      <View style={styles.rowGap}>
        <IconButton icon="minus" size={16} mode="contained-tonal" onPress={() => changeQty(l.id, l.serviceKey, -1)} />
        <Text style={styles.navyBold}>{l.quantity}</Text>
        <IconButton icon="plus" size={16} mode="contained-tonal" onPress={() => changeQty(l.id, l.serviceKey, 1)} />
        <IconButton icon="trash-can-outline" size={16} onPress={() => removeLine(l.id, l.serviceKey)} />
      </View>
    </View>
  ));
}

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoadingAuth, profile } = useAuth();
  const { lines, planState, changeQty, removeLine, clear } = useCart();
  const [placed, setPlaced] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ pickup_type: 'pickup', pickup_date: '', pickup_slot: SLOTS[0], customer_name: '', customer_phone: '', address: '', notes: '' });
  const [addresses, setAddresses] = useState([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address_text: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slotMenuOpen, setSlotMenuOpen] = useState(false);
  const [addrMenuOpen, setAddrMenuOpen] = useState(false);

  const splitLines = useMemo(() => withPlanSplit(lines, planState), [lines, planState]);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const billedTotal = splitLines.reduce((s, l) => s + l.extraQty * l.price, 0);
  const planSavings = total - billedTotal;
  const membership = planState?.membership;
  const isPastDate = form.pickup_date && form.pickup_date < todayISO();

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({ ...f, customer_name: f.customer_name || profile.full_name || '', customer_phone: f.customer_phone || profile.phone || '' }));
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.entities.Address.list('-is_default').then((rows) => {
      setAddresses(rows);
      if (rows.length) {
        setForm((f) => ({ ...f, address: rows[0].address_text }));
      } else {
        setAddingAddress(true);
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectAddress = (addr) => {
    setAddrMenuOpen(false);
    setAddingAddress(false);
    update('address', addr.address_text);
  };

  const saveNewAddress = async () => {
    if (!newAddress.address_text.trim()) return;
    const created = await api.entities.Address.create({
      label: newAddress.label || null,
      address_text: newAddress.address_text,
      is_default: addresses.length === 0,
    });
    setAddresses((prev) => [created, ...prev]);
    update('address', created.address_text);
    setAddingAddress(false);
    setNewAddress({ label: '', address_text: '' });
  };

  const submit = async () => {
    if (!form.customer_name || !form.customer_phone || isPastDate) return;
    setSubmitting(true);
    try {
      const orderItems = lines.map((l) => ({ item_id: l.id, name: l.name, category: l.category, service: l.serviceLabel, quantity: l.quantity, price: l.price }));
      const code = 'T2-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const created = await api.entities.Order.create({
        order_code: code,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: '',
        address: form.address,
        pickup_type: form.pickup_type,
        pickup_date: form.pickup_date,
        pickup_slot: form.pickup_slot,
        items: orderItems,
        total: billedTotal,
        status: 'pending',
        payment_status: 'unpaid',
        notes: form.notes,
      });
      setPlaced({ code, id: created.id });
      clear();
    } catch {
      setPlaced({ code: 'ERROR' });
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <View style={styles.placedBox}>
        <Text variant="headlineSmall" style={styles.navy}>{placed.code === 'ERROR' ? 'Something went wrong' : 'Order placed!'}</Text>
        {placed.code !== 'ERROR' && (
          <>
            <Text style={styles.dim}>Your order code</Text>
            <Text style={styles.orderCode}>{placed.code}</Text>
            <Text style={[styles.dim, { textAlign: 'center', marginTop: 8 }]}>We'll send confirmation shortly. Track your garment's journey anytime.</Text>
            <Button mode="outlined" style={{ marginTop: 16 }} onPress={() => navigation.navigate('Track')}>Track My Order</Button>
          </>
        )}
        <Button mode="contained" style={{ marginTop: 12 }} onPress={() => { setPlaced(null); navigation.navigate('Services'); }}>
          {placed.code === 'ERROR' ? 'Back to cart' : 'Place another order'}
        </Button>
      </View>
    );
  }

  if (!lines.length) {
    return (
      <View style={styles.placedBox}>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
        <Button mode="contained" style={{ marginTop: 16 }} onPress={() => navigation.navigate('Services')}>Browse services</Button>
      </View>
    );
  }

  // Ordering requires an account (so the order, addresses and plan usage all
  // attach to one profile) — show what's in the cart plus a login/signup
  // prompt instead of the checkout form until that's true.
  if (!isLoadingAuth && !isAuthenticated) {
    return (
      <View style={styles.flex}>
        <View style={styles.content}>
          <CartLines splitLines={splitLines} changeQty={changeQty} removeLine={removeLine} />
        </View>
        <View style={styles.loginGate}>
          <Text variant="titleMedium" style={styles.navy}>Log in to place your order</Text>
          <Text style={[styles.dim, { textAlign: 'center', marginTop: 4 }]}>Your cart is saved — log in or create an account to check out.</Text>
          <Button mode="contained" style={{ marginTop: 16, width: '100%' }} onPress={() => navigation.navigate('Login', { next: 'Cart' })}>Log In</Button>
          <Button mode="text" onPress={() => navigation.navigate('Signup', { next: 'Cart' })}>Create an account</Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={{ ...styles.content, paddingBottom: 24 + insets.bottom }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
      keyboardOpeningTime={0}>
      <CartLines splitLines={splitLines} changeQty={changeQty} removeLine={removeLine} />

      <View style={styles.formSection}>
        {membership && (
          <Text style={styles.membershipNote}>
            {membership.bookings_used}/{membership.bookings_allowed} bookings · {membership.items_used}/{membership.items_allowed} items used this month
          </Text>
        )}

        <View style={styles.row}>
          <Text style={styles.dim}>Subtotal</Text>
          <Text style={styles.navyBold}>{total} QAR</Text>
        </View>
        {planSavings > 0 && (
          <View style={styles.row}>
            <Text style={styles.savingsText}>Plan savings</Text>
            <Text style={styles.savingsText}>-{planSavings} QAR</Text>
          </View>
        )}

        <View style={styles.rowGap}>
          <Button mode={form.pickup_type === 'pickup' ? 'contained' : 'outlined'} onPress={() => update('pickup_type', 'pickup')} style={{ flex: 1 }}>Pickup</Button>
          <Button mode={form.pickup_type === 'drop' ? 'contained' : 'outlined'} onPress={() => update('pickup_type', 'drop')} style={{ flex: 1 }}>Drop at shop</Button>
        </View>

        <Pressable onPress={() => setShowDatePicker(true)}>
          <AppTextInput label="Delivery date" value={form.pickup_date} editable={false} mode="outlined" right={<AppTextInput.Icon icon="calendar" />} style={styles.input} />
        </Pressable>
        {isPastDate && <Text style={styles.error}>Pick today or a future date.</Text>}
        {showDatePicker && (
          <DateTimePicker
            value={form.pickup_date ? new Date(form.pickup_date) : new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) update('pickup_date', date.toISOString().slice(0, 10));
            }}
          />
        )}

        <Menu
          visible={slotMenuOpen}
          onDismiss={() => setSlotMenuOpen(false)}
          anchor={
            <Pressable onPress={() => setSlotMenuOpen(true)}>
              <AppTextInput label="Slot" value={form.pickup_slot} editable={false} mode="outlined" right={<AppTextInput.Icon icon="clock-outline" />} style={styles.input} />
            </Pressable>
          }>
          {SLOTS.map((s) => <Menu.Item key={s} title={s} onPress={() => { update('pickup_slot', s); setSlotMenuOpen(false); }} />)}
        </Menu>

        <AppTextInput label="Full name" value={form.customer_name} onChangeText={(t) => update('customer_name', t)} mode="outlined" style={styles.input} />
        <AppTextInput label="Phone number" value={form.customer_phone} onChangeText={(t) => update('customer_phone', t)} keyboardType="phone-pad" mode="outlined" style={styles.input} />

        {form.pickup_type === 'pickup' && (
          <View>
            {addresses.length > 0 && !addingAddress && (
              <Menu
                visible={addrMenuOpen}
                onDismiss={() => setAddrMenuOpen(false)}
                anchor={
                  <Pressable onPress={() => setAddrMenuOpen(true)}>
                    <AppTextInput label="Address" value={form.address} editable={false} multiline numberOfLines={2} mode="outlined" style={styles.input} />
                  </Pressable>
                }>
                {addresses.map((a) => (
                  <Menu.Item key={a.id} title={`${a.label ? a.label + ' — ' : ''}${a.address_text.slice(0, 40)}${a.is_default ? ' (default)' : ''}`} onPress={() => selectAddress(a)} />
                ))}
                <Menu.Item title="+ Add new address" onPress={() => { setAddrMenuOpen(false); setAddingAddress(true); }} />
              </Menu>
            )}
            {(addingAddress || addresses.length === 0) && (
              <View style={styles.dashedBox}>
                <AppTextInput label="Label (e.g. Home, Office)" value={newAddress.label} onChangeText={(t) => setNewAddress((f) => ({ ...f, label: t }))} mode="outlined" style={styles.input} />
                <AppTextInput label="Full address" value={newAddress.address_text} onChangeText={(t) => setNewAddress((f) => ({ ...f, address_text: t }))} multiline numberOfLines={2} mode="outlined" style={styles.input} />
                <View style={styles.rowGap}>
                  <Button mode="contained" onPress={saveNewAddress} style={{ flex: 1 }}>Save & use</Button>
                  {addresses.length > 0 && <Button mode="outlined" onPress={() => setAddingAddress(false)}>Cancel</Button>}
                </View>
              </View>
            )}
          </View>
        )}
        <AppTextInput label="Notes (optional)" value={form.notes} onChangeText={(t) => update('notes', t)} multiline numberOfLines={2} mode="outlined" style={styles.input} />
      </View>

      <View style={styles.footer}>
        <View style={styles.row}>
          <Text style={styles.navyBold}>Total</Text>
          <Text style={styles.totalText}>{billedTotal} QAR</Text>
        </View>
        <Button
          mode="contained"
          onPress={submit}
          loading={submitting}
          disabled={submitting || !form.customer_name || !form.customer_phone || isPastDate}
          style={{ marginTop: 8 }}>
          {submitting ? 'Placing order…' : `Confirm Order · ${billedTotal} QAR`}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 24 },
  navy: { color: NAVY, fontWeight: '700' },
  navyBold: { color: NAVY, fontWeight: '600' },
  dim: { color: '#64748b', fontSize: 12 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 15 },
  lineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 10, marginBottom: 8 },
  freeText: { color: '#059669', fontSize: 11, fontWeight: '600', marginTop: 2 },
  formSection: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 8 },
  membershipNote: { backgroundColor: '#d1fae5', color: '#047857', fontSize: 11, borderRadius: 10, padding: 10 },
  savingsText: { color: '#059669', fontWeight: '600', fontSize: 12 },
  input: { marginTop: 10, backgroundColor: '#fff' },
  error: { color: '#dc2626', fontSize: 11, marginTop: 4 },
  dashedBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 12, padding: 10, marginTop: 10 },
  footer: { borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16 },
  totalText: { fontSize: 20, fontWeight: '700', color: GOLD },
  placedBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  orderCode: { fontSize: 28, fontWeight: '700', color: GOLD, marginTop: 4, letterSpacing: 1 },
  loginGate: { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
});
