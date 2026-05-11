interface EquipmentVisualProps {
  type: "machine" | "mask";
  className?: string;
}

export default function EquipmentVisual({ type, className = "" }: EquipmentVisualProps) {
  if (type === "machine") {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center rounded-xl bg-navy/5 border border-navy/10 ${className}`}
      >
        <svg width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="9" width="48" height="22" rx="5" fill="#0B2A3C" fillOpacity="0.10" stroke="#0B2A3C" strokeOpacity="0.22" strokeWidth="1.5"/>
          <rect x="10" y="15" width="14" height="9" rx="2" fill="#0B5C6C" fillOpacity="0.18"/>
          <circle cx="37" cy="20" r="5" stroke="#0B5C6C" strokeOpacity="0.30" strokeWidth="1.5" fill="white" fillOpacity="0.5"/>
          <circle cx="37" cy="20" r="2" fill="#0B5C6C" fillOpacity="0.22"/>
          <rect x="48" y="18" width="5" height="4" rx="2" fill="#0B2A3C" fillOpacity="0.16"/>
          <circle cx="29" cy="18" r="1.5" fill="#74C0A2" fillOpacity="0.90"/>
          <circle cx="29" cy="22" r="1.5" fill="#74C0A2" fillOpacity="0.45"/>
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-xl bg-deep-teal/5 border border-deep-teal/10 ${className}`}
    >
      <svg width="56" height="44" viewBox="0 0 56 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="28" cy="25" rx="17" ry="14" fill="#0B5C6C" fillOpacity="0.08" stroke="#0B5C6C" strokeOpacity="0.24" strokeWidth="1.5"/>
        <path d="M19 18 Q28 13 37 18" stroke="#0B5C6C" strokeOpacity="0.32" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="28" cy="28" rx="11" ry="7" fill="#0B5C6C" fillOpacity="0.12" stroke="#0B5C6C" strokeOpacity="0.18" strokeWidth="1"/>
        <path d="M11 23 Q6 19 8 12" stroke="#0B2A3C" strokeOpacity="0.22" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M45 23 Q50 19 48 12" stroke="#0B2A3C" strokeOpacity="0.22" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
