import { assertValidQuestInput, validateQuestInput } from '../quest-validation';

const validInput = {
  title: '  Read 20 pages  ',
  description: 'Any book counts.',
  category: 'career',
  difficulty: 'normal',
  cadence: 'daily',
  attributeWeights: { intelligence: 2, discipline: 1 },
};

describe('validateQuestInput', () => {
  test('accepts and normalizes valid input', () => {
    expect(validateQuestInput(validInput)).toEqual({
      isValid: true,
      fieldErrors: {},
      value: {
        title: 'Read 20 pages',
        description: 'Any book counts.',
        category: 'career',
        difficulty: 'normal',
        cadence: 'daily',
        weekdays: null,
        attributeWeights: { intelligence: 2, discipline: 1 },
      },
    });
  });

  test('falls back to the category’s attributes when none are given', () => {
    const { value } = validateQuestInput({ ...validInput, attributeWeights: undefined, category: 'fitness' });
    expect(value.attributeWeights).toEqual({ strength: 2, agility: 1 });
  });

  test('specific-days quests need sorted, unique, valid weekdays', () => {
    expect(validateQuestInput({ ...validInput, cadence: 'weekdays', weekdays: [5, 1, 3] }).value.weekdays).toEqual([1, 3, 5]);
    expect(validateQuestInput({ ...validInput, cadence: 'weekdays', weekdays: [] }).fieldErrors).toHaveProperty('weekdays');
    expect(validateQuestInput({ ...validInput, cadence: 'weekdays', weekdays: [8] }).fieldErrors).toHaveProperty('weekdays');
  });

  test('weekdays are ignored for other cadences', () => {
    expect(validateQuestInput({ ...validInput, weekdays: [1] }).value.weekdays).toBeNull();
  });

  test.each([
    ['title', { title: '   ' }],
    ['title', { title: 'x'.repeat(61) }],
    ['description', { description: 'x'.repeat(241) }],
    ['category', { category: 'cooking' }],
    ['difficulty', { difficulty: 'legendary' }],
    ['cadence', { cadence: 'monthly' }],
    ['attributeWeights', { attributeWeights: { luck: 1 } }],
    ['attributeWeights', { attributeWeights: { strength: 4 } }],
    ['attributeWeights', { attributeWeights: { strength: 0 } }],
  ])('reports a %s error', (field, override) => {
    const result = validateQuestInput({ ...validInput, ...override });
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors).toHaveProperty(field);
  });

  test('the repeat type cannot change when editing', () => {
    const result = validateQuestInput({ ...validInput, cadence: 'weekly' }, { existingQuest: { cadence: 'daily' } });
    expect(result.fieldErrors).toHaveProperty('cadence');
  });

  test('assertValidQuestInput throws with field errors', () => {
    expect(() => assertValidQuestInput({ ...validInput, title: '' })).toThrow(
      expect.objectContaining({ code: 'INVALID_QUEST', fieldErrors: expect.objectContaining({ title: expect.any(String) }) }),
    );
  });
});
