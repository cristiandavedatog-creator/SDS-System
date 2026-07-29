// Shared status palette so every travel widget (Overview, tables, chips) agrees
// on what color "ongoing", "upcoming", etc. mean. Tailored from the DepEd SDO
// Camarines Norte seal (green, blue, red, gold) rather than arbitrary colors.
export const TRAVEL_STATUS_COLORS = {
  total: { bg: '#fbf0dc', border: '#b8801f', text: '#b8801f' },
  ongoing: { bg: '#e5eef9', border: '#2e5c9a', text: '#2e5c9a' },
  upcoming: { bg: '#fbe8e7', border: '#c23b34', text: '#c23b34' },
  completed: { bg: '#e7f3ea', border: '#2f8f52', text: '#2f8f52' },
};
