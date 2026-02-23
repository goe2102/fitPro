import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../constants/FirebaseConfig';
import hasRequiredAge from '../../methods/utils/checkAge';
import { safeParseNumber } from '../../methods/utils/stringToNumber';
import { CustomInput } from '../../components/CustomInput';
import { CustomGenderPicker } from '../../components/CustomGenderPicker';

const DetailsTwoScreen = () => {

  const { user } = useAuth();
  const { colors, spacing } = useAppTheme();

  const [loading, setLoading] = useState(false);

  const [height, setHeight] = useState('');
  const [weight, setWeight] =  useState('');

  const [gender, setGender] = useState<'male' | 'female' | 'secret'>('male');

  const disabled = !weight.trim() || !height.trim();

  const handleSubmit = async () => {

    if (!user) {
      Alert.alert("Error", "You must be logged in to save this data.");
      return;
    }

    try {
      setLoading(true);

      const userRef = doc(db, 'users', user.uid);

      const submitHeight = safeParseNumber(height);
      const submitWeight = safeParseNumber(weight);

      await setDoc(userRef, {
        height: submitHeight,
        weight: submitWeight,
        gender: gender,
      }, {merge: true});
      
      router.push({pathname: '/detailsThree', params: {currentWeight: safeParseNumber(weight)}});
    } catch (error) {
      console.error("Error putting Birhtday to FireStrore: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
          style={[styles.root, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Step 2</Text>
          <Text style={[styles.title, { color: colors.text }]}>Personal Info</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            We need this to calculate values
          </Text>


          <Text style={[styles.description, { color: colors.text }]}>
            Gender: 
          </Text>
          <CustomGenderPicker 
            value={gender}
            onChange={(t) => setGender(t)}
          />


          <Text style={[styles.description, { color: colors.text }]}>
            Measurements:
          </Text>
          <View style={{height: 8}}></View>
          <CustomInput 
            value={height}
            onChangeText={(t) => setHeight(t)}
            label='Height in Cm'
            keyboardType='numeric'
          />

          <CustomInput
            value={weight}
            onChangeText={(t) => setWeight(t)}
            label='Weight in Kg'
            keyboardType='numeric'
          />

        </View>
      </ScrollView>

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
        <CustomButton
          title="Next Step"
          onPress={handleSubmit}
          loading={loading}
          disabled={disabled}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default DetailsTwoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 15,
    letterSpacing: 0.1,
    marginBottom: 32,
  },
  description: {
    fontSize: 15,
    letterSpacing: 0.1,
    marginBottom: 14,
    fontWeight: '500'
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
});