import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { Text, Button, IconButton, Icon } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, parseISO } from 'date-fns';
import AppTextInput from '../../components/AppTextInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../../api/client';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';
import { goToTab } from '../../navigation/goToTab';
import { EmptyState, IconTile, SurfaceCard, uiStyles } from '../../components/ui';
import { formatDate, toISODate } from '../../lib/date';
import { colors, radius, shadow, spacing, type } from '../../theme/tokens';

// `label` is what gets stored as the order's pickup_slot; start/end are the
// slot's hours, used to grey out slots that are already over today.
const SLOTS = [8, 10, 12, 14, 16, 18].map((start) => ({
  start,
  end: start + 2,
  label: `${String(start).padStart(2, '0')}:00 – ${String(start + 2).padStart(2, '0')}:00`,
}));

// A slot is over once its end time has passed — only possible for today.
// The slot running right now stays open (and is the one preselected).
function isSlotOver(slot, dateISO, now) {
  return dateISO === toISODate(now) && now.getHours() * 60 + now.getMinutes() >= slot.end * 60;
}

// Earliest slot still open on that date: the one running right now (or the
// next one) for today, the first slot of the day for any later date.
function firstOpenSlot(dateISO, now) {
  return SLOTS.find((slot) => !isSlotOver(slot, dateISO, now)) || null;
}

// Prefill: today with its current slot, or tomorrow once today's last slot
// is over.
function initialSchedule(now) {
  const today = toISODate(now);
  const slot = firstOpenSlot(today, now);
  return slot ? { date: today, slot: slot.label } : { date: toISODate(addDays(now, 1)), slot: SLOTS[0].label };
}

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

function CartLines({ splitLines, changeQty, removeLine }) {
  return splitLines.map((l, i) => (
    <View key={`${l.id}-${l.serviceKey}`} style={[styles.lineRow, i > 0 && styles.lineDivider]}>
      <IconTile icon="tshirt-crew-outline" size={40} tone="navy" />
      <View style={styles.flex}>
        <Text style={styles.lineName} numberOfLines={1}>{l.name}</Text>
        {l.freeQty > 0 ? (
          <Text style={styles.freeText}>{l.serviceLabel} · {l.freeQty} FREE{l.extraQty > 0 ? ` + ${l.extraQty} x ${l.price} QAR` : ' (plan)'}</Text>
        ) : (
          <Text style={styles.dim}>{l.serviceLabel} · {l.price} QAR</Text>
        )}
      </View>
      <View style={styles.stepper}>
        <IconButton icon="minus" size={14} iconColor={colors.navy} style={styles.stepBtn} onPress={() => changeQty(l.id, l.serviceKey, -1)} accessibilityLabel={`Remove one ${l.name}`} />
        <Text style={styles.stepValue}>{l.quantity}</Text>
        <IconButton icon="plus" size={14} iconColor={colors.navy} style={styles.stepBtn} onPress={() => changeQty(l.id, l.serviceKey, 1)} accessibilityLabel={`Add one ${l.name}`} />
      </View>
      <IconButton icon="trash-can-outline" size={18} iconColor={colors.error} style={styles.trash} onPress={() => removeLine(l.id, l.serviceKey)} accessibilityLabel={`Remove ${l.name}`} />
    </View>
  ));
}

