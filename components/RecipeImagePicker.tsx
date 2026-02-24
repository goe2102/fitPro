import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

interface RecipeImagePickerProps {
  imageUri: string | null;
  onChange: (uri: string | null) => void;
}

// Normalizes Firebase Storage URLs so they load correctly on all platforms
function normalizeFirebaseUrl(uri: string | null): string | null {
  if (!uri) return null;
  return uri.replace('firebasestorage.app', 'googleapis.com');
}

export function RecipeImagePicker({ imageUri, onChange }: RecipeImagePickerProps) {
  const { colors } = useAppTheme();

  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Permission Needed", "We need camera roll permissions to upload a cover photo.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening image picker:", error);
    }
  };

  const clear = () => onChange(null);

  // ✅ FIX: normalizedUri is now actually used when rendering the image
  const normalizedUri = normalizeFirebaseUrl(imageUri);

  if (imageUri) {
    return (
      <View style={[styles.imageWrapper, { backgroundColor: colors.card }]}>
        <Image
          source={normalizedUri}  // ✅ was: source={imageUri} — never used the normalized URL!
          style={styles.image}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />

        {/* Edit / remove overlay */}
        <View style={styles.overlay}>
          <Pressable onPress={pick} style={[styles.overlayBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.overlayBtnText}>Change</Text>
          </Pressable>
          <Pressable onPress={clear} style={[styles.overlayBtn, { backgroundColor: 'rgba(220,50,50,0.85)' }]}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={pick}
      style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.tabIconDefault + '30' }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="image-outline" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.placeholderTitle, { color: colors.text }]}>Add Cover Photo</Text>
      <Text style={[styles.placeholderSub, { color: colors.tabIconDefault }]}>Tap to choose from your library</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 190,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  placeholderTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  placeholderSub: { fontSize: 13, letterSpacing: 0.1 },
  imageWrapper: {
    height: 190,
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  overlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  overlayBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});