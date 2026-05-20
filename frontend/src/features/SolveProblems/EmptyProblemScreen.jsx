import BackgroundLayer from '../../components/Background/BackgroundLayer';

export default function EmptyProblemsScreen({ onChooseTopic }) {
  return (
    <main className="solve-page relative min-h-screen overflow-y-auto">
      <BackgroundLayer />

      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg text-slate-600">
            Keine Aufgaben geladen.
          </p>

          <button
            className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white"
            onClick={onChooseTopic}
          >
            Thema wählen
          </button>
        </div>
      </div>
    </main>
  );
}