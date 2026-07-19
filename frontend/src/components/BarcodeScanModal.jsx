import { useEffect, useRef, useState } from 'react';
import { X, Barcode, Camera } from 'lucide-react';

/**
 * Modal para ler um código de barras (EAN/UPC) com a câmara.
 * Fallback: introdução manual do código.
 * props: open, onClose, onDetect(code)
 */
export default function BarcodeScanModal({ open, onClose, onDetect }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = async () => {
      setError('');
      if (!supported) return; // mostra apenas o campo manual
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        scanningRef.current = true;
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
        const loop = async () => {
          if (!scanningRef.current || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) { finish(codes[0].rawValue); return; }
          } catch { /* ignora frames sem código */ }
          requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        setError(err.name === 'NotAllowedError'
          ? 'Permissão da câmara recusada. Introduza o código manualmente.'
          : 'Não foi possível abrir a câmara. Introduza o código manualmente.');
      }
    };
    start();
    return () => { cancelled = true; stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stop = () => {
    scanningRef.current = false;
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };
  const finish = (code) => { stop(); onDetect?.(code); onClose?.(); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="font-bold flex items-center gap-2"><Barcode size={18} /> Ler código de barras</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4">
          {supported && !error && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-brand-red-500 animate-pulse" />
              <div className="absolute bottom-2 inset-x-0 text-center text-white text-xs">Aponte a câmara ao código de barras</div>
            </div>
          )}
          {(!supported || error) && (
            <p className="text-sm text-brand-yellow-600 dark:text-brand-yellow-400">
              {error || 'O seu browser não suporta leitura pela câmara. Introduza o código manualmente.'}
            </p>
          )}
          <div>
            <label className="label">Ou introduza o código manualmente</label>
            <div className="flex gap-2">
              <input className="input font-mono" placeholder="Ex.: 5601312345678" value={manual}
                onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))} />
              <button onClick={() => manual && finish(manual)} disabled={!manual} className="btn-primary !px-4 disabled:opacity-40">
                <Camera size={16} /> Usar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
