import './AuthButtons.css';
import qr_icon from '../../assets/icons/qr_icon.png';

export function PrimaryButton({ label, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
        w-full flex items-center justify-center
        px-6 py-4 mt-3 rounded-xl
        bg-gradient-to-r from-blue-600 to-green-600
        text-base font-bold text-white
        shadow-lg shadow-blue-500/30
        transition-all
        hover:from-blue-700 hover:to-green-700
        hover:shadow-xl hover:shadow-blue-500/40
        focus:outline-none focus:ring-0
      "
    >
      {label}
    </button>
  );
}

export function QRButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full flex items-center justify-center gap-2
        py-3 mt-5 rounded-xl
        bg-white border-2 border-blue-600
        transition-all hover:bg-blue-50
      "
    >
      <img src={qr_icon} className="w-5 h-5 opacity-70" alt="QR Icon" />
      <span className="btn-qr__label">
        QR-Code scannen
      </span>
    </button>
  );
}