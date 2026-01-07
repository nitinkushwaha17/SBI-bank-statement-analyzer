import './Logo.css';

function Logo({ size = 40 }) {
  return (
    <div className="logo-container" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00c896" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        
        {/* Simple chart icon */}
        <rect
          x="15"
          y="55"
          width="16"
          height="30"
          rx="4"
          fill="url(#logoGrad)"
          opacity="0.6"
        />
        <rect
          x="42"
          y="35"
          width="16"
          height="50"
          rx="4"
          fill="url(#logoGrad)"
          opacity="0.8"
        />
        <rect
          x="69"
          y="20"
          width="16"
          height="65"
          rx="4"
          fill="url(#logoGrad)"
        />
      </svg>
    </div>
  );
}

export default Logo;
