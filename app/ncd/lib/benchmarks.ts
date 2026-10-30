// Published West Bengal and all-India figures for the /ncd comparison. These
// are real, cited numbers, typed in from the sources below; nothing here is
// computed from the lab's data.
//
// NFHS-6 values: IIPS, National Family Health Survey (NFHS-6) 2023-24, India
// and State/UT Fact Sheets (May 2026), indicators 76-89 and 98-99. West
// Bengal from the state fact sheet, India from the national one. Blood sugar
// is a random (non-fasting) finger-prick reading in people aged 15+.

export type Source = { label: string; href: string };

export const NFHS6: Source = {
  label: "NFHS-6 (2023-24) fact sheets, IIPS / MoHFW 2026",
  href: "https://data.opencity.in/dataset/nfhs-6-2023-24",
};

/** One NFHS indicator, % of adults. nfhs5 is the 2019-21 round, for the trend. */
export type SurveyRow = {
  label: string;
  wb: number;
  india: number;
  wb5: number;
  india5: number;
};

export const SURVEY_ROWS: SurveyRow[] = [
  { label: "Women: blood sugar over 140 mg/dL or on medicine", wb: 22.7, india: 17.8, wb5: 17.5, india5: 13.5 },
  { label: "Men: blood sugar over 140 mg/dL or on medicine", wb: 26.8, india: 20.9, wb5: 21.3, india5: 15.6 },
  { label: "Women: blood sugar over 160 mg/dL", wb: 12.1, india: 9.1, wb5: 7.7, india5: 6.3 },
  { label: "Men: blood sugar over 160 mg/dL", wb: 14.3, india: 10.9, wb5: 9.5, india5: 7.1 },
  { label: "Women: blood pressure 140/90+ or on medicine", wb: 24.3, india: 19.4, wb5: 20.5, india5: 21.3 },
  { label: "Men: blood pressure 140/90+ or on medicine", wb: 24.9, india: 22.1, wb5: 20.1, india5: 24.0 },
  { label: "Women 15-49: overweight or obese (BMI 25+)", wb: 34.6, india: 30.7, wb5: 22.7, india5: 24.0 },
  { label: "Men 15-49: overweight or obese (BMI 25+)", wb: 24.5, india: 27.3, wb5: 16.2, india5: 22.9 },
  { label: "Men: use any tobacco", wb: 46.2, india: 36.3, wb5: 48.1, india5: 38.0 },
];

/** Condition-level estimates. Studies differ in method, age and year, so a
 *  West Bengal figure and an India figure in one row are not like for like. */
export type ConditionBench = {
  key: "diabetes" | "kidney" | "heart" | "thyroid" | "liver" | "bp" | "anaemia";
  label: string;
  wb: string;
  wbNote: string;
  wbSrc: Source | null;
  india: string;
  indiaNote: string;
  indiaSrc: Source;
};

const INDIAB: Source = { label: "Anjana et al., ICMR-INDIAB-17, Lancet Diabetes Endocrinol 2023", href: "https://doi.org/10.1016/S2213-8587(23)00119-5" };

export const CONDITION_BENCH: ConditionBench[] = [
  {
    key: "diabetes",
    label: "Diabetes",
    wb: "22.7% / 26.8%",
    wbNote: "women / men, random sugar over 140 or on medicine",
    wbSrc: NFHS6,
    india: "11.4%",
    indiaNote: "adults 20+, OGTT or HbA1c; NFHS-6 equivalent 17.8% / 20.9%",
    indiaSrc: INDIAB,
  },
  {
    key: "bp",
    label: "High blood pressure",
    wb: "24.3% / 24.9%",
    wbNote: "women / men, 140/90+ or on medicine",
    wbSrc: NFHS6,
    india: "35.5%",
    indiaNote: "adults 20+; NFHS-6 equivalent 19.4% / 22.1%",
    indiaSrc: INDIAB,
  },
  {
    key: "kidney",
    label: "Kidney disease",
    wb: "4.1%",
    wbNote: "adults over 30 with eGFR under 60, rural South 24 Parganas",
    wbSrc: { label: "Gallieni et al., Sci World J 2014", href: "https://pubmed.ncbi.nlm.nih.gov/24616621/" },
    india: "3.5–17.2%",
    indiaNote: "range across methods and settings",
    indiaSrc: { label: "Singh et al., SEEK-India, BMC Nephrol 2013", href: "https://bmcnephrol.biomedcentral.com/articles/10.1186/1471-2369-14-114" },
  },
  {
    key: "heart",
    label: "High cholesterol",
    wb: "no open estimate",
    wbNote: "state figures sit in the INDIAB-17 appendix; not reproduced here",
    wbSrc: null,
    india: "24.0%",
    indiaNote: "total cholesterol 200 mg/dL or more",
    indiaSrc: INDIAB,
  },
  {
    key: "thyroid",
    label: "Hypothyroidism",
    wb: "21.7%",
    wbNote: "Kolkata, highest of eight cities",
    wbSrc: { label: "Unnikrishnan et al., Indian J Endocrinol Metab 2013", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3743364" },
    india: "10.95%",
    indiaNote: "eight-city average; 15.9% of women, 5.0% of men",
    indiaSrc: { label: "Unnikrishnan et al. 2013", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3743364" },
  },
  {
    key: "liver",
    label: "Fatty liver",
    wb: "8.7%",
    wbNote: "rural adults by ultrasound, 2010; 75% of them not overweight",
    wbSrc: { label: "Das et al., Hepatology 2010", href: "https://pubmed.ncbi.nlm.nih.gov/20222092" },
    india: "38.6%",
    indiaNote: "pooled across 50 studies, mostly urban and later",
    indiaSrc: { label: "Shalimar et al., J Clin Exp Hepatol 2022", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9168741" },
  },
  {
    key: "anaemia",
    label: "Anaemia",
    wb: "71.4%",
    wbNote: "women 15-49, NFHS-5 2019-21; the highest of any state",
    wbSrc: { label: "NFHS-5 fact sheets, IIPS 2021", href: "https://rchiips.org/nfhs/factsheet_NFHS-5.shtml" },
    india: "57.0%",
    indiaNote: "women 15-49, NFHS-5 2019-21",
    indiaSrc: { label: "NFHS-5 fact sheets, IIPS 2021", href: "https://rchiips.org/nfhs/factsheet_NFHS-5.shtml" },
  },
];

export const WHO_NCD: Source = {
  label: "WHO, Noncommunicable Diseases Country Profiles 2018",
  href: "https://www.who.int/publications/i/item/9789241514620",
};
