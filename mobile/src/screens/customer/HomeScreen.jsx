import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

const NAVY = '#0E2346';
const GOLD = '#B08D2C';

const STEPS = [
  { title: 'Choose your service', desc: 'Select items & care type — wash, iron, dry clean or specialty.' },
  { title: 'We pick up', desc: 'Book a slot or drop at our shop. Free pickup & delivery for members.' },
  { title: 'Expert care', desc: 'Specialist cleaning, pressing and a quality check on every item.' },
  { title: 'Fresh delivery', desc: 'Track in real-time and receive your wardrobe, immaculate.' },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text variant="headlineLarge" style={styles.heroTitle}>Premium garment care, delivered.</Text>
        <Text style={styles.heroSubtitle}>Wash, iron, dry clean and specialty care — booked in seconds, tracked in real time.</Text>
        <View style={styles.heroBtns}>
          <Button mode="contained" onPress={() => navigation.navigate('Services')} style={{ flex: 1 }}>Order now</Button>
          <Button mode="outlined" onPress={() => navigation.navigate('Track')} style={{ flex: 1 }}>Track order</Button>
        </View>
        <Button mode="text" onPress={() => navigation.navigate('Subscription')} style={{ marginTop: 4 }}>
          See membership plans →
        </Button>
      </View>

      <Text style={styles.eyebrow}>The T2 Standard</Text>
      <Text variant="titleLarge" style={styles.sectionTitle}>A transparent, four-step ritual.</Text>
      <View style={styles.cardsWrap}>
        {STEPS.map((s, i) => (
          <Card key={i} style={styles.stepCard}>
            <Card.Content>
              <Text style={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.navyBold}>{s.title}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: '#f8fafc' },
  hero: { paddingVertical: 24, alignItems: 'center' },
  eyebrow: { fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  heroTitle: { color: NAVY, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  heroSubtitle: { color: '#64748b', textAlign: 'center', marginTop: 10 },
  heroBtns: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  sectionTitle: { color: NAVY, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  cardsWrap: { gap: 10, marginTop: 16 },
  stepCard: { borderRadius: 16 },
  navyBold: { color: NAVY, fontWeight: '700' },
  desc: { color: '#64748b', fontSize: 12, marginTop: 6 },
  stepNumber: { color: 'rgba(14,35,70,0.15)', fontSize: 28, fontWeight: '700' },
});
