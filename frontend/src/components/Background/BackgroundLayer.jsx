import './BackgroundLayer.css';

function BackgroundLayer() {
  return (
    <div className="background-layer">
      <div className="background-layer__image" />
      <div className="background-layer__overlay" />

      <div className="background-layer__animated">
      </div>
    </div>
  );
}

export default BackgroundLayer;