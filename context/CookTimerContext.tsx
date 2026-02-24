import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CookTimerContextValue {
  startTimer: (seconds: number, label?: string) => void;
  stopTimer: () => void;
  isRunning: boolean;
  remaining: number;
  label: string;
}

const CookTimerContext = createContext<CookTimerContextValue>({
  startTimer: () => { },
  stopTimer: () => { },
  isRunning: false,
  remaining: 0,
  label: '',
});

export function useCookTimer() {
  return useContext(CookTimerContext);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Floating persistent timer banner — rendered inside the provider
function TimerBanner({
  remaining,
  total,
  label,
  onStop,
}: {
  remaining: number;
  total: number;
  label: string;
  onStop: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const isAlmostDone = remaining <= 10;
  const isDone = remaining === 0;
  const progress = total > 0 ? remaining / total : 0;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 14,
      stiffness: 120,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        bannerStyles.container,
        { transform: [{ translateY: slideAnim }] },
        isDone && bannerStyles.containerDone,
      ]}
    >
      {/* Progress fill */}
      <View style={[bannerStyles.progressFill, { width: `${progress * 100}%` }]} />

      <View style={bannerStyles.inner}>
        <Ionicons
          name={isDone ? 'checkmark-circle' : 'timer-outline'}
          size={20}
          color={isDone ? '#fff' : isAlmostDone ? '#fbbf24' : '#fff'}
        />
        <View style={bannerStyles.textCol}>
          <Text style={bannerStyles.timerText}>
            {isDone ? 'Timer done!' : formatTime(remaining)}
          </Text>
          {label ? (
            <Text style={bannerStyles.labelText} numberOfLines={1}>
              {label}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onStop} hitSlop={10} style={bannerStyles.stopBtn}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function CookTimerProvider({ children }: { children: React.ReactNode }) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = (seconds: number, timerLabel = '') => {
    clearTimer();
    setTotal(seconds);
    setRemaining(seconds);
    setLabel(timerLabel);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          // Keep banner visible at 0 so user sees "Timer done!"
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearTimer();
    setIsRunning(false);
    setRemaining(0);
    setTotal(0);
    setLabel('');
  };

  useEffect(() => () => clearTimer(), []);

  const showBanner = isRunning || remaining === 0 && total > 0;

  return (
    <CookTimerContext.Provider value={{ startTimer, stopTimer, isRunning, remaining, label }}>
      {children}
      {showBanner && (
        <TimerBanner
          remaining={remaining}
          total={total}
          label={label}
          onStop={stopTimer}
        />
      )}
    </CookTimerContext.Provider>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    borderRadius: 16,
    backgroundColor: '#1d1d1f',
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  containerDone: {
    backgroundColor: '#16a34a',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textCol: { flex: 1, gap: 1 },
  timerText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  labelText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  stopBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});