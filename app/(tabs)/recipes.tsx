import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../constants/Config';

const RecipeScreen = () => {

  const { colors , spacing } = useAppTheme();

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background, paddingHorizontal: spacing.PADDING_HORIZONTAL, paddingTop: spacing.GLOBAL_MARGIN_TOP}]}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        Recipes
      </Text>
    </ScrollView>
  );
};

export default RecipeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});