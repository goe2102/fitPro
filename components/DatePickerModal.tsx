import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';
import { dateToString, getTodayString } from '../hooks/useDailyNutrition';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string; // 'YYYY-MM-DD'
  onSelect: (dateString: string) => void;
  onClose: () => void;
}

function getDayLabel(dateStr: string): string {
  const today = getTodayString();
  const yesterday = dateToString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function generateDays(count = 30): string[] {
  const days: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(dateToString(d));
  }
  return days;
}

export function DatePickerModal({ visible, selectedDate, onSelect, onClose }: DatePickerModalProps) {
  const { colors } = useAppTheme();
  const days = generateDays(30);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.tabIconDefault + '40' }]} />

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Select a Day</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.tabIconDefault} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {days.map((day) => {
            const isSelected = day === selectedDate;
            const isToday = day === getTodayString();
            return (
              <Pressable
                key={day}
                onPress={() => { onSelect(day); onClose(); }}
                style={[
                  styles.dayRow,
                  { borderBottomColor: colors.background },
                  isSelected && { backgroundColor: colors.primary + '12' },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.dayLabel,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}>
                    {getDayLabel(day)}
                  </Text>
                  {!isToday && day !== dateToString(new Date(Date.now() - 86400000)) && (
                    <Text style={[styles.daySub, { color: colors.tabIconDefault }]}>
                      {new Date(day + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
                {isToday && !isSelected && (
                  <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: '72%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  listContent: { paddingBottom: 40 },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dayLabel: { fontSize: 16, fontWeight: '600' },
  daySub: { fontSize: 12, marginTop: 2 },
  todayDot: { width: 8, height: 8, borderRadius: 4 },
});