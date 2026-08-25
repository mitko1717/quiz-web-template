// ⚠️ Do NOT edit per theme. All theme values come from env.
// Set them in .env / .env.local (see .env.example). Copy the app, change env, done.

function req(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function parseScopes(raw: string | undefined): Array<{ value: string; labelKey: string }> {
  // Format: "value:labelKey,value:labelKey"  e.g. "WORLD:scope.world,europe:scope.europe"
  if (!raw) return [];
  return raw.split(',').map((pair) => {
    const [value, labelKey] = pair.split(':');
    return { value: value.trim(), labelKey: (labelKey ?? value).trim() };
  });
}

export const topicConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Quiz',
  slug: req('NEXT_PUBLIC_TOPIC_SLUG', process.env.NEXT_PUBLIC_TOPIC_SLUG),

  publicFields: {
    displayName: req('NEXT_PUBLIC_FIELD_DISPLAY_NAME', process.env.NEXT_PUBLIC_FIELD_DISPLAY_NAME),
    badge: process.env.NEXT_PUBLIC_FIELD_BADGE || null, // empty/unset => no badge
  },

  scopeParam: process.env.NEXT_PUBLIC_SCOPE_PARAM || 'continent',
  worldScopeValue: process.env.NEXT_PUBLIC_SCOPE_WORLD || 'WORLD',
  scopes: parseScopes(process.env.NEXT_PUBLIC_SCOPES),
  maxItemCount: Number(process.env.NEXT_PUBLIC_MAX_ITEM_COUNT) || 9999,
} as const;

export type TopicConfig = typeof topicConfig;