function StepHeader({ icon, title }) {
  return (
    <View style={styles.stepHeader}>
      <IconTile icon={icon} size={32} />
      <Text style={type.h3}>{title}</Text>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoadingAuth, profile } = useAuth();
  const { lines, planState, changeQty, removeLine, clear } = useCart();
  const [placed, setPlaced] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => {
    const schedule = initialSchedule(new Date());
    return { pickup_type: 'pickup', pickup_date: schedule.date, pickup_slot: schedule.slot, customer_name: '', customer_phone: '', address: '', notes: '' };
  });
  const [addresses, setAddresses] = useState([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address_text: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Re-evaluated every minute so a slot that ends while the customer is
  // filling the form greys out (and the selection moves on) without a reload.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const splitLines = useMemo(() => withPlanSplit(lines, planState), [lines, planState]);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const billedTotal = splitLines.reduce((s, l) => s + l.extraQty * l.price, 0);
  const planSavings = total - billedTotal;
  const membership = planState?.membership;
  const todayISO = toISODate(now);
  const isPastDate = form.pickup_date && form.pickup_date < todayISO;
  // Once today's last slot is over, the earliest bookable date is tomorrow.
  const minDate = firstOpenSlot(todayISO, now) ? now : addDays(now, 1);
  const selectedSlot = SLOTS.find((s) => s.label === form.pickup_slot);
  const slotOver = !selectedSlot || isSlotOver(selectedSlot, form.pickup_date, now);

  // Keep the selected slot bookable: switching back to today (or the clock
  // passing the slot's end) moves it to the slot running now / the next one.
  useEffect(() => {
    if (!slotOver) return;
    const next = firstOpenSlot(form.pickup_date, now);
    if (next) setForm((f) => ({ ...f, pickup_slot: next.label }));
  }, [slotOver, form.pickup_date, now]);

  // First unmet checkout requirement, or null when the order can be placed.
  // Drives both the Confirm button's enabled state and the hint above it,
  // so the customer always sees why it's disabled. pickup_date is required
  // because create_order takes a `date` — an empty string fails server-side.
  const needsAddress = form.pickup_type === 'pickup';
  const blocker = !form.pickup_date
    ? 'Select a delivery date'
    : isPastDate
      ? 'Pick today or a future date'
      : slotOver
        ? 'Pick another date — no time slots left today'
        : !form.customer_name.trim()
          ? 'Enter your full name'
          : !form.customer_phone.trim()
            ? 'Enter your phone number'
            : needsAddress && !form.address.trim()
              ? 'Save a pickup address'
              : null;

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
    if (blocker || submitting) return;
    setSubmitting(true);
    try {
      const orderItems = lines.map((l) => ({ item_id: l.id, name: l.name, category: l.category, service: l.serviceLabel, quantity: l.quantity, price: l.price }));
      const code = 'T2-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const created = await api.entities.Order.create({
        order_code: code,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: '',
        address: needsAddress ? form.address : '',
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
    } catch (e) {
      // Keep the server's reason — a bare "Something went wrong" hid every
      // checkout failure until now.
      setPlaced({ code: 'ERROR', message: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    const failed = placed.code === 'ERROR';
    return (
      <View style={styles.centerScreen}>
        <EmptyState
          icon={failed ? 'alert-circle-outline' : 'check-circle-outline'}
          title={failed ? 'Something went wrong' : 'Order placed!'}
          message={failed
            ? `Your order was not placed${placed.message ? `: ${placed.message}` : '.'} Your cart is saved — please try again.`
            : "We'll send confirmation shortly. Track your garment's journey anytime."}>
          {!failed && (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your order code</Text>
              <Text style={styles.orderCode} selectable>{placed.code}</Text>
            </View>
          )}
          <View style={styles.placedActions}>
            {!failed && (
              <Button mode="outlined" icon="map-marker-path" style={[uiStyles.btn, styles.outlinedBtn]} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => goToTab(navigation, 'Track', { code: placed.code })}>
                Track My Order
              </Button>
            )}
            <Button mode="contained" style={uiStyles.btn} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => { setPlaced(null); if (!failed) goToTab(navigation, 'Services'); }}>
              {failed ? 'Back to cart' : 'Place another order'}
            </Button>
          </View>
        </EmptyState>
      </View>
    );
  }

  if (!lines.length) {
    return (
      <View style={styles.centerScreen}>
        <EmptyState icon="basket-outline" title="Your cart is empty." message="Add items from our services to schedule a pickup.">
          <Button mode="contained" icon="washing-machine" style={[uiStyles.btn, styles.emptyBtn]} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => goToTab(navigation, 'Services')}>
            Browse services
          </Button>
        </EmptyState>
      </View>
    );
  }

  // Ordering requires an account (so the order, addresses and plan usage all
  // attach to one profile) — show what's in the cart plus a login/signup
  // prompt instead of the checkout form until that's true.
  if (!isLoadingAuth && !isAuthenticated) {
    return (
      <View style={uiStyles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <SurfaceCard>
            <StepHeader icon="basket-outline" title="Your items" />
            <CartLines splitLines={splitLines} changeQty={changeQty} removeLine={removeLine} />
          </SurfaceCard>
        </ScrollView>
        <View style={[styles.loginGate, { paddingBottom: spacing.xxl + insets.bottom }]}>
          <IconTile icon="account-lock-outline" size={48} tone="navy" />
          <Text style={[type.h2, styles.gateTitle]}>Log in to place your order</Text>
          <Text style={[type.small, styles.centerText]}>Your cart is saved — log in or create an account to check out.</Text>
          <Button mode="contained" style={[uiStyles.btn, styles.gateBtn]} contentStyle={uiStyles.btnContent} labelStyle={uiStyles.btnLabel} onPress={() => navigation.navigate('Login', { next: 'Cart' })}>
            Log In
          </Button>
          <Button mode="text" textColor={colors.cyanDark} onPress={() => navigation.navigate('Signup', { next: 'Cart' })}>Create an account</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={uiStyles.screen}>
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        keyboardOpeningTime={0}>
        <SurfaceCard>
          <StepHeader icon="basket-outline" title="Your items" />
          <CartLines splitLines={splitLines} changeQty={changeQty} removeLine={removeLine} />
          {membership && (
            <View style={styles.membershipNote}>
              <Icon source="crown" size={14} color={colors.success} />
              <Text style={styles.membershipText}>
                {membership.bookings_used}/{membership.bookings_allowed} bookings · {membership.items_used}/{membership.items_allowed} items used this month
              </Text>
            </View>
          )}
        </SurfaceCard>

        <SurfaceCard style={styles.section}>
          <StepHeader icon="calendar-clock" title="Pickup schedule" />

          <View style={styles.segment}>
            {[
              { key: 'pickup', label: 'Pickup', icon: 'truck-outline' },
              { key: 'drop', label: 'Drop at shop', icon: 'storefront-outline' },
            ].map((opt) => {
              const active = form.pickup_type === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => update('pickup_type', opt.key)}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  accessibilityRole="button"
                  accessibilityState={active ? { selected: true } : {}}>
                  <Icon source={opt.icon} size={18} color={active ? '#fff' : colors.textMuted} />
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* pointerEvents="none": a TextInput claims the touch responder even
              when not editable, so without it taps never reached this
              Pressable and the picker didn't open — leaving pickup_date empty. */}
          <Pressable onPress={() => setShowDatePicker((v) => !v)} accessibilityRole="button" accessibilityLabel="Select delivery date">
            <View pointerEvents="none">
              <AppTextInput label="Delivery date" value={formatDate(form.pickup_date)} editable={false} placeholder="Select a date" left={<AppTextInput.Icon icon="calendar" />} style={styles.input} />
            </View>
          </Pressable>
          {isPastDate && <Text style={styles.error}>Pick today or a future date.</Text>}
          {showDatePicker && (
            <DateTimePicker
              value={form.pickup_date ? parseISO(form.pickup_date) : minDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              accentColor={colors.cyanDark}
              minimumDate={minDate}
              onValueChange={(_, date) => {
                setShowDatePicker(false);
                update('pickup_date', toISODate(date));
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}

          <Text style={styles.fieldLabel}>Time slot</Text>
          <View style={styles.slotGrid}>
            {SLOTS.map((slot) => {
              const active = form.pickup_slot === slot.label;
              const over = isSlotOver(slot, form.pickup_date, now);
              return (
                <Pressable
                  key={slot.label}
                  onPress={() => update('pickup_slot', slot.label)}
                  disabled={over}
                  style={[styles.slot, active && styles.slotActive, over && styles.slotOver]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: over }}>
                  <Text style={[styles.slotText, active && styles.slotTextActive, over && styles.slotTextOver]}>{slot.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.section}>
          <StepHeader icon="account-outline" title="Contact details" />
          <AppTextInput label="Full name" value={form.customer_name} onChangeText={(t) => update('customer_name', t)} left={<AppTextInput.Icon icon="account-outline" />} style={styles.input} />
          <AppTextInput label="Phone number" value={form.customer_phone} onChangeText={(t) => update('customer_phone', t)} keyboardType="phone-pad" left={<AppTextInput.Icon icon="phone-outline" />} style={styles.input} />
        </SurfaceCard>

        {form.pickup_type === 'pickup' && (
          <SurfaceCard style={styles.section}>
            <StepHeader icon="map-marker-outline" title="Pickup address" />
            {addresses.length > 0 && !addingAddress && (
              <View style={styles.addrList}>
                {addresses.map((a) => {
                  const active = form.address === a.address_text;
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => selectAddress(a)}
                      style={[styles.addrCard, active && styles.addrCardActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}>
                      <Icon source={active ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={active ? colors.cyanDark : colors.textFaint} />
                      <View style={styles.flex}>
                        <View style={styles.addrHead}>
                          <Text style={styles.addrLabel}>{a.label || 'Address'}</Text>
                          {a.is_default && <Text style={styles.defaultTag}>Default</Text>}
                        </View>
                        <Text style={styles.dim} numberOfLines={2}>{a.address_text}</Text>
                      </View>
                    </Pressable>
                  );
                })}
                <Button mode="text" icon="plus" textColor={colors.cyanDark} style={styles.addAddrBtn} onPress={() => setAddingAddress(true)}>
                  Add new address
                </Button>
              </View>
            )}
            {(addingAddress || addresses.length === 0) && (
              <View style={styles.dashedBox}>
                <AppTextInput label="Label (e.g. Home, Office)" value={newAddress.label} onChangeText={(t) => setNewAddress((f) => ({ ...f, label: t }))} left={<AppTextInput.Icon icon="tag-outline" />} style={styles.input} />
                <AppTextInput label="Full address" value={newAddress.address_text} onChangeText={(t) => setNewAddress((f) => ({ ...f, address_text: t }))} multiline numberOfLines={2} left={<AppTextInput.Icon icon="map-marker-outline" />} style={styles.input} />
                <View style={styles.rowGap}>
                  <Button mode="contained" onPress={saveNewAddress} style={[uiStyles.btn, styles.flex]}>Save & use</Button>
                  {addresses.length > 0 && <Button mode="outlined" style={uiStyles.btn} onPress={() => setAddingAddress(false)}>Cancel</Button>}
                </View>
              </View>
            )}
          </SurfaceCard>
        )}

        <SurfaceCard style={styles.section}>
          <StepHeader icon="note-text-outline" title="Notes" />
          <AppTextInput label="Notes (optional)" value={form.notes} onChangeText={(t) => update('notes', t)} multiline numberOfLines={2} style={styles.input} />
        </SurfaceCard>

        <SurfaceCard style={styles.section}>
          <StepHeader icon="receipt" title="Order summary" />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryDim}>Subtotal</Text>
            <Text style={styles.summaryValue}>{total} QAR</Text>
          </View>
          {planSavings > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.savingsText}>Plan savings</Text>
              <Text style={styles.savingsText}>-{planSavings} QAR</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>{billedTotal} QAR</Text>
          </View>
        </SurfaceCard>
      </KeyboardAwareScrollView>

      {/* Always pinned so the total and Confirm button are one tap away,
          however far down the checkout form the customer has scrolled. The
          button only toggles enabled/disabled; the hint says what's missing. */}
      <View style={[styles.checkoutBar, { paddingBottom: spacing.md + insets.bottom }]}>
        {!!blocker && (
          <View style={styles.barHint}>
            <Icon source="information-outline" size={14} color={colors.gold} />
            <Text style={styles.barHintText}>{blocker} to confirm your order</Text>
          </View>
        )}
        <View style={styles.barRow}>
          <View>
            <Text style={styles.barLabel}>Total</Text>
            <Text style={styles.totalText}>{billedTotal} QAR</Text>
          </View>
          <Button
            mode="contained"
            icon="check-circle-outline"
            onPress={submit}
            loading={submitting}
            disabled={!!blocker || submitting}
            buttonColor={colors.cyan}
            textColor={colors.navy}
            theme={CONFIRM_DISABLED_THEME}
            style={[uiStyles.btn, styles.confirmBtn]}
            contentStyle={uiStyles.btnContent}
            labelStyle={uiStyles.btnLabel}>
            {submitting ? 'Placing order…' : 'Confirm Order'}
          </Button>
        </View>
      </View>
    </View>
  );
}

// Paper paints disabled buttons with the theme's near-transparent grey, which
// vanishes against the navy checkout bar — override it so a disabled Confirm
// stays clearly visible, just muted.
const CONFIRM_DISABLED_THEME = {
  colors: { surfaceDisabled: 'rgba(255,255,255,0.18)', onSurfaceDisabled: 'rgba(255,255,255,0.7)' },
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerScreen: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  centerText: { textAlign: 'center', marginTop: 4 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginTop: spacing.md },
  dim: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },

  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  lineDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  lineName: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  freeText: { color: colors.success, fontSize: 12, fontWeight: '700', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  stepBtn: { margin: 0, width: 28, height: 28 },
  stepValue: { color: colors.navy, fontWeight: '800', minWidth: 16, textAlign: 'center' },
  trash: { margin: 0 },
  membershipNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successSoft, borderRadius: radius.md, padding: 10, marginTop: spacing.sm },
  membershipText: { color: colors.success, fontSize: 12, fontWeight: '600', flex: 1 },

  segment: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  segmentItemActive: { backgroundColor: colors.navy },
  segmentText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  segmentTextActive: { color: '#fff' },

  input: { marginTop: 0, marginBottom: spacing.md },
  error: { color: colors.error, fontSize: 12, marginTop: -6, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: { width: '48.5%', flexGrow: 1, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1.2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  slotActive: { borderColor: colors.cyanDark, backgroundColor: colors.cyanSoft },
  slotText: { fontSize: 13, fontWeight: '600', color: colors.textBody },
  slotTextActive: { color: colors.navy, fontWeight: '800' },
  slotOver: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, opacity: 0.55 },
  slotTextOver: { color: colors.textFaint, textDecorationLine: 'line-through' },

  addrList: { gap: spacing.sm },
  addrCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.2, borderColor: colors.border, backgroundColor: colors.surface },
  addrCardActive: { borderColor: colors.cyanDark, backgroundColor: colors.cyanSoft },
  addrHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addrLabel: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  defaultTag: { fontSize: 10, fontWeight: '700', color: colors.success, backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' },
  addAddrBtn: { alignSelf: 'flex-start' },
  dashedBox: { borderWidth: 1.2, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  summaryDim: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  savingsText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.md },
  totalLabel: { color: colors.navy, fontSize: 16, fontWeight: '800' },

  checkoutBar: { backgroundColor: colors.navy, paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, ...shadow.raised },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  barHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  barHintText: { color: colors.gold, fontSize: 12, fontWeight: '600', flex: 1 },
  barLabel: { color: colors.onDarkMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  totalText: { fontSize: 22, fontWeight: '800', color: colors.gold },
  confirmBtn: { flex: 1 },

  codeBox: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, marginTop: spacing.xl },
  codeLabel: { ...type.caption },
  orderCode: { fontSize: 28, fontWeight: '800', color: colors.navy, marginTop: 4, letterSpacing: 1.5 },
  placedActions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.xxl },
  outlinedBtn: { borderColor: colors.navy, borderWidth: 1.2 },
  emptyBtn: { marginTop: spacing.xxl, alignSelf: 'stretch' },

  loginGate: { padding: spacing.xxl, alignItems: 'center', backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, ...shadow.raised },
  gateTitle: { marginTop: spacing.md, textAlign: 'center' },
  gateBtn: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
