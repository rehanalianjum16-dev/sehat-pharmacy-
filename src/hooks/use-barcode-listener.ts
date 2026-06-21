import { useEffect, useRef } from 'react';

interface UseBarcodeListenerOptions {
  onScan: (barcode: string) => void;
  characterDelayThresholdMs?: number; // Keystroke speed limit (usually 20-30ms for hardware)
  minBarcodeLength?: number;
}

export function useBarcodeListener({
  onScan,
  characterDelayThresholdMs = 25,
  minBarcodeLength = 5
}: UseBarcodeListenerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const delay = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Ignore modifiers
      if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
        return;
      }

      // If scanner sends 'Enter' indicating end of barcode
      if (event.key === 'Enter') {
        if (bufferRef.current.length >= minBarcodeLength) {
          // Verify delay consistency to make sure it was a scanner and not a manual 'Enter' keypress
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
        return;
      }

      // If delay between keystrokes is too long, it's a human typist. Clear buffer.
      // However, we allow the very first character to have a long delay.
      if (bufferRef.current.length > 0 && delay > characterDelayThresholdMs) {
        bufferRef.current = '';
      }

      // Append alphanumeric characters
      if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, characterDelayThresholdMs, minBarcodeLength]);
}
