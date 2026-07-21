// Shared status palette so every travel widget (Navigator, Overview, tables) agrees
// on what color "ongoing", "upcoming", etc. mean. Previously Navigator.jsx and
// Overview.jsx disagreed on the color for "ongoing" (blue vs orange) — this is
// the single source of truth now.
export const TRAVEL_STATUS_COLORS = {
  total: { bg: '#ffffff', border: '#2ECC71', text: '#2ECC71' },
  ongoing: { bg: '#E3F2FD', border: '#3498DB', text: '#3498DB' },
  upcoming: { bg: '#FFDFDF', border: '#FF0000', text: '#FF0000' },
  completed: { bg: '#F2EAF6', border: '#9B59B6', text: '#9B59B6' },
};
