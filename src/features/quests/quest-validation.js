import { isAttributeKey } from '@/features/progression/attributes';

import { CADENCES_BY_KEY, CATEGORIES_BY_KEY, DIFFICULTIES_BY_KEY, QUEST_LIMITS } from './quest-config';
import { QuestError } from './quest-errors';
import { getDefaultAttributeWeights } from './quest-rewards';

/**
 * Validates quest form input. Returns field-level errors for the form instead of throwing.
 *
 * @param {object} input { title, description, category, difficulty, cadence, weekdays, attributeWeights }
 * @param {{ existingQuest?: object }} [options] Pass the stored quest when editing.
 * @returns {{ isValid: boolean, fieldErrors: Record<string, string>, value: object | null }}
 */
export function validateQuestInput(input, { existingQuest } = {}) {
  const fieldErrors = {};

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length === 0) fieldErrors.title = 'Give the quest a name.';
  else if (title.length > QUEST_LIMITS.titleMaxLength) fieldErrors.title = `Keep it under ${QUEST_LIMITS.titleMaxLength} characters.`;

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length > QUEST_LIMITS.descriptionMaxLength) {
    fieldErrors.description = `Keep it under ${QUEST_LIMITS.descriptionMaxLength} characters.`;
  }

  if (!CATEGORIES_BY_KEY[input.category]) fieldErrors.category = 'Choose a category.';
  if (!DIFFICULTIES_BY_KEY[input.difficulty]) fieldErrors.difficulty = 'Choose a difficulty.';

  if (!CADENCES_BY_KEY[input.cadence]) fieldErrors.cadence = 'Choose how often it repeats.';
  else if (existingQuest && existingQuest.cadence !== input.cadence) {
    fieldErrors.cadence = 'Repeat type can’t change after creation. Archive this quest and create a new one.';
  }

  let weekdays = null;
  if (input.cadence === 'weekdays') {
    const days = Array.isArray(input.weekdays) ? input.weekdays : [];
    const validDays = [...new Set(days)].filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);
    if (validDays.length === 0 || validDays.length !== days.length) fieldErrors.weekdays = 'Pick at least one day.';
    else weekdays = validDays.sort((a, b) => a - b);
  }

  const attributeWeights = {};
  const requestedWeights =
    input.attributeWeights ?? (CATEGORIES_BY_KEY[input.category] ? getDefaultAttributeWeights(input.category) : {});
  for (const [key, weight] of Object.entries(requestedWeights)) {
    if (!isAttributeKey(key)) {
      fieldErrors.attributeWeights = `Unknown attribute "${key}".`;
    } else if (!Number.isInteger(weight) || weight < 0 || weight > QUEST_LIMITS.maxAttributeWeight) {
      fieldErrors.attributeWeights = `Attribute weights must be 0–${QUEST_LIMITS.maxAttributeWeight}.`;
    } else if (weight > 0) {
      attributeWeights[key] = weight;
    }
  }
  if (!fieldErrors.attributeWeights && Object.keys(attributeWeights).length === 0) {
    fieldErrors.attributeWeights = 'Choose at least one attribute this quest trains.';
  }

  const isValid = Object.keys(fieldErrors).length === 0;
  return {
    isValid,
    fieldErrors,
    value: isValid
      ? { title, description, category: input.category, difficulty: input.difficulty, cadence: input.cadence, weekdays, attributeWeights }
      : null,
  };
}

/** Like `validateQuestInput`, but throws a QuestError carrying the field errors. */
export function assertValidQuestInput(input, options) {
  const result = validateQuestInput(input, options);
  if (!result.isValid) {
    throw new QuestError('INVALID_QUEST', 'Quest is invalid', result.fieldErrors);
  }
  return result.value;
}
