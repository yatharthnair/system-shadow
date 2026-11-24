import { router } from 'expo-router';
import { Archive } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ScalePressable } from '@/components/common/scale-pressable';
import { BorderWidth, Colors, ComponentTokens, Radius, Spacing } from '@/constants/theme';
import { getAttributeDefinition } from '@/features/progression/attributes';
import { QUEST_LIMITS } from '@/features/quests/quest-config';
import { useQuestForm } from '@/hooks/use-quest-form';
import { useQuestStore } from '@/store/quest-store';

import { AttributeWeightPicker } from './form/attribute-weight-picker';
import { CadencePicker } from './form/cadence-picker';
import { CategoryPicker } from './form/category-picker';
import { DifficultyPicker } from './form/difficulty-picker';
import { FormSection } from './form/form-section';
import { SystemTextInput } from './form/system-text-input';
import { showSystemError } from '@/components/common/show-system-error';

function EditorHeader({ title, canSave, isSaving, onCancel, onSave }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button">
        <AppText variant="body" color="textSecondary">
          Cancel
        </AppText>
      </Pressable>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <Pressable onPress={onSave} disabled={isSaving} hitSlop={12} accessibilityRole="button" accessibilityState={{ disabled: isSaving }}>
        {isSaving ? (
          <ActivityIndicator color={Colors.highlight} />
        ) : (
          <AppText variant="bodyStrong" color={canSave ? 'highlight' : 'textMuted'}>
            Save
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

function RewardPreview({ preview }) {
  if (!preview) return null;
  const split = Object.entries(preview.attributeXp)
    .map(([key, xp]) => `${getAttributeDefinition(key).shortLabel} +${xp}`)
    .join('  ·  ');
  return (
    <GlowPanel highlighted style={styles.preview}>
      <AppText variant="label" color="highlight">
        Reward
      </AppText>
      <AppText variant="display">+{preview.xp} XP</AppText>
      <AppText variant="caption" color="textSecondary">
        {split}
      </AppText>
    </GlowPanel>
  );
}

/**
 * Create / edit form for a quest, presented as an iOS modal sheet.
 * @param {{ quest: object | null }} props Pass a quest to edit it; null to create a new one.
 */
export function QuestEditor({ quest }) {
  const form = useQuestForm(quest);
  const archiveQuest = useQuestStore((state) => state.archiveQuest);
  const { values, fieldErrors } = form;

  async function handleSave() {
    if (await form.submit()) router.back();
  }

  function handleArchive() {
    Alert.alert(
      'Archive quest?',
      'It will leave your quest board. Its history and the XP it earned are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () =>
            archiveQuest(quest.id)
              .then(() => router.back())
              .catch(showSystemError),
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <EditorHeader
        title={quest ? 'Edit Quest' : 'New Quest'}
        canSave={form.isValid}
        isSaving={form.isSubmitting}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <FormSection label="Quest" error={fieldErrors.title}>
          <SystemTextInput
            value={values.title}
            onChangeText={(text) => form.setField('title', text)}
            placeholder="e.g. 30-minute run"
            maxLength={QUEST_LIMITS.titleMaxLength}
            hasError={Boolean(fieldErrors.title)}
            returnKeyType="done"
            autoFocus={!quest}
            accessibilityLabel="Quest title"
          />
        </FormSection>

        <FormSection label="Notes" hint="Optional" error={fieldErrors.description}>
          <SystemTextInput
            value={values.description}
            onChangeText={(text) => form.setField('description', text)}
            placeholder="What counts as done?"
            maxLength={QUEST_LIMITS.descriptionMaxLength}
            multiline
            hasError={Boolean(fieldErrors.description)}
            accessibilityLabel="Quest notes"
          />
        </FormSection>

        <FormSection label="Category" error={fieldErrors.category}>
          <CategoryPicker value={values.category} onChange={form.setCategory} />
        </FormSection>

        <FormSection label="Repeat" error={fieldErrors.cadence ?? fieldErrors.weekdays}>
          <CadencePicker
            cadence={values.cadence}
            weekdays={values.weekdays}
            isLocked={form.isCadenceLocked}
            onChangeCadence={(cadence) => form.setField('cadence', cadence)}
            onToggleWeekday={form.toggleWeekday}
          />
        </FormSection>

        <FormSection label="Difficulty" hint="XP per completion" error={fieldErrors.difficulty}>
          <DifficultyPicker
            value={values.difficulty}
            cadence={values.cadence}
            onChange={(difficulty) => form.setField('difficulty', difficulty)}
          />
        </FormSection>

        <FormSection label="Trains" hint="Tap to weight" error={fieldErrors.attributeWeights}>
          <AttributeWeightPicker
            weights={values.attributeWeights}
            attributeXp={form.rewardPreview?.attributeXp}
            onChange={form.setAttributeWeight}
          />
        </FormSection>

        <RewardPreview preview={form.rewardPreview} />

        {form.submitError ? (
          <AppText variant="body" color="danger">
            {form.submitError.message}
          </AppText>
        ) : null}

        {quest ? (
          <ScalePressable onPress={handleArchive} style={styles.archive} accessibilityRole="button">
            <Archive size={16} color={Colors.danger} strokeWidth={2} />
            <AppText variant="label" color="danger">
              Archive Quest
            </AppText>
          </ScalePressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  content: {
    padding: ComponentTokens.screen.horizontalPadding,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxxl * 2,
  },
  preview: { alignItems: 'center', gap: Spacing.xs },
  archive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.danger,
  },
});
