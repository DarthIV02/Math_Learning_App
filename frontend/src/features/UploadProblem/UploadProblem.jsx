import './UploadProblem.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard.jsx';
import PlayfulButton from '../../components/Buttons/PlayfulButton';

export default function UploadProblem() {
  return (
    <SurfaceCard className="upload-problem" soft={true}>
      <div className="upload-problem__text">
        <span aria-hidden="true">🧩</span>
        <div>
          <h3 className="upload-problem__title">
            Hast du eine eigene Knobelaufgabe?
          </h3>
          <p className="upload-problem__subtitle">
            Lade sie hoch oder schreib sie auf – wir knobeln zusammen!
          </p>
        </div>
      </div>

      <div className="upload-problem__actions">
        <PlayfulButton 
          label="Aufschreiben" 
          icon="✍️"
          color="blue"
          size="sm" 
          onClick={() => {}} 
        />
        <PlayfulButton 
          label="Foto hochladen" 
          icon="📸"
          color="blue"
          size="sm" 
          onClick={() => {}} 
        />
      </div>
    </SurfaceCard>
  );
}