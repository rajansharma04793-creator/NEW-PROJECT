// Lumina AI Voice Readout and Speech Synthesis Utility

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Cleans markdown formatting, special chars, and emojis from text for natural speech synthesis
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers #, ##, ###
    .replace(/#{1,6}\s+/g, '')
    // Remove bold/italic **text** or *text* or __text__
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove markdown links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet characters
    .replace(/^[-*•+]\s+/gm, '')
    // Remove numbered lists markers
    .replace(/^\d+\.\s+/gm, '')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Replace multiple spaces/newlines
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a concise voice alert announcement for a trade signal
 */
export function generateSignalVoiceAlert(signal: {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  target1: number;
  stopLoss: number;
  timeframe?: string;
}): string {
  const cleanSymbol = signal.symbol.replace('/USDT', '').replace('/', ' ');
  if (signal.action === 'HOLD') {
    return `Lumina AI Market Alert: Sideways market detected on ${cleanSymbol}. Wait for confirmation and hold cash.`;
  }
  const isBuy = signal.action === 'BUY';
  return `Lumina AI Alert: ${isBuy ? 'Bullish Buy' : 'Bearish Sell'} signal generated for ${cleanSymbol} on ${signal.timeframe || '15 minute'} chart with ${signal.confidence} percent conviction. Entry at ${signal.entryPrice} dollars. Target one is ${signal.target1} dollars. Stop loss is ${signal.stopLoss} dollars.`;
}

/**
 * Speaks the provided text using the Web Speech Synthesis API
 */
export function speakText(
  text: string,
  options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis is not supported in this browser.');
    return false;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return false;

    // Detect if text is predominantly Hindi/Hinglish
    const isHindi = /karein|karo|samjhao|tezi|mandi|intezar|paisa|batayein|kharidein|bechein|sl lagayein|kaise/i.test(cleaned);

    const utterance = new SpeechSynthesisUtterance(cleaned);
    currentUtterance = utterance;

    utterance.rate = options?.rate ?? (isHindi ? 0.95 : 1.0);
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.lang = options?.lang || (isHindi ? 'hi-IN' : 'en-US');

    // Attempt to select an optimal voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (isHindi) {
        const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.lang.includes('IN'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const naturalVoice = voices.find((v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en'));
        if (naturalVoice) utterance.voice = naturalVoice;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      currentUtterance = null;
      options?.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Failed to speak text:', err);
    return false;
  }
}

/**
 * Stops ongoing speech synthesis
 */
export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * Checks if speech synthesis is currently speaking
 */
export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
