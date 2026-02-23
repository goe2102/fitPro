import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

export interface Instruction {
  id: string;
  text: string;
}

interface InstructionEditorProps {
  instructions: Instruction[];
  onChange: (instructions: Instruction[]) => void;
}

const MAX_CHARS = 300;

function InstructionRow({
  instruction,
  index,
  onUpdate,
  onDelete,
}: {
  instruction: Instruction;
  index: number;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const remaining = MAX_CHARS - instruction.text.length;
  const nearLimit = remaining <= 50;

  return (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={styles.rowTop}>
        {/* Step badge */}
        <View style={[styles.stepBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.stepNum, { color: colors.primary }]}>{index + 1}</Text>
        </View>

        <TextInput
          value={instruction.text}
          onChangeText={(t) => onUpdate(t.slice(0, MAX_CHARS))}
          placeholder={`Describe step ${index + 1}…`}
          placeholderTextColor={colors.tabIconDefault + '60'}
          multiline
          style={[
            styles.textInput,
            {
              color: colors.text,
              borderColor: focused ? colors.primary : 'transparent',
              backgroundColor: colors.background + 'CC',
            },
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
          <Ionicons name="close-circle-outline" size={18} color={colors.error} />
        </Pressable>
      </View>

      {/* Char counter — only visible when focused or near limit */}
      {(focused || nearLimit) && (
        <Text
          style={[
            styles.charCount,
            { color: nearLimit ? colors.error : colors.tabIconDefault },
          ]}
        >
          {remaining} / {MAX_CHARS}
        </Text>
      )}
    </View>
  );
}

export function InstructionEditor({ instructions, onChange }: InstructionEditorProps) {
  const { colors } = useAppTheme();

  const add = () =>
    onChange([...instructions, { id: Date.now().toString(), text: '' }]);

  const update = (id: string, text: string) =>
    onChange(instructions.map(i => (i.id === id ? { ...i, text } : i)));

  const remove = (id: string) =>
    onChange(instructions.filter(i => i.id !== id));

  return (
    <View style={styles.container}>
      {instructions.map((inst, idx) => (
        <InstructionRow
          key={inst.id}
          instruction={inst}
          index={idx}
          onUpdate={(text) => update(inst.id, text)}
          onDelete={() => remove(inst.id)}
        />
      ))}

      <Pressable
        onPress={add}
        style={[
          styles.addBtn,
          { borderColor: colors.primary + '50', backgroundColor: colors.primary + '0C' },
        ]}
      >
        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
        <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Step</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: {
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    minHeight: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    letterSpacing: 0.1,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  deleteBtn: {
    marginTop: 6,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    letterSpacing: 0.2,
    paddingRight: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 2,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
});