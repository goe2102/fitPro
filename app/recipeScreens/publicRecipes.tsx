import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../constants/Config';


export default function PublicRecipes() {
  const { colors } = useAppTheme();

  // Later: Query Firebase where isPublic == true

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Public Discover Feed goes here...</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });