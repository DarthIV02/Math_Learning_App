import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css'

export default function QRScanner({ onResult, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes("back")
        ) || devices[0];

        scanner.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: (w, h) => {
            const size = Math.min(w, h) * 0.7;
            return { width: size, height: size };
            },
          },
          (decodedText) => {
            onResult(decodedText);
            scanner.stop();
          }
        );
      }
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white text-2xl"
      >
        ✕
      </button>

      {/* Custom title */}
      <h2 className="text-white text-xl font-bold mb-4">
        Scanne deinen QR-Code 📷
      </h2>

      {/* Camera view */}
      <div className="relative w-[300px] h-[300px] rounded-2xl overflow-hidden border-4 border-white">
        <div id="qr-reader" className="w-full h-full" />

        {/* Custom overlay */}
        <div className="absolute inset-0 border-4 border-green-400 rounded-2xl pointer-events-none" />
      </div>

      <p className="text-white mt-4 text-sm">
        Halte den Code in den Rahmen
      </p>
    </div>
  );
}