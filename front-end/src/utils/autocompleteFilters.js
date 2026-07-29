// MUI Autocomplete's default filter matches anywhere in the label and
// keeps the original option order, so typing "San" can bury "San Felipe
// ES" below unrelated schools that merely contain "san" somewhere in the
// name. This ranks options whose label starts with what's typed above
// ones that just contain it elsewhere, which is what people actually
// expect from a school/office picker.
export function startsWithFirstFilter(getLabel) {
  return (options, { inputValue }) => {
    const input = inputValue.trim().toLowerCase();
    if (!input) return options;

    const startsWith = [];
    const contains = [];
    for (const option of options) {
      const label = (getLabel(option) || '').toLowerCase();
      if (label.startsWith(input)) startsWith.push(option);
      else if (label.includes(input)) contains.push(option);
    }
    return [...startsWith, ...contains];
  };
}
