import { useState } from 'react';

import { getDefaultAttributeWeights, previewQuestReward } from '@/features/quests/quest-rewards';
import { validateQuestInput } from '@/features/quests/quest-validation';
import { useQuestStore } from '@/store/quest-store';

function createInitialValues(quest) {
  if (quest) {
    return {
      title: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      cadence: quest.cadence,
      weekdays: quest.weekdays ?? [],
      attributeWeights: quest.attributeWeights,
    };
  }
  return {
    title: '',
    description: '',
    category: 'fitness',
    difficulty: 'normal',
    cadence: 'daily',
    weekdays: [],
    attributeWeights: getDefaultAttributeWeights('fitness'),
  };
}

/**
 * Form state for creating or editing a quest. Validation and XP preview come from the quest
 * domain; this hook only manages input and submission.
 *
 * @param {object | null} existingQuest Pass a quest to edit it; null to create.
 */
export function useQuestForm(existingQuest) {
  const createQuest = useQuestStore((state) => state.createQuest);
  const updateQuest = useQuestStore((state) => state.updateQuest);

  const [values, setValues] = useState(() => createInitialValues(existingQuest));
  // Until the player picks attributes themselves, they follow the category's defaults.
  const [attributesCustomized, setAttributesCustomized] = useState(Boolean(existingQuest));
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validation = validateQuestInput(values, { existingQuest });
  // Preview as soon as attributes are chosen, even before the title is filled in.
  const rewardPreview =
    Object.keys(values.attributeWeights).length > 0 && !validation.fieldErrors.attributeWeights
      ? previewQuestReward(values)
      : null;

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function setCategory(category) {
    setValues((current) => ({
      ...current,
      category,
      attributeWeights: attributesCustomized ? current.attributeWeights : getDefaultAttributeWeights(category),
    }));
  }

  function setAttributeWeight(attributeKey, weight) {
    setAttributesCustomized(true);
    setValues((current) => {
      const attributeWeights = { ...current.attributeWeights };
      if (weight > 0) attributeWeights[attributeKey] = weight;
      else delete attributeWeights[attributeKey];
      return { ...current, attributeWeights };
    });
  }

  function toggleWeekday(day) {
    setValues((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((existingDay) => existingDay !== day)
        : [...current.weekdays, day],
    }));
  }

  /** Saves the quest. Resolves true on success. */
  async function submit() {
    setHasAttemptedSubmit(true);
    setSubmitError(null);
    if (!validation.isValid || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      if (existingQuest) await updateQuest(existingQuest.id, values);
      else await createQuest(values);
      return true;
    } catch (error) {
      setSubmitError(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    fieldErrors: hasAttemptedSubmit ? { ...validation.fieldErrors, ...submitError?.fieldErrors } : {},
    submitError: submitError?.fieldErrors ? null : submitError,
    isValid: validation.isValid,
    isSubmitting,
    rewardPreview,
    isCadenceLocked: Boolean(existingQuest),
    setField,
    setCategory,
    setAttributeWeight,
    toggleWeekday,
    submit,
  };
}
