// Shared pieces of the reminder messages, English and Bengali.

export const HELLO = {
  en: (first: string) => `Hello ${first}, this is Anubhav Life Care, Barasat.`,
  bn: (first: string) => `প্রিয় ${first}, অনুভব লাইফ কেয়ার, বারাসাত থেকে বলছি।`,
};

export const BOOK = {
  en: "Reply 1 and we will collect the sample at home, or walk in to our Barasat centre.",
  bn: "বাড়ি থেকে নমুনা নেওয়ার জন্য ১ লিখে উত্তর দিন, অথবা বারাসাত সেন্টারে চলে আসুন।",
};

export const DUE = {
  en: (overdue: boolean, dueBy: string) => (overdue ? "is now due" : `is due by ${dueBy}`),
  bn: (overdue: boolean) => (overdue ? "সময় হয়ে গেছে" : "সময় আসছে"),
};

/** A recent result worth a callback: not so fresh the doctor already acted, not so old it is history. */
export const callbackWindow = (sinceDays: number) => sinceDays > 7 && sinceDays <= 180;
