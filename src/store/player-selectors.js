/** Selectors return values already stored in the snapshot, so they're referentially stable. */
export const selectProgression = (state) => state.progression;
export const selectAttributeProgress = (attributeKey) => (state) => state.progression.attributes[attributeKey];
export const selectIsPlayerReady = (state) => state.hydrationStatus === 'ready';
