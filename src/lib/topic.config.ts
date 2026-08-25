// ⚠️ TEMPLATE FILE — the ONLY file you edit when copying this app to a new theme.
// If you edit anything outside this file to change theme, that's a coupling leak.
//
// Topic is bound at LOGIN (engine issues a JWT via issueForTopic(..., slug)).
// Quiz/progress/profile/daily-challenge requests carry topic in the token — they
// send no topic themselves. So the only place `slug` is used is the auth call.

export const topicConfig = {
  // ⚠️ CHANGE PER THEME — must match a slug in the engine's topics.manifest.json.
  slug: 'capitals',

  // ⚠️ CHANGE PER THEME — request payload field name for the item id.
  // Capitals wire-compat uses 'countryId'; engine maps it to generic itemId.
  itemIdField: 'countryId',

  // ⚠️ CHANGE PER THEME — response fields the UI reads (from getPublicQuestionFields).
  publicFields: {
    displayName: 'countryName', // main label shown to the user
    badge: 'flagEmoji',         // small emoji/icon; set to null if the theme has none
  },

  // ⚠️ CHANGE PER THEME — scope filtering.
  // scopeParam: query-param name the engine reads. worldScopeValue: "all / no filter".
  scopeParam: 'continent',
  worldScopeValue: 'WORLD',

  // ⚠️ CHANGE PER THEME — scope options shown in the UI (value = what engine expects).
  scopes: [
    { value: 'WORLD', labelKey: 'scope.world' },
    // capitals: continents. planets: terrestrial/gas-giant/ice-giant/dwarf. etc.
  ],
} as const;

export type TopicConfig = typeof topicConfig;