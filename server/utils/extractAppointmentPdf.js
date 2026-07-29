const { PDFParse } = require('pdf-parse');
const { createWorker } = require('tesseract.js');

// Known dropdown values from the Create/Edit Appointment forms — matching
// against these (rather than capturing arbitrary text) makes Status/Nature
// extraction reliable even when the surrounding OCR text is garbled.
const STATUS_OPTIONS = ['PERMANENT', 'TEMPORARY', 'PROVISIONAL', 'SUBSTITUTE'];
const NATURE_OPTIONS = ['ORIGINAL', 'PROMOTION', 'RECLASSIFICATION', 'REAPPOINTMENT', 'REEMPLOYMENT', 'TRANSFER', 'DEMOTION'];

// Collapses runs of whitespace and discards anything implausibly long —
// a sign the regex ran past its intended field into surrounding template text.
function clean(value, maxLength = 80) {
  if (!value) return null;
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (!collapsed || collapsed.length > maxLength) return null;
  return collapsed;
}

// OCR frequently misreads the form's box/border lines as a stray |, \, or /
// glued onto either end of whatever real text was on that line — strip it.
function stripTrailingNoise(value) {
  if (!value) return value;
  return value.replace(/^[\s|\\/]+/, '').replace(/[\s|\\/]+$/, '').trim();
}

