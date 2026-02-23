import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DatePickerMode = 'past' | 'future' | 'any';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: DatePickerMode;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const todayMidnight = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Month/Year Header Picker ──────────────────────────────────────────────────

interface HeaderPickerProps {
  year: number;
  month: number;
  mode: DatePickerMode;
  onPrev: () => void;
  onNext: () => void;
  onMonthPress: () => void;
}

function CalendarHeader({ year, month, mode, onPrev, onNext, onMonthPress }: HeaderPickerProps) {
  const { colors } = useAppTheme();

  const today = todayMidnight;
  const viewDate = new Date(year, month, 1);

  // Can we go back?
  const canGoPrev = mode === 'any' ||
    (mode === 'past' ? true : viewDate > new Date(today.getFullYear(), today.getMonth(), 1));

  // Can we go forward?
  const canGoNext = mode === 'any' ||
    (mode === 'future' ? true : viewDate < new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onPrev}
        disabled={!canGoPrev}
        style={[styles.navBtn, { opacity: canGoPrev ? 1 : 0.25 }]}
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </Pressable>

      <Pressable onPress={onMonthPress} style={styles.headerCenter}>
        <Text style={[styles.headerMonth, { color: colors.text }]}>
          {MONTHS[month]}
        </Text>
        <Text style={[styles.headerYear, { color: colors.primary }]}>
          {year}
        </Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={!canGoNext}
        style={[styles.navBtn, { opacity: canGoNext ? 1 : 0.25 }]}
        hitSlop={10}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

// ─── Year Grid Picker (shown when tapping the year) ───────────────────────────

interface YearPickerProps {
  currentYear: number;
  mode: DatePickerMode;
  onSelect: (year: number) => void;
  onClose: () => void;
}

function YearPicker({ currentYear, mode, onSelect, onClose }: YearPickerProps) {
  const { colors } = useAppTheme();
  const today = todayMidnight.getFullYear();

  const startYear = mode === 'future' ? today : today - 100;
  const endYear = mode === 'past' ? today : today + 20;

  const years: number[] = [];
  for (let y = endYear; y >= startYear; y--) years.push(y);

  return (
    <View style={styles.yearPickerWrapper}>
      <View style={[styles.yearPickerHeader, { borderBottomColor: colors.tabIconDefault + '22' }]}>
        <Text style={[styles.yearPickerTitle, { color: colors.text }]}>Select Year</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={20} color={colors.tabIconDefault} />
        </Pressable>
      </View>

      <View style={styles.yearGrid}>
        {years.map((y) => {
          const isSelected = y === currentYear;
          return (
            <Pressable
              key={y}
              onPress={() => onSelect(y)}
              style={[
                styles.yearCell,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.yearCellText,
                  { color: isSelected ? '#fff' : colors.text },
                ]}
              >
                {y}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Calendar Picker ──────────────────────────────────────────────────────

export function DatePicker({ value, onChange, mode = 'any' }: DatePickerProps) {
  const { colors } = useAppTheme();

  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    callback();
  };

  const goToPrev = () => {
    animateTransition(() => {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    });
  };

  const goToNext = () => {
    animateTransition(() => {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    });
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setShowYearPicker(false);
  };

  const handleDayPress = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    selected.setHours(0, 0, 0, 0);
    onChange(selected);
  };

  const isDayDisabled = (day: number): boolean => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (mode === 'past') return d > todayMidnight;
    if (mode === 'future') return d < todayMidnight;
    return false;
  };

  const isDaySelected = (day: number): boolean => {
    return (
      value.getFullYear() === viewYear &&
      value.getMonth() === viewMonth &&
      value.getDate() === day
    );
  };

  const isToday = (day: number): boolean => {
    return (
      todayMidnight.getFullYear() === viewYear &&
      todayMidnight.getMonth() === viewMonth &&
      todayMidnight.getDate() === day
    );
  };

  const totalDays = daysInMonth(viewMonth, viewYear);
  const startDay = startDayOfMonth(viewMonth, viewYear);

  // Build grid: nulls for empty leading cells, then day numbers
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {showYearPicker ? (
        <YearPicker
          currentYear={viewYear}
          mode={mode}
          onSelect={handleYearSelect}
          onClose={() => setShowYearPicker(false)}
        />
      ) : (
        <>
          <CalendarHeader
            year={viewYear}
            month={viewMonth}
            mode={mode}
            onPrev={goToPrev}
            onNext={goToNext}
            onMonthPress={() => setShowYearPicker(true)}
          />

          {/* Day-of-week labels */}
          <View style={styles.weekRow}>
            {DAYS.map((d) => (
              <View key={d} style={styles.weekCell}>
                <Text style={[styles.weekLabel, { color: colors.tabIconDefault }]}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.tabIconDefault + '18' }]} />

          {/* Calendar grid */}
          <Animated.View style={[styles.grid, { opacity: fadeAnim }]}>
            {cells.map((day, i) => {
              if (day === null) {
                return <View key={`empty-${i}`} style={styles.dayCell} />;
              }

              const disabled = isDayDisabled(day);
              const selected = isDaySelected(day);
              const today = isToday(day);

              return (
                <Pressable
                  key={`day-${day}`}
                  onPress={() => !disabled && handleDayPress(day)}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayInner,
                      selected && { backgroundColor: colors.primary },
                      !selected && today && {
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: selected
                            ? '#fff'
                            : disabled
                              ? colors.tabIconDefault + '35'
                              : today
                                ? colors.primary
                                : colors.text,
                          fontWeight: selected || today ? '700' : '400',
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Selected date label */}
          <View style={[styles.footer, { borderTopColor: colors.tabIconDefault + '18' }]}>
            <Text style={[styles.selectedLabel, { color: colors.tabIconDefault }]}>
              {value.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              })}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const CELL_SIZE = Math.floor((Dimensions.get('window').width - 40 - 32) / 7);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerMonth: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerYear: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  weekCell: {
    width: CELL_SIZE,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 0,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: CELL_SIZE - 6,
    height: CELL_SIZE - 6,
    borderRadius: (CELL_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  footer: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'center',
  },
  selectedLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  // Year picker
  yearPickerWrapper: {
    padding: 16,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  yearPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearCell: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  yearCellText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});