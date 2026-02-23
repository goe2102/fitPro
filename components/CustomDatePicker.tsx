import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewToken,
  Pressable,
} from 'react-native';
import { useAppTheme } from '../constants/Config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DatePickerMode = 'past' | 'future' | 'any';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: DatePickerMode; // 'past' = only allow dates <= today, 'future' = only >= today
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5; // must be odd
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const today = new Date();
today.setHours(0, 0, 0, 0);

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

// ─── Single Column ────────────────────────────────────────────────────────────

interface ColumnProps {
  data: { value: number; label: string; disabled: boolean }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width: number;
}

function Column({ data, selectedIndex, onSelect, width }: ColumnProps) {
  const { colors } = useAppTheme();
  const listRef = useRef<FlatList>(null);
  const currentIndex = useRef(selectedIndex);

  // Pad top and bottom so selected item can center
  const PADDING = Math.floor(VISIBLE_ITEMS / 2);
  const paddedData = [
    ...Array(PADDING).fill({ value: -1, label: '', disabled: true }),
    ...data,
    ...Array(PADDING).fill({ value: -1, label: '', disabled: true }),
  ];

  useEffect(() => {
    const target = selectedIndex + PADDING;
    listRef.current?.scrollToIndex({ index: target, animated: false });
  }, []);

  // Snap to nearest item on scroll end
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
      const dataIndex = clamp(rawIndex, 0, data.length - 1);

      if (!data[dataIndex].disabled) {
        onSelect(dataIndex);
        currentIndex.current = dataIndex;
      } else {
        // Snap back to last valid
        const target = (currentIndex.current + PADDING) * ITEM_HEIGHT;
        listRef.current?.scrollToOffset({ offset: target, animated: true });
      }
    },
    [data, onSelect, PADDING],
  );

  const renderItem = ({ item, index }: { item: typeof paddedData[0]; index: number }) => {
    const dataIndex = index - PADDING;
    const isSelected = dataIndex === selectedIndex;
    const isEmpty = item.value === -1;
    const isDisabled = item.disabled && !isEmpty;

    return (
      <Pressable
        style={[styles.item, { height: ITEM_HEIGHT, width }]}
        onPress={() => {
          if (!isDisabled && !isEmpty) {
            onSelect(dataIndex);
            listRef.current?.scrollToIndex({ index, animated: true });
          }
        }}
      >
        <Text
          style={[
            styles.itemText,
            {
              color: isSelected
                ? colors.primary
                : isDisabled
                  ? colors.tabIconDefault + '40'
                  : colors.text + (isEmpty ? '00' : 'BB'),
              fontWeight: isSelected ? '700' : '400',
              fontSize: isSelected ? 18 : 16,
            },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.column, { width }]}>
      <FlatList
        ref={listRef}
        data={paddedData}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={selectedIndex + PADDING}
        scrollEventThrottle={16}
        bounces={false}
        style={{ height: PICKER_HEIGHT }}
      />
    </View>
  );
}

// ─── Main DatePicker ──────────────────────────────────────────────────────────

export function DatePicker({ value, onChange, mode = 'any' }: DatePickerProps) {
  const { colors } = useAppTheme();

  const selectedDay = value.getDate();       // 1-31
  const selectedMonth = value.getMonth();    // 0-11
  const selectedYear = value.getFullYear();

  // ── Year range ──────────────────────────────────────────────────────────────
  const currentYear = today.getFullYear();
  let yearStart: number;
  let yearEnd: number;

  if (mode === 'past') {
    yearStart = currentYear - 100;
    yearEnd = currentYear;
  } else if (mode === 'future') {
    yearStart = currentYear;
    yearEnd = currentYear + 50;
  } else {
    yearStart = currentYear - 100;
    yearEnd = currentYear + 50;
  }

  const years = Array.from({ length: yearEnd - yearStart + 1 }, (_, i) => {
    const y = yearStart + i;
    return { value: y, label: String(y), disabled: false };
  });

  const yearIndex = clamp(selectedYear - yearStart, 0, years.length - 1);

  // ── Month data (disable based on mode + year) ───────────────────────────────
  const months = MONTHS.map((name, i) => {
    let disabled = false;
    if (mode === 'past' && selectedYear === currentYear) {
      disabled = i > today.getMonth();
    } else if (mode === 'future' && selectedYear === currentYear) {
      disabled = i < today.getMonth();
    }
    return { value: i, label: name, disabled };
  });

  const safeMonth = months[selectedMonth].disabled
    ? months.findIndex((m) => !m.disabled)
    : selectedMonth;

  // ── Day data (disable based on mode + month + year) ─────────────────────────
  const maxDay = daysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: maxDay }, (_, i) => {
    const d = i + 1;
    let disabled = false;
    const thisDate = new Date(selectedYear, selectedMonth, d);
    thisDate.setHours(0, 0, 0, 0);
    if (mode === 'past') disabled = thisDate > today;
    if (mode === 'future') disabled = thisDate < today;
    return { value: d, label: String(d).padStart(2, '0'), disabled };
  });

  const safeDay = days[selectedDay - 1]?.disabled
    ? days.find((d) => !d.disabled)?.value ?? 1
    : selectedDay;

  const dayIndex = safeDay - 1;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDayChange = (index: number) => {
    const newDay = days[index].value;
    onChange(new Date(selectedYear, selectedMonth, newDay));
  };

  const handleMonthChange = (index: number) => {
    const newMonth = months[index].value;
    const maxD = daysInMonth(newMonth, selectedYear);
    const newDay = clamp(selectedDay, 1, maxD);
    onChange(new Date(selectedYear, newMonth, newDay));
  };

  const handleYearChange = (index: number) => {
    const newYear = years[index].value;
    const maxD = daysInMonth(selectedMonth, newYear);
    const newDay = clamp(selectedDay, 1, maxD);
    onChange(new Date(newYear, selectedMonth, newDay));
  };

  // ── Layout ───────────────────────────────────────────────────────────────────
  const DAY_W = 52;
  const MONTH_W = 130;
  const YEAR_W = 72;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderRadius: 20 }]}>
      {/* Selection highlight band */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionBand,
          {
            top: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2,
            height: ITEM_HEIGHT,
            borderColor: colors.primary + '30',
            backgroundColor: colors.primary + '0C',
          },
        ]}
      />
      {/* Top fade */}
      <View
        pointerEvents="none"
        style={[styles.fadeTop, { backgroundColor: colors.card }]}
      />
      {/* Bottom fade */}
      <View
        pointerEvents="none"
        style={[styles.fadeBottom, { backgroundColor: colors.card }]}
      />

      <View style={styles.columns}>
        <Column
          data={days}
          selectedIndex={dayIndex}
          onSelect={handleDayChange}
          width={DAY_W}
        />
        <Column
          data={months}
          selectedIndex={safeMonth}
          onSelect={handleMonthChange}
          width={MONTH_W}
        />
        <Column
          data={years}
          selectedIndex={yearIndex}
          onSelect={handleYearChange}
          width={YEAR_W}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  column: {
    overflow: 'hidden',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    letterSpacing: 0.2,
  },
  selectionBand: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 10,
    zIndex: 1,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    opacity: 0.75,
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    opacity: 0.75,
    zIndex: 2,
  },
});