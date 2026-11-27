/** The SamaHealth mark: a pulse on a teal tile. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#0F766E" />
      <path d="M7 17h4l2-6 3 12 3-9 2 3h4" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
