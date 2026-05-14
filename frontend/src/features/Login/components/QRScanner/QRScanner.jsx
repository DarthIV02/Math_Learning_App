import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

export default function QRScanner({ onResult, onClose }) {
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const devices = await Html5Qrcode.getCameras();

        if (!mounted || !devices || devices.length === 0) return;

        const backCamera =
          devices.find((d) => d.label.toLowerCase().includes('back')) ||
          devices[0];

        await scanner.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: (w, h) => {
              const size = Math.min(w, h) * 0.7;
              return { width: size, height: size };
            },
          },
          async (decodedText) => {
            if (hasScannedRef.current) return;

            hasScannedRef.current = true;

            try {
              if (isRunningRef.current) {
                await scanner.stop();
                isRunningRef.current = false;
              }
            } catch (_) {}

            onResult(decodedText);
          }
        );

        isRunningRef.current = true;
      } catch (err) {
        console.error('QR scanner error:', err);
      }
    };

    startScanner();

    return () => {
      mounted = false;

      const scanner = scannerRef.current;

      if (scanner && isRunningRef.current) {
        scanner
          .stop()
          .then(() => {
            isRunningRef.current = false;
          })
          .catch(() => {});
      }
    };
  }, [onResult]);

  const handleClose = async () => {
    const scanner = scannerRef.current;

    try {
      if (scanner && isRunningRef.current) {
        await scanner.stop();
        isRunningRef.current = false;
      }
    } catch (_) {}

    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 text-white text-2xl"
      >
        ✕
      </button>

      <h2 className="text-white text-xl font-bold mb-4">
        Scanne deinen QR-Code 📷
      </h2>

      <div className="relative w-[300px] h-[300px] rounded-2xl overflow-hidden border-4 border-white">
        <div id="qr-reader" className="w-full h-full" />
        <div className="absolute inset-0 border-4 border-green-400 rounded-2xl pointer-events-none" />
      </div>

      <p className="text-white mt-4 text-sm">
        Halte den Code in den Rahmen
      </p>
    </div>
  );
}