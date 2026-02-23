import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { DatePicker } from '../../components/CustomDatePicker';
import hasRequiredAge from '../../methods/utils/checkAge';
import putToUserProfile from '../../methods/auth/putToUserProfile';
import { useAuth } from '../../context/AuthContext';
import { User } from 'firebase/auth';
import { db } from '../../constants/FirebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const DetailsOneScreen = () => {
  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();

  // Store the selected date in state — initialize to today
  const [birthday, setBirthday] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {

    if (!user) {
      Alert.alert("Error", "You must be logged in to save this data.");
      return;
    }

    const isOldEnough = hasRequiredAge(18, birthday);

    if (!isOldEnough) {
      Alert.alert(
        "Information",           // Title
        "You are not old enough!", // Message
        [{ text: "OK" }]         // Buttons (just OK)
      );

      return;
    }

    try {
      setLoading(true);

      const userRef = doc(db, 'users', user.uid);

      await setDoc(userRef, {
        birthday: birthday.toISOString(),
        email: user.email,
      }, {merge: true});
      
      router.push('/detailsTwo');
    } catch (error) {
      console.error("Error putting Birhtday to FireStrore: ", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingHorizontal: spacing.PADDING_HORIZONTAL,
          paddingTop: spacing.GLOBAL_MARGIN_TOP,
        },
      ]}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>Step 1</Text>
      <Text style={[styles.title, { color: colors.text }]}>Your Birthday</Text>
      <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
        Scroll to select your date of birth.
      </Text>


      <DatePicker
        value={birthday}
        onChange={(date) => setBirthday(date)}
        mode="past"           // birthdays are always in the past
      />

      {/* Show the selected date beneath the picker */}
      <Text style={[styles.selectedLabel, { color: colors.tabIconDefault }]}>
        {birthday.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>

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
        <CustomButton title="Next Step" onPress={handleSubmit} loading={loading}/>
      </View>
    </View>
  );
};

export default DetailsOneScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  selectedLabel: {
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
  },
});