import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { DatePicker } from '../../components/CustomDatePicker';
import hasRequiredAge from '../../methods/utils/checkAge';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../constants/FirebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const DetailsOneScreen = () => {
  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();

  const [birthday, setBirthday] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save this data.');
      return;
    }

    if (!hasRequiredAge(18, birthday)) {
      Alert.alert('Information', 'You are not old enough!', [{ text: 'OK' }]);
      return;
    }

    try {
      setLoading(true);
      await setDoc(
        doc(db, 'users', user.uid),
        { birthday: birthday.toISOString(), email: user.email },
        { merge: true },
      );
      router.push('/details1Two');
    } catch (error) {
      console.error('Error putting Birthday to Firestore: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: spacing.GLOBAL_MARGIN_TOP,
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Step 1</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your Birthday</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Select your date of birth.
        </Text>

        <DatePicker
          value={birthday}
          onChange={(date) => setBirthday(date)}
          mode="past"
        />
      </ScrollView>

      {/* Footer lives outside ScrollView — always pinned to bottom */}
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
            paddingBottom: spacing.BOTTOM_INSET > 0 ? spacing.BOTTOM_INSET + 8 : 24,
            backgroundColor: colors.background,
          },
        ]}
      >
        <CustomButton title="Next Step" onPress={handleSubmit} loading={loading} />
      </View>
    </View>
  );
};

export default DetailsOneScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    letterSpacing: 0.1,
    marginBottom: 32,
  },
  footer: {
    paddingTop: 12,
  },
});