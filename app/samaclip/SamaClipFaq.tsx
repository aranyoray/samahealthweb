"use client";
import { useId, useState } from "react";

type QA = { q: string; a: string };
type Group = { tag: string; items: QA[] };

const GROUPS: Group[] = [
  {
    tag: "About the technology",
    items: [
      {
        q: "What is SamaClip?",
        a: "SamaClip is a small sensor that clips onto a fingertip and plugs into a standard Android phone. In a single 120-second test, it screens for anaemia, oxygen levels, diabetes risk, heart rhythm and autonomic vitals, without a needle and without a lab. It is the screening device at the heart of the SamaHealth platform.",
      },
      {
        q: "What does it screen for?",
        a: "From one recording: haemoglobin (anaemia), oxygen saturation, an HbA1c proxy for diabetes risk, heart rhythm (including atrial fibrillation), heart rate, vascular stiffness, and autonomic vitals such as heart rate variability and respiratory rate. One painless test replaces a pulse oximeter, a lab blood test, an HbA1c analyser and an ECG machine.",
      },
      {
        q: "Can it sense autonomic vitals?",
        a: "Yes. Because it records both the pulse waveform and the heart's electrical signal, the same 120-second recording also yields autonomic measures: heart rate variability, a recognised indicator of how the autonomic nervous system is functioning, along with respiratory rate. This broadens each screen from a single number toward a picture of how the body is regulating itself.",
      },
      {
        q: "How accurate is it?",
        a: "In a study of 175 adults at our NABL-accredited centre in Barasat, SamaClip detected anaemia with about 89% accuracy against hospital-grade lab instruments, and worked equally well across every skin tone tested, including the darkest. It flagged diabetes risk without a blood draw and caught atrial fibrillation with about 94% accuracy.",
      },
      {
        q: "Can it help flag infectious diseases like TB?",
        a: "SamaClip is not a TB test and does not diagnose infection. But active tuberculosis very often presents as exactly the pattern it captures: anaemia together with a raised heart rate and raised breathing rate, sometimes with lower oxygen. Anaemia alone affects roughly two-thirds of people with TB (around 72% in Indian studies). So a rapid, low-cost screen can act as an early triage signal, flagging people whose combination of anaemia and abnormal vitals warrants referral for confirmatory TB diagnostics such as sputum testing or chest imaging.",
      },
      {
        q: "How is it powered?",
        a: "It runs entirely off a phone. SamaClip draws its power over the USB cable from any standard Android device, with no internal battery, no charger, no mains supply. That means it works dependably in places where electricity is unreliable.",
      },
      {
        q: "How big is it, and what does it look like?",
        a: "Small enough to carry in a pocket. SamaClip is a lightweight fingertip clip with a short cable that plugs into a phone. Nothing to wheel in, nothing to set up. A health worker can carry several in a single bag to a community camp.",
      },
      {
        q: "Does it need internet or a laboratory?",
        a: "No. The screening itself runs on the phone and gives results in seconds at the point of care, with no lab, no sample transport, no waiting for reports. Anyone flagged at screening is then routed into our diagnostic services for confirmation.",
      },
      {
        q: "What is the principle behind it?",
        a: "SamaClip combines two proven sensing methods at the fingertip: multi-wavelength PPG (shining several wavelengths of light through the finger) and a single-lead ECG. Together they capture the blood, oxygen and electrical signals that every reading is built from.",
      },
      {
        q: "How is patient data kept secure?",
        a: "Readings stay encrypted, and anonymised data is only ever used for research with the person's explicit, revocable consent, given in their own language. We follow India's DPDP Act, and we do not sell data to third parties or insurers.",
      },
      {
        q: "Is it approved or regulated?",
        a: "Its accuracy was established in a formal validation study at an NABL-accredited diagnostic centre. We are now preparing SamaClip for CDSCO registration in India as a Class B diagnostic device.",
      },
    ],
  },
  {
    tag: "About the model",
    items: [
      {
        q: "What does it cost?",
        a: "A full multi-parameter screen costs the person under ₹125 (about $1.50), roughly the price of a bus ride, compared with several separate lab tests that cost many times more. The device itself costs under $7 to build, and a single one can screen hundreds of people.",
      },
      {
        q: "Who is it for?",
        a: "Our primary focus is women of reproductive age and mothers, who carry a very high anaemia burden and are routinely under-screened for heart and metabolic risk, along with their families. Screening happens both at our diagnostic centre and out in community health camps.",
      },
      {
        q: "How do communities actually reach it?",
        a: "Through a hub-and-spoke network: our NABL-accredited Anubhav centre acts as the hub, with community micro-clinics and camps as the spokes. We use a train-the-trainer model where local operators are trained to run standardised screening themselves, and provide free transport to the main clinic for pregnant women, the elderly and people with disabilities.",
      },
      {
        q: "Is there follow-up after screening?",
        a: "Yes. Once someone is flagged, the SamaBand wrist device supports continuous, at-home follow-up monitoring, so a flagged anaemia or rhythm case is kept track of over time rather than lost. SamaBand is for ongoing monitoring of patients already identified by SamaClip.",
      },
    ],
  },
];

export function SamaClipFaq() {
  // First question opens by default; key is `${groupIndex}-${itemIndex}`.
  const [open, setOpen] = useState<string | null>("0-0");
  const baseId = useId();

  let counter = 0;

  return (
    <div style={{ display: "grid", gap: 40 }}>
      {GROUPS.map((group, gi) => (
        <div key={group.tag}>
          <div style={{ display: "grid", gap: 10 }}>
            {group.items.map((item, ii) => {
              counter += 1;
              const num = String(counter).padStart(2, "0");
              const key = `${gi}-${ii}`;
              const isOpen = open === key;
              const panelId = `${baseId}-panel-${key}`;
              const btnId = `${baseId}-btn-${key}`;
              return (
                <div
                  key={item.q}
                  style={{
                    background: "#fff",
                    border: `1px solid ${isOpen ? "var(--brand-2)" : "var(--ink-100)"}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "border-color .15s ease, box-shadow .25s ease",
                    boxShadow: isOpen ? "0 18px 40px -28px rgba(15,118,110,0.35)" : "none",
                  }}
                >
                  <button
                    id={btnId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : key)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 18,
                      alignItems: "center",
                      textAlign: "left",
                      background: "transparent",
                      border: 0,
                      padding: "22px 24px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 12,
                        letterSpacing: "0.14em",
                        color: isOpen ? "var(--brand)" : "var(--ink-300)",
                      }}
                    >
                      {num}
                    </span>
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--ink)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: isOpen ? "var(--brand)" : "var(--paper-3)",
                        color: isOpen ? "#fff" : "var(--brand)",
                        transition: "background .15s ease, transform .2s ease",
                        transform: isOpen ? "rotate(45deg)" : "none",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M7 2v10M2 7h10" />
                      </svg>
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    hidden={!isOpen}
                    style={{
                      padding: "0 24px 24px 60px",
                    }}
                  >
                    <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-500)", maxWidth: 760 }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
