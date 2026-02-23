import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../constants/Config';

export default function SavedRecipes() {
  const { colors } = useAppTheme();

  // Later: Query the users/{userId}/savedRecipes subcollection

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Your saved/liked recipes go here...</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });