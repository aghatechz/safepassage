// Red-Flag Detector Utility for SafePassage

const SCAM_KEYWORDS = [
  { phrase: 'pay before visa', label: 'Payment requested prior to visa issuance' },
  { phrase: 'processing fee', label: 'Upfront processing fees requested' },
  { phrase: 'visa fee', label: 'Upfront visa fees' },
  { phrase: 'deposit required', label: 'Cash deposit requested upfront' },
  { phrase: 'no written contract', label: 'No formal written contract provided' },
  { phrase: 'tourist visa for work', label: 'Suggestion to work on a tourist/visit visa' },
  { phrase: 'guaranteed visa', label: 'Guaranteed visa promise (highly suspicious)' },
  { phrase: 'training fee', label: 'Mandatory paid training as a condition for job' },
  { phrase: 'medical fee', label: 'Mandatory paid medical tests at specified clinic' },
  { phrase: 'keep original passport', label: 'Requirement to surrender original passport' },
  { phrase: 'charge for interview', label: 'Charges for conducting job interview' }
];

/**
 * Scans a text string for common scam keywords and returns a list of labels representing matching red flags.
 * @param {string} text - The report description text to analyze.
 * @returns {string[]} - Array of matching red flag labels.
 */
const detectRedFlags = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const normalizedText = text.toLowerCase();
  const matchedFlags = [];

  for (const item of SCAM_KEYWORDS) {
    if (normalizedText.includes(item.phrase)) {
      matchedFlags.push(item.label);
    }
  }

  return matchedFlags;
};

module.exports = {
  detectRedFlags,
  SCAM_KEYWORDS
};
