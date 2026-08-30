import { clockAngles } from "../hooks/useNow";

export function AnalogClock({ time }: { time: Date }) {
  const { hour, minute } = clockAngles(time);
  return (
    <svg viewBox="0 0 160 160" className="clock-face" aria-hidden="true">
      <circle cx="80" cy="80" r="74" fill="#FBF9F4" />
      <circle cx="80" cy="80" r="68" fill="none" stroke="#4B6E58" strokeWidth="7" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((mark) => {
        const deg = mark * 30;
        const major = mark % 3 === 0;
        return (
          <line
            key={mark}
            x1="80"
            y1={major ? 22 : 26}
            x2="80"
            y2={major ? 34 : 32}
            stroke={major ? "#E0A542" : "#7C93A3"}
            strokeWidth={major ? 4 : 2.4}
            transform={`rotate(${deg} 80 80)`}
          />
        );
      })}
      <g transform={`rotate(${hour} 80 80)`}>
        <line
          x1="80"
          y1="84"
          x2="80"
          y2="46"
          stroke="#1E2A2F"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
      <g transform={`rotate(${minute} 80 80)`}>
        <line
          x1="80"
          y1="86"
          x2="80"
          y2="32"
          stroke="#A8342A"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      <circle cx="80" cy="80" r="6" fill="#1E2A2F" />
    </svg>
  );
}
