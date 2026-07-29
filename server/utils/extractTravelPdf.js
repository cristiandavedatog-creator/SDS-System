const { PDFParse } = require('pdf-parse');
const { createWorker } = require('tesseract.js');

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

// Builds a YYYY-MM-DD string from the regex-captured parts directly, rather
// than going through a Date object — a locale/timezone-aware Date parse of
// a bare "Month Day, Year" string gets interpreted as local midnight, and
// converting that to an ISO string can shift the date by a day depending
// on the server's UTC offset. Working from the text alone avoids that.
function toISODate(monthName, day, year) {
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function clean(value, maxLength = 300) {
  if (!value) return null;
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (!collapsed || collapsed.length > maxLength) return null;
  return collapsed;
}

// Some of these forms bunch every field's label together in one block,
// then every value in a second block — when that happens, a naive
// "capture up to the next label" regex sometimes grabs another field's
// *label text itself* (e.g. captures the literal word "Destination" as if
// it were the purpose) instead of failing to match. This catches that:
// reject anything that's really just one of the form's own labels, or a
// known placeholder that's only ever valid for a different field
// (Designation's "as stated above" leaking into Purpose/Host/etc.).
const REJECTED_VALUES = new Set([
  'purposeoftravel', 'destination', 'hostofactivity', 'fundsource',
  'inclusivedates', 'officialstation', 'positiondesignation', 'designation',
  'name', 'asstatedabove',
]);

function isRejectedValue(value) {
  if (!value) return true;
  const normalized = value.replace(/[^a-z]/gi, '').toLowerCase();
  return !normalized || REJECTED_VALUES.has(normalized);
}

// OCR frequently misreads a bullet/border mark at the start of a line as
// one of a few junk characters, or as a stray single lowercase-letter
// token — this strips both without ever touching the start of a real
// word (never eats the "E" off "EMELDA", since that's glued directly
// onto the rest of the word with no whitespace after it).
function stripLeadingNoise(line) {
  let cleaned = line.replace(/^[\s|•*.\-–—¢]+/, '');
  cleaned = cleaned.replace(/^[a-z]\s+(?=[A-Z])/, '');
  return cleaned;
}

// Cleans a possibly multi-line captured value: strips leading noise from
// every line independently (not just the first), then collapses to a
// single line. Used for the free-text fields (Purpose, Host, Destination)
// where OCR border artifacts can reappear at the start of each wrapped
// line, not just the very first one.
function cleanMultiline(value, maxLength = 300) {
  if (isRejectedValue(value)) return null;
  const perLine = value.split('\n').map(stripLeadingNoise).join(' ');
  return clean(perLine, maxLength);
}

// Words that only ever occur inside a position/designation/office title on
// this form, never inside a person's actual name — used below to reject a
// line that's really an unlabeled position (a form prints it on its own
// line, with no "Designation:" label in front of it) even though it's
// shaped just like a real name (multiple capitalized words).
const DESIGNATION_WORDS = new Set([
  'EPS', 'SEPS', 'PSDS', 'SDS', 'ASDS', 'OIC', 'CID', 'SGOD', 'ALS', 'PDO',
  'ENGR', 'DRRM', 'HRMO', 'ADAS', 'ICT', 'MEP', 'NIP', 'LDM', 'ADMIN', 'AIDE',
  'DRIVER', 'TEACHER', 'PRINCIPAL', 'HEAD', 'CHIEF', 'SUPERVISOR', 'SP', 'HT',
  'SPECIALIST', 'COORDINATOR', 'OFFICER', 'FOCAL', 'PERSON', 'DIVISION',
  'PROGRAM', 'EDUCATION', 'ASSISTANT', 'DESIGNATE', 'SECRETARY',
  'SUPERINTENDENT', 'SCHOOL', 'SCHOOLS',
]);

function isDesignationOnly(upperWords) {
  return upperWords.length > 0 && upperWords.every((w) => DESIGNATION_WORDS.has(w) || /^[IVX]+$/.test(w));
}

// A long entry in a multi-traveler list sometimes wraps its trailing
// school name onto its own line (e.g. "MARIMYN ... MAGISTRADO, SP II," /
// "Malasugui ES") — that continuation line has nothing to split on and
// would otherwise look like a two-word name. A standalone line ending in
// one of these school-type abbreviations is never actually a person's
// name in this dataset (a real surname never appears as its own separate
// word "ES"/"HS"/etc.), so it's rejected outright.
const SCHOOL_SUFFIX_WORDS = new Set(['ES', 'HS', 'NHS', 'IS', 'CS', 'SPED']);

// Boilerplate that's printed verbatim on every copy of this form. Normally
// irrelevant to name extraction, but if the "NAME" label match below ever
// latches onto a stray earlier occurrence of those letters (seen on a
// handful of heavily-garbled OCR scans), the header text in between ends
// up looking like name-block candidates — most of it is mixed-case and
// already fails the shape check, but the form's own title and a couple of
// header lines are printed in true block caps and would otherwise slip
// through as a bogus "traveler".
const NAME_BLOCK_BOILERPLATE = new Set([
  'travelauthorityforofficialtravel',
  'schoolsdivisionofficeofcamarinesnorte',
  'republicofthephilippines',
  'departmentofeducation',
  'regionvbicol',
  'regionv',
]);

// A stray digit and/or "+" shows up before a traveler's name when OCR
// misreads a bullet/checkbox glyph as one or both of those characters.
// Kept separate from the shared stripLeadingNoise (used by the free-text
// fields too) since a real street/house number can legitimately open a
// Destination line — this is only safe to strip in the NAME block
// specifically.
function stripLeadingNameNoise(line) {
  let cleaned = stripLeadingNoise(line);
  // A short stray lowercase blob (1-2 chars, e.g. "eo") sometimes appears
  // where OCR misread a bullet/checkbox glyph — broader than the 1-char
  // version in stripLeadingNoise above, but scoped to names only: a
  // free-text field could legitimately start with a real short lowercase
  // word (e.g. OCR lowercasing "To Prepare..." into "to Prepare...").
  cleaned = cleaned.replace(/^[a-z]{1,2}\s+(?=[A-Z])/, '');
  cleaned = cleaned.replace(/^\d*\+?\s*(?=[A-Z])/, '');
  return cleaned;
}

// Captures every traveler's name from the form's NAME block — a single
// name for a one-person trip, or one per line for a multi-traveler trip
// (each line typically reads "NAME - TITLE" or "NAME, TITLE1, TITLE2").
// Position/Station are deliberately not parsed out of this block at all —
// they're looked up from the matching employee record instead (see the
// route handler), which is far more reliable than trying to read them off
// a form that often just says "As stated above".
function extractTravelerNames(text) {
  // "N?AME" tolerates OCR dropping the leading "N" (seen on real scans,
  // e.g. reading "NAME" as "AME") — safe to relax since a bare "AME"
  // never occurs as its own word elsewhere (words like "GAME"/"FAME"
  // don't have a word boundary right before "AME", so \b already excludes
  // them without needing this to be any more specific).
  const nameBlockMatch = text.match(/\bN?AME\b\s*\n?([\s\S]*?)\b(?:Position\s*\/?\s*Designation|Designation|Official Station)\b/i);
  if (!nameBlockMatch) return [];

  const names = [];
  for (const rawLine of nameBlockMatch[1].split('\n')) {
    const line = stripLeadingNameNoise(rawLine);
    if (!line.trim()) continue;

    // The name is whatever comes before a " - ", em dash, or comma that
    // introduces a position/title (e.g. "AMY B. DUMAIL - EPS, LRMS").
    const splitMatch = line.match(/^(.+?)\s*[-–—,]\s*.+$/);
    let name = (splitMatch ? splitMatch[1] : line).trim();
    // Trailing stray lowercase letter (border noise) — real surnames are
    // always capitalized, so this is never a legitimate name component.
    name = name.replace(/\s+[a-z]$/, '').trim();

    // Some copies drop the comma that's supposed to separate the name
    // from its position (e.g. "ZOILO D. CERENO SP II, Bulhao ES" is
    // missing the comma after "CERENO"), so the split above grabs the
    // position/designation code along with the name. Trim a trailing run
    // of designation words/roman numerals, or a trailing symbol/digit with
    // no real letters at all (e.g. "LOURDES G. ESGUERRA !", "WILMA JOY M.
    // DEL MONTE -" — a border artifact OCR left stuck to the end of the
    // line) — a real name never ends in either — stopping once at least a
    // given name and surname are left.
    // A token that's purely symbols/digits with zero real letters (e.g.
    // "()" from OCR mangling a middle name badly enough to leave only
    // punctuation) can land in the *middle* of the name, not just the
    // edges the trims below handle — drop it outright, same as the edge
    // cases, since a real name is never a bare symbol. The one exception
    // is a single-character-plus-period token ("0." for a middle initial
    // "O." OCR misread as a digit) — that's meaningful, not noise, even
    // though it has no letters either.
    let words = name.split(/\s+/).filter((w) => /[A-Za-z]/.test(w) || /^[A-Z0-9]\.$/i.test(w));
    while (words.length > 2) {
      const last = words[words.length - 1].toUpperCase().replace(/[^A-Z]/g, '');
      const lastHasNoLetters = !/[A-Za-z]/.test(words[words.length - 1]);
      if (DESIGNATION_WORDS.has(last) || /^[IVX]+$/.test(last) || lastHasNoLetters) {
        words.pop();
      } else {
        break;
      }
    }
    // Symmetric problem at the front: a border artifact (slash, bracket,
    // tilde, or a single stray letter like "S" from "NAME/ S ATTY...")
    // sometimes lands before the real name instead of after it, sometimes
    // glued directly onto the first real word with no space (e.g.
    // "[JAY L. DELA TORRE"). A real name always starts with a full word
    // (the given name, or a title prefix like "Atty.") — never a lone
    // letter or a symbol — so trim/strip leading noise until one is found.
    while (words.length > 2) {
      const stripped = words[0].replace(/^[^A-Za-z0-9]+/, '');
      const letters = stripped.replace(/[^A-Za-z]/g, '');
      if (letters.length >= 2 && /^[A-Z]/.test(stripped)) {
        words[0] = stripped;
        break;
      }
      words.shift();
    }
    // The loop above only fires while more than 2 words remain, so once
    // trimming has already brought the count down to exactly 2 (e.g.
    // "__ |PETERE. MORTEGA" -> "|PETERE." "MORTEGA"), a symbol still glued
    // onto the front word never gets cleaned. Do that pass unconditionally
    // — it only ever strips characters, never removes a whole word, so
    // it can't shrink below the 2-word floor.
    if (words.length >= 2) {
      const stripped = words[0].replace(/^[^A-Za-z0-9]+/, '');
      const letters = stripped.replace(/[^A-Za-z]/g, '');
      if (letters.length >= 2 && /^[A-Z]/.test(stripped)) words[0] = stripped;
    }
    name = words.join(' ');

    if (name.length < 4 || name.length > 60) continue;

    // Needs at least a given name and a surname, with every word either
    // capitalized or a single OCR-garbled initial (e.g. "0." where OCR
    // misread the letter "O" as a zero). Note this deliberately does NOT
    // require a *clean* middle initial: the primary signee on a form is
    // often typed in full caps while other travelers added to the same
    // list are just typed in ordinary Title Case, and plenty of real
    // names have no middle initial recorded at all — requiring one here
    // previously threw away a large share of genuine names (e.g. "GLEN
    // DUGAN", "Romnick Esturas").
    // A stray digit sometimes lands at the very start of one interior word
    // (e.g. "1RARO" for "RARO" — a table border numeral bleeding into the
    // text), distinct from the whole-token digit noise the trims above
    // handle — tolerate it here by stripping just the leading digits and
    // re-checking, using the cleaned form if that reveals a real word.
    const cleanWord = (w) => {
      if (/^[A-Z]/.test(w) || /^[A-Z0-9]\.$/.test(w)) return w;
      const withoutLeadingDigits = w.replace(/^\d+/, '');
      if (withoutLeadingDigits.length >= 2 && /^[A-Z]/.test(withoutLeadingDigits)) return withoutLeadingDigits;
      return null;
    };
    const cleanedWords = words.map(cleanWord);
    if (words.length < 2 || cleanedWords.some((w) => w === null)) continue;
    words = cleanedWords;
    name = words.join(' ');

    const upperWords = words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter(Boolean);
    const normalized = name.replace(/[^a-z]/gi, '').toLowerCase();
    if (isDesignationOnly(upperWords)) continue;
    if (SCHOOL_SUFFIX_WORDS.has(upperWords[upperWords.length - 1])) continue;
    if (NAME_BLOCK_BOILERPLATE.has(normalized)) continue;

    names.push(name);
  }
  return names;
}

// "August 25-29, 2024" / "August 25 - September 2, 2024" / "August 25, 2024".
function parseInclusiveDates(raw) {
  if (!raw) return { datesFrom: null, datesTo: null };
  const rangeMatch = raw.match(/([A-Za-z]+)\.?\s+(\d{1,2})\s*[-–]\s*(?:([A-Za-z]+)\.?\s+)?(\d{1,2}),?\s*(\d{4})/);
  if (rangeMatch) {
    const [, month1, day1, month2, day2, year] = rangeMatch;
    return {
      datesFrom: toISODate(month1, day1, year),
      datesTo: toISODate(month2 || month1, day2, year),
    };
  }
  const singleMatch = raw.match(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s*(\d{4})/);
  if (singleMatch) {
    const [, month, day, year] = singleMatch;
    const iso = toISODate(month, day, year);
    return { datesFrom: iso, datesTo: iso };
  }
  return { datesFrom: null, datesTo: null };
}

// Best-effort field extraction for the DepEd Travel Authority form.
// Employee/Position/Station are deliberately NOT attempted here — in this
// app they're tied to selecting an existing employee record, and travel
// authorities frequently cover multiple travelers with a collapsed
// "As stated above" position field, so there's no reliable single name to
// match against the employee list. Purpose, Host, Inclusive Dates,
// Destination, and Fund Source are the fields worth extracting: every
// field is independently regex-anchored, so one that can't be found (or a
// form whose layout is too different from what these patterns expect)
// simply comes back null instead of guessing wrong.
function extractTravelFields(text) {
  const fields = {
    purpose: null,
    host: null,
    datesFrom: null,
    datesTo: null,
    destination: null,
    travelerNames: extractTravelerNames(text),
  };

  // Host of Activity moves around between form revisions — sometimes right
  // before Inclusive Dates, sometimes between Destination and Fund Source
  // — so every capture below treats it as an optional stop point wherever
  // it might land, rather than assuming one fixed position. Captures are
  // bounded to a handful of lines (not unbounded) so a form that groups
  // all its labels together and only reaches the real terminator many
  // lines later fails to match at all instead of swallowing unrelated
  // fields in between. The terminator itself allows arbitrary non-newline
  // characters right before the label text (not just whitespace), since
  // OCR often leaves a stray border character (e.g. "| Host of Activity")
  // that would otherwise block the match entirely.
  // "Travel" in the label itself sometimes comes out misread (e.g. "Purpose
  // of Revel") when OCR struggles with that specific word, so only "Purpose
  // of <some word>" is required, not the exact spelling.
  const purposeMatch = text.match(/Purpose of \w+\.?\s+((?:[^\n]*\n){0,4}?[^\n]*?)\r?\n[^\n]*?(?:Host of Activity|Inclusive Dates|Date)/i);
  // The "Inclusive Dates"/"Date" terminator can legitimately sit a couple
  // of lines further down than a "Destination" label that comes first —
  // when that happens, the capture above reaches past Destination's own
  // label+value on its way there. Truncating at "Destination" afterward
  // is safe (it only ever appears as a label, never as real purpose
  // content) without needing to touch the terminator list itself, which
  // risks reaching too far on other documents (see Destination/dates
  // interplay in the comments above).
  fields.purpose = cleanMultiline(purposeMatch?.[1]?.replace(/\bDestination\b[\s\S]*$/i, ''));

  const hostMatch = text.match(/Host of Activity\s+((?:[^\n]*\n){0,3}?[^\n]*?)\r?\n[^\n]*?(?:Inclusive Dates|Date|Destination|Fund Source)/i);
  fields.host = cleanMultiline(hostMatch?.[1]);

  // The date label itself isn't always spelled out as "Inclusive Dates" —
  // some copies just print "Date" — so that's accepted too, as long as
  // it's a whole word (avoids matching inside an unrelated word).
  let datesMatch = text.match(/\b(?:Inclusive\s+)?Dates?\b\s*:?\s*([^\n]*)\r?\n/i);
  let datesParsed = parseInclusiveDates(isRejectedValue(datesMatch?.[1]) ? null : datesMatch?.[1]);

  // Some forms merge "Purpose of Travel / Inclusive Dates" into a single
  // combined label, with the purpose text immediately following it and
  // the actual date value 1-2 lines further down — only reached by
  // widening the search once the immediate line fails to parse as a real
  // date. This can't be the default/only attempt: when "Destination" is
  // too garbled to match (a separate, real issue on some scans), the
  // widened search would otherwise stretch all the way to "Host of
  // Activity" as its terminator, swallowing the actual destination text
  // in between and corrupting the anchor position the destination
  // fallback below relies on — so the short match is always preferred
  // when it already found a valid date, and the wider one only replaces
  // it when the short one came up empty.
  if (!datesParsed.datesFrom) {
    const widerMatch = text.match(/\b(?:Inclusive\s+)?Dates?\b\s*:?\s*([\s\S]{1,150}?)\r?\n[^\n]*?(?:Destination|Fund Source|Host of Activity|$)/i);
    const widerParsed = parseInclusiveDates(isRejectedValue(widerMatch?.[1]) ? null : widerMatch?.[1]);
    if (widerParsed.datesFrom) {
      datesMatch = widerMatch;
      datesParsed = widerParsed;
    }
  }
  const { datesFrom, datesTo } = datesParsed;
  fields.datesFrom = datesFrom;
  fields.datesTo = datesTo;

  // A destination spans multiple wrapped lines fairly often, so a border
  // artifact (a stray "|" from OCR misreading the form's box lines) can
  // show up at the start of each one — never legitimate in an address, so
  // it's safe to strip outright rather than just from the ends. Some
  // copies also misplace the word "Destination" itself into the middle of
  // a multi-line value (the label sits beside a tall multi-day cell, so
  // OCR's reading order drops it in wherever it lands vertically) — strip
  // that out too rather than leaving it embedded in the middle of the text.
  const cleanDestination = (value, maxLength = 300) => {
    if (isRejectedValue(value)) return null;
    const perLine = value?.split('\n').map(stripLeadingNoise).join(' ');
    const stripped = perLine?.replace(/\|/g, ' ').replace(/\bDestination\b/gi, ' ');
    return clean(stripped, maxLength);
  };

  const destinationMatch = text.match(/Destination\s*\n?((?:[^\n]*\n){0,3}?[^\n]*?)\r?\n[^\n]*?(?:Host of Activity|Fund Source|Inclusive Dates|Date)/i);
  fields.destination = cleanDestination(destinationMatch?.[1]);

  // OCR occasionally garbles the word "Destination" itself badly enough
  // that it's unrecognizable (split across lines into nonsense fragments)
  // even though the actual destination text right next to it is legible.
  // When that happens, fall back to whatever sits between the Date value
  // and the next recognized label — Destination always lives in that gap
  // regardless of which field order this particular form uses. Purpose/
  // Host only count as valid stop-points here if they actually appear
  // AFTER the date in THIS document — on forms where they're printed
  // before Date instead, they've already been consumed earlier and
  // searching for their text again would incorrectly cut the destination
  // short at the wrong place (or not trigger at all), so in that case the
  // search instead runs the full, unbounded distance to "Fund Source" —
  // a multi-day itinerary destination can be much longer than one line,
  // and "Fund Source" is distinctive enough that searching all the way to
  // it is still safe.
  if (!fields.destination && datesMatch) {
    const dateEndIndex = datesMatch.index + datesMatch[0].length;
    const afterDates = text.slice(dateEndIndex);
    const terminators = ['Fund\\s*Source'];
    if (purposeMatch && purposeMatch.index > dateEndIndex) terminators.push('Purpose of \\w+');
    if (hostMatch && hostMatch.index > dateEndIndex) terminators.push('Host of Activity');
    const fallbackMatch = afterDates.match(new RegExp(`^([\\s\\S]*?)\\r?\\n[^\\n]*?(?:${terminators.join('|')})`, 'i'));
    fields.destination = cleanDestination(fallbackMatch?.[1], 600);
  }

  // Source of Fund is not extracted — this office only ever uses Local
  // Fund, so the value is fixed in the form/route rather than read from
  // the PDF. "Fund Source" is still used above as a terminator/anchor for
  // the other fields, since that label's position is still meaningful.

  return fields;
}

const EMPTY_FIELDS = {
  purpose: null,
  host: null,
  datesFrom: null,
  datesTo: null,
  destination: null,
  travelerNames: [],
};

// Renders just page 1 as a PNG and runs it through Tesseract OCR — every
// field we care about lives on page 1 (later pages are just
// certification/signature boilerplate). Used only when the PDF has no
// text layer of its own, i.e. a scanned image rather than a
// digitally-generated document.
async function ocrFirstPage(buffer) {
  const parser = new PDFParse({ data: buffer });
  const shot = await parser.getScreenshot({ scale: 2, first: 1, imageDataUrl: false });
  await parser.destroy();

  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(shot.pages[0].data);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

// Runs the PDF through pdf-parse and extracts what it can. Returns
// hasText: false only when NEITHER the PDF's own text layer NOR an OCR
// pass over page 1 turned up anything readable, so the caller can show a
// clear "couldn't read this one" message instead of a vague "some fields
// are blank".
async function extractTravelPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  const { text } = await parser.getText();
  await parser.destroy();
  // pdf-parse inserts its own "-- N of M --" page separators even when a
  // page has no real text at all, so a scanned PDF with zero actual
  // content still comes back non-empty if that's all we check for.
  const meaningfulText = text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').trim();

  let finalText = text;
  let hasText = meaningfulText.length > 0;

  if (!hasText) {
    try {
      const ocrText = await ocrFirstPage(buffer);
      if (ocrText && ocrText.trim().length > 0) {
        finalText = ocrText;
        hasText = true;
      }
    } catch (err) {
      console.error('OCR fallback failed:', err);
    }
  }

  return {
    hasText,
    fields: hasText ? extractTravelFields(finalText) : EMPTY_FIELDS,
  };
}

module.exports = { extractTravelPdf, extractTravelFields, extractTravelerNames };
