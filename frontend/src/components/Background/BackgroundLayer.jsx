import './BackgroundLayer.css';

const fireflies = [
  { left: '8%', top: '18%', delay: '0s', duration: '6s' },
  { left: '18%', top: '70%', delay: '1s', duration: '7s' },
  { left: '30%', top: '35%', delay: '2s', duration: '5.5s' },
  { left: '48%', top: '22%', delay: '0.5s', duration: '6.5s' },
  { left: '62%', top: '60%', delay: '1.5s', duration: '7.5s' },
  { left: '75%', top: '28%', delay: '2.5s', duration: '5.8s' },
  { left: '88%', top: '72%', delay: '0.8s', duration: '6.8s' },
];

const butterflies = [
  { left: '22%', top: '30%', delay: '0s', duration: '14s' },
  { left: '68%', top: '58%', delay: '4s', duration: '16s' },
  { left: '82%', top: '42%', delay: '8s', duration: '15s' },
];

const leaves = [
  { left: '12%', delay: '0s', duration: '12s' },
  { left: '38%', delay: '3s', duration: '14s' },
  { left: '58%', delay: '6s', duration: '13s' },
  { left: '84%', delay: '1.5s', duration: '15s' },
];

const sparkles = [
  { left: '14%', top: '82%', delay: '0s', duration: '2.6s' },
  { left: '26%', top: '18%', delay: '1s', duration: '2.2s' },
  { left: '40%', top: '74%', delay: '0.4s', duration: '2.8s' },
  { left: '53%', top: '26%', delay: '1.2s', duration: '2.1s' },
  { left: '70%', top: '80%', delay: '0.8s', duration: '2.7s' },
  { left: '86%', top: '20%', delay: '1.7s', duration: '2.4s' },
];

function BackgroundLayer() {
  return (
    <div className="background-layer">
      <div className="background-layer__image" />
      <div className="background-layer__overlay" />

      <div className="background-layer__animated">
        {fireflies.map((item, i) => (
          <span
            key={`firefly-${i}`}
            className="firefly"
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          />
        ))}

        {butterflies.map((item, i) => (
          <span
            key={`butterfly-${i}`}
            className="butterfly"
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          >
            🦋
          </span>
        ))}

        {leaves.map((item, i) => (
          <span
            key={`leaf-${i}`}
            className="leaf"
            style={{
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          >
            🍃
          </span>
        ))}

        {sparkles.map((item, i) => (
          <span
            key={`sparkle-${i}`}
            className="sparkle"
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default BackgroundLayer;