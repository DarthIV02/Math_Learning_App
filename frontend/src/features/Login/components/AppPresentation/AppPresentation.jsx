import logo from '../../../../assets/icons/applicationIcon.webp';

export default function AppPresentation({}) {
  return (
    <div className="auth-header flex flex-col items-center text-center mb-5 gap-2">
        <div className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl shadow-lg">
        <img src={logo} alt="MathApp Logo" className="h-full w-full object-cover" />
        </div>

        <div>
        <h1 className="auth-app-title">MathApp</h1>
        <p className="text-sm text-slate-500">
            Lerne Mathematik auf eine neue Art
        </p>
        </div>
    </div>
  );
}