// Fragments of surrounding template text/boilerplate that end up mixed into
// the remarks capture below, since its exact position relative to the two
// hint labels isn't stable — strip them out before deciding whether
// anything meaningful is actually there.
function stripRemarksBoilerplate(value) {
  if (!value) return value;
  return value
    .replace(/OSEC-DECSB-[A-Z0-9]+/gi, ' ')
    .replace(/\d{5,7}-\d{4}/g, ' ')
    .replace(/page\s*\(?[a-z]*\)?\s*\.?/gi, ' ')
    .replace(/\bwho\b/gi, ' ')
    .replace(/[,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const REMARKS_FILLER_WORDS = new Set(['with', 'who', 'under', 'na']);

// True when there's nothing worth reporting — either genuinely empty, just
// "N/A" (plus maybe a couple of stray characters OCR misread from the
// form's border alongside it), or one of the template's own words leaking
// in with no real remark text attached to it.
function isBlankRemarks(value) {
  if (!value) return true;
  const withoutNA = value.replace(/N\/?A/gi, '').replace(/[^a-z0-9]/gi, '');
  if (withoutNA.length <= 3) return true;
  const bareWord = value.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return REMARKS_FILLER_WORDS.has(bareWord);
}

// Best-effort field extraction for the DepEd CS Form No. 33-B appointment
// template. Every field is independently regex-anchored to a fixed phrase
// on the form, so a field that isn't found (different template, OCR noise,
// scanned image with no text layer at all) simply comes back null instead
// of throwing — the caller leaves those blank for manual entry.
function extractAppointmentFields(text) {
  const fields = {
    name: null,
    positionTitle: null,
    schoolOffice: null,
    statusOfAppointment: null,
    natureAppointment: null,
    itemNo: null,
    remarks: null,
  };

  // The name always ends up on the line immediately before the one
  // containing "appointed as" — sometimes still attached to the
  // "Mr./Mrs./Ms.:" label on that same line, sometimes separated from it
  // (unrelated letterhead text lands in between, in extraction order, in
  // older form revisions). OCR output can also prefix that line with a
  // stray character misread from the form's border, so "appointed as"
  // isn't always the very first thing on the line — just require it to
  // appear somewhere on the line right after the captured one.
  const nameLineMatch = text.match(/\n(.{2,60})\n[^\n]*appointed as/i);
  let rawName = nameLineMatch?.[1];
  if (rawName) {
    // Strip the "Mr./Mrs./Ms.:" label and anything before it, wherever it
    // falls in the line (OCR sometimes puts a stray character in front of
    // it too) — if the label isn't there at all, the line is just the name.
    const labelMatch = rawName.match(/Mr\.?\/Mrs\.?\/Ms\.?:?\s*/i);
    rawName = labelMatch ? rawName.slice(labelMatch.index + labelMatch[0].length) : rawName;
    rawName = stripTrailingNoise(rawName);
  }
  fields.name = clean(rawName);

  const positionMatch = text.match(/appointed as\s+(.+?)\s+\(SG/i);
  fields.positionTitle = clean(positionMatch?.[1]);

  const statusPattern = new RegExp(`\\b(${STATUS_OPTIONS.join('|')})\\b\\s+status at the`, 'i');
  const statusMatch = text.match(statusPattern);
  fields.statusOfAppointment = statusMatch ? statusMatch[1].toUpperCase() : null;

  const officeMatch = text.match(/status at the\s+(.+?)\r?\n/i);
  let officeRaw = clean(officeMatch?.[1]);
  officeRaw = officeRaw ? stripTrailingNoise(officeRaw) : officeRaw;
  // Some copies of the form run the next line's "...with a" straight onto
  // the office name with no line break — sometimes truncated to "...with",
  // sometimes glued together as "...witha" by OCR spacing errors.
  fields.schoolOffice = officeRaw ? officeRaw.replace(/\s*with\s*a?\.?$/i, '').trim() || null : null;

  // The form's fill-in-the-blank underline sometimes survives extraction
  // as a literal run of underscores between the anchor phrase and the
  // actual value (e.g. "...is _ RECLASSIFICATION"), so allow for it here.
  const naturePattern = new RegExp(`nature of this appointment is\\s*_*\\s*(${NATURE_OPTIONS.join('|')})\\b`, 'i');
  const natureMatch = text.match(naturePattern);
  fields.natureAppointment = natureMatch ? natureMatch[1].toUpperCase() : null;

  // The full Item No. on this form is actually two parts printed as two
  // stacked lines: an "OSEC-DECSB-<code>" position code (e.g. "TCH2",
  // "HTEACH1", "ADA6") directly above the numeric "######-####" plantilla
  // number/year. Both belong to the same field — capture each separately
  // (their line ordering relative to each other and to the "Item No."
  // label isn't stable) and join them back into the one value the form
  // shows. Digit lookarounds (not \b) are used because the same
  // underline artifact as above sometimes wraps the number in
  // underscores, which \b treats as part of the word and would otherwise
  // block the match.
  const itemCodeMatch = text.match(/OSEC-DECSB-[A-Z0-9]+/i);
  const itemNumberMatch = text.match(/(?<!\d)(\d{5,7}-\d{4})(?!\d)/);
  fields.itemNo = itemCodeMatch && itemNumberMatch
    ? `${itemCodeMatch[0].toUpperCase()} ${itemNumberMatch[1]}`
    : (itemNumberMatch ? itemNumberMatch[1] : null);

  // The "vice [predecessor], who [reason]" clause is where remarks like
  // "MATERNITY LEAVE 04/10/2026-07/23/2026" or "PROMOTED TEACHER III
  // EFFECTIVE 04/17/2024" actually live — but its position relative to the
  // two hint labels and the plantilla code isn't stable across documents,
  // so two candidate spots are tried: right after the "(Original,
  // Promotion, etc.)" label, and right before "with Plantilla Item No."
  // (after stripping the plantilla code that sometimes sits on that same
  // line). Whichever one isn't just boilerplate/"N/A" wins; if both are,
  // there's genuinely nothing to report.
  const afterLabelMatch = text.match(/\(Original[^)]{0,25}\)\s*\n([^\n]*?)(?=with\s*Plantilla|\n|$)/i);
  const candidateA = stripRemarksBoilerplate(afterLabelMatch?.[1]);

  const beforeItemMatch = text.match(/\n([^\n]*?)with\s*Plantilla\s*Item\s*No\.?/i);
  const candidateB = stripRemarksBoilerplate(beforeItemMatch?.[1]);

  let rawRemarks = null;
  if (!isBlankRemarks(candidateB)) rawRemarks = candidateB;
  else if (!isBlankRemarks(candidateA)) rawRemarks = candidateA;
  fields.remarks = clean(stripTrailingNoise(rawRemarks), 200);

  return fields;
}

const EMPTY_FIELDS = {
  name: null,
  positionTitle: null,
  schoolOffice: null,
  statusOfAppointment: null,
  natureAppointment: null,
  itemNo: null,
  remarks: null,
};

// Renders just page 1 as a PNG and runs it through Tesseract OCR — every
// field we care about lives on page 1 (page 2+ is certification/signature
// boilerplate), so there's no need to pay the OCR time cost on more pages
// than that. Used only when the PDF has no text layer of its own, i.e. a
// scanned image rather than a digitally-generated document.
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
async function extractAppointmentPdf(buffer) {
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
    // No embedded text layer at all — this is a scanned image. Fall back
    // to OCR before giving up, since that's the norm for these documents
    // in practice, not the exception.
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
    fields: hasText ? extractAppointmentFields(finalText) : EMPTY_FIELDS,
  };
}

module.exports = { extractAppointmentPdf, extractAppointmentFields };
