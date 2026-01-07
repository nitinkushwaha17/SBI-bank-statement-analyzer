import { useMemo } from 'react';
import './BackgroundEffects.css';

// Pre-computed particle positions for stable rendering
const PARTICLE_CONFIG = [
  { left: 15, top: 20, delay: 0, duration: 4 },
  { left: 85, top: 10, delay: 1.2, duration: 5 },
  { left: 42, top: 65, delay: 2.5, duration: 3.5 },
  { left: 78, top: 45, delay: 0.8, duration: 4.5 },
  { left: 25, top: 80, delay: 3.1, duration: 5.5 },
  { left: 92, top: 30, delay: 1.8, duration: 4.2 },
  { left: 8, top: 55, delay: 4.2, duration: 3.8 },
  { left: 55, top: 15, delay: 0.5, duration: 6 },
  { left: 68, top: 75, delay: 2.8, duration: 4.8 },
  { left: 35, top: 40, delay: 1.5, duration: 5.2 },
  { left: 12, top: 90, delay: 3.8, duration: 4.3 },
  { left: 48, top: 25, delay: 0.3, duration: 5.8 },
  { left: 82, top: 60, delay: 2.2, duration: 3.6 },
  { left: 20, top: 35, delay: 4.5, duration: 4.7 },
  { left: 95, top: 85, delay: 1.0, duration: 5.3 },
  { left: 60, top: 50, delay: 3.5, duration: 4.1 },
  { left: 5, top: 70, delay: 2.0, duration: 6.2 },
  { left: 72, top: 8, delay: 0.7, duration: 3.9 },
  { left: 38, top: 92, delay: 4.0, duration: 5.6 },
  { left: 88, top: 42, delay: 1.4, duration: 4.4 },
];

function BackgroundEffects() {
  const particles = useMemo(() => PARTICLE_CONFIG, []);

  return (
    <div className="background-effects">
      {/* Grid pattern */}
      <div className="grid-pattern" />
      
      {/* Large glowing orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      
      {/* Floating particles */}
      <div className="particles">
        {particles.map((particle, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>
      
      {/* Gradient overlay at top */}
      <div className="gradient-glow gradient-glow-top" />
      
      {/* Gradient overlay at bottom */}
      <div className="gradient-glow gradient-glow-bottom" />
    </div>
  );
}

export default BackgroundEffects;
