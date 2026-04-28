import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Camera, X, Package, AlertCircle, CheckCircle2, RefreshCw, Keyboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/ui';
import api from '../lib/api';
import { formatCurrency, getStockStatus } from '../lib/format';

export default function QrScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [hasBarcodeAPI, setHasBarcodeAPI] = useState(false);
  const [product, setProduct] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHasBarcodeAPI('BarcodeDetector' in window);
    return () => stopScanner();
  }, []);

  const stopScanner = () => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setCameraError('');
    setProduct(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      scanningRef.current = true;

      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const scan = async () => {
          if (!scanningRef.current || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const code = codes[0].rawValue;
              stopScanner();
              lookupProduct(code);
              return;
            }
          } catch (e) {}
          requestAnimationFrame(scan);
        };
        scan();
      }
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permissão da câmara recusada. Autorize nas definições do browser.'
          : err.name === 'NotFoundError'
          ? 'Nenhuma câmara encontrada no dispositivo.'
          : 'Erro ao aceder à câmara: ' + err.message
      );
    }
  };

  const lookupProduct = async (code) => {
    setLookingUp(true);
    try {
      const { data } = await api.get(`/products/qr/${encodeURIComponent(code)}`);
      setProduct(data);
      toast.success(`Produto identificado: ${data.name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'QR code não reconhecido');
    } finally {
      setLookingUp(false);
    }
  };

  const handleManual = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setManualOpen(false);
    lookupProduct(manualCode.trim());
    setManualCode('');
  };

  const status = product ? getStockStatus(product) : null;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="QR Scanner"
        subtitle="Digitalize o QR Code colado na prateleira para identificar o produto."
      />

      {!scanning && !product && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-red-500 to-brand-yellow-500 flex items-center justify-center mb-6">
            <QrCode size={40} className="text-white" />
          </div>
          <h3 className="font-display text-2xl font-bold mb-2">Pronto para digitalizar</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
            Aponte a câmara do seu telemóvel para o código QR do produto. {!hasBarcodeAPI && ' (Se o browser não suportar leitura automática, use a opção manual.)'}
          </p>

          {cameraError && (
            <div className="mb-4 p-4 bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 rounded-xl text-sm text-brand-red-700 dark:text-brand-red-400 flex items-start gap-2 text-left">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={startScanner} className="btn-primary">
              <Camera size={18} /> Ativar câmara
            </button>
            <button onClick={() => setManualOpen(true)} className="btn-ghost">
              <Keyboard size={18} /> Introduzir código manualmente
            </button>
          </div>

          {!hasBarcodeAPI && (
            <p className="text-xs text-brand-yellow-600 mt-4">
              ⚠️ O seu browser não suporta leitura automática de QR. Use "Introduzir código manualmente".
            </p>
          )}
        </motion.div>
      )}

      {scanning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
          <div className="relative bg-black aspect-square max-h-[600px]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Overlay com área de scan */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-brand-yellow-400 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-brand-yellow-400 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-brand-yellow-400 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-brand-yellow-400 rounded-br-2xl" />
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-brand-red-500 shadow-[0_0_20px_rgba(230,57,70,0.8)]"
                />
              </div>
            </div>
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white text-xs font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-red-500 animate-pulse" />
                A digitalizar...
              </div>
              <button
                onClick={stopScanner}
                className="p-2 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80"
              >
                <X size={18} />
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm font-semibold bg-black/60 backdrop-blur rounded-full px-4 py-2 inline-block">
                Centre o QR code dentro da moldura
              </p>
            </div>
          </div>
          {!hasBarcodeAPI && (
            <div className="p-4 text-xs text-center text-brand-yellow-600 bg-brand-yellow-50 dark:bg-brand-yellow-900/20 border-t border-brand-yellow-200">
              ⚠️ Deteção automática indisponível. Pare a câmara e introduza o código manualmente.
            </div>
          )}
        </motion.div>
      )}

      {/* Resultado */}
      {product && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 relative overflow-hidden"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-green-600 uppercase tracking-wider">Produto identificado</div>
                <h3 className="font-display text-2xl font-bold">{product.name}</h3>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <div className="text-xs text-neutral-500">SKU</div>
                <div className="font-mono font-bold">{product.sku}</div>
              </div>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <div className="text-xs text-neutral-500">Localização</div>
                <div className="font-mono font-bold">{product.shelf}</div>
              </div>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <div className="text-xs text-neutral-500">Stock</div>
                <div className="font-bold text-xl">{product.quantity} <span className="text-sm font-normal text-neutral-500">un.</span></div>
              </div>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <div className="text-xs text-neutral-500">Preço</div>
                <div className="font-bold text-xl">{formatCurrency(product.price)}</div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/app/stock/${product.id}`)}
                className="btn-primary !py-2 !px-4 text-sm"
              >
                <Package size={16} /> Ver detalhes completos
              </button>
              <button
                onClick={() => { setProduct(null); startScanner(); }}
                className="btn-ghost !py-2 !px-4 text-sm"
              >
                <RefreshCw size={16} /> Digitalizar outro
              </button>
              <button
                onClick={() => { setProduct(null); stopScanner(); }}
                className="btn-outline !py-2"
              >
                Terminar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {lookingUp && (
        <div className="mt-4 card p-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <div className="h-4 w-4 rounded-full border-2 border-brand-red-500 border-t-transparent animate-spin" />
            A procurar produto...
          </div>
        </div>
      )}

      {/* Modal de código manual */}
      {manualOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="font-bold text-lg mb-4">Introduzir código manualmente</h3>
            <form onSubmit={handleManual} className="space-y-3">
              <input
                type="text"
                className="input font-mono"
                placeholder="AEX-QR-123-ELE-ABC123"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-neutral-500">Introduza o código impresso debaixo do QR.</p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setManualOpen(false)} className="btn-ghost !py-2">Cancelar</button>
                <button type="submit" className="btn-primary !py-2 !px-4">Procurar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
