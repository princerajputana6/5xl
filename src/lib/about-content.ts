/**
 * Static "About us" + FAQ content for The 5XL Nutrition, transcribed from the
 * brand's approved copy. Kept in one module so the About page, FAQ page and any
 * future CMS surfaces read from a single source.
 */

export const aboutIntro = {
  headline: "By The Athlete, For The Athlete.",
  subhead: "Manufactured In-House, Not Outsourced.",
  body:
    "The 5XL Nutrition is an Indian sports nutrition supplements brand founded in 2019 by competitive weightlifter Shourya Rao. We are owned and manufactured by Fitamins Healthcare Private Limited at our own FSSAI-licensed facility in Kanina, Haryana — producing whey protein, creatine, pre-workout, mass gainers, amino acids and cycle support for athletes, lifters and everyday fitness enthusiasts across India. We do not outsource production.",
};

export const aboutStats: { value: string; label: string }[] = [
  { value: "2019", label: "Operating since December 2019" },
  { value: "875,689+", label: "Customers served, online & offline" },
  { value: "44", label: "Products in range" },
  { value: "18", label: "Licensed formulation categories on our FSSAI licence" },
  { value: "15,000 sq ft", label: "Manufacturing facility — Kanina, Haryana" },
  { value: "1 tonne/day", label: "Licensed production capacity" },
  { value: "579+", label: "Retail and gym partners" },
  { value: "Pan-India", label: "Delivery" },
];

export const aboutJourney: { year: string; text: string }[] = [
  {
    year: "2015",
    text: "Kuldeep Singh Yadav records a 190 kg raw bench press at 93 kg bodyweight in Jamshedpur.",
  },
  {
    year: "2016",
    text: "Shourya Rao takes gold in the 105 kg category at the Delhi State Weightlifting Championship.",
  },
  {
    year: "2019",
    text: "The 5XL Nutrition launches under Fitamins Healthcare Private Limited.",
  },
  {
    year: "Dec 2019",
    text: "FSSAI Central Manufacturing Licence granted. We stop being a brand that buys powder and become a company that makes it.",
  },
  {
    year: "Today",
    text: "44 products across 18 licensed formulation categories, 579+ retail and gym partners, and more than 875,689 customers served.",
  },
];

export const aboutTeam: { name: string; role: string; bio: string; instagram: string }[] = [
  {
    name: "Shourya Rao",
    role: "Founder & Director",
    bio: "Founded The 5XL Nutrition in 2019. Competed as a weightlifter in the 105 kg category and took gold at the Delhi State Weightlifting Championship in 2016. Leads brand direction and product strategy — nothing ships unless he would take it himself in a competition prep.",
    instagram: "@shouryarao5xl",
  },
  {
    name: "Kuldeep Singh Yadav",
    role: "Director, Formulation & Quality",
    bio: "A graduate of Lakshmibai National Institute of Physical Education (LNIPE), Gwalior and a PhD scholar in exercise physiology. As a competitor he benched 190 kg raw at 93 kg bodyweight (Jamshedpur, 2015) and placed top six at the IFBB Amateur Olympia Italy in 2018. He decides what goes in the tub.",
    instagram: "@kuldeepsinghyadav",
  },
  {
    name: "Pradeep Rao",
    role: "Chief Executive Officer",
    bio: "Leads the company's day-to-day operations, from production planning through to distribution and commercial partnerships.",
    instagram: "@pradeeprao.1",
  },
];

export const aboutProcess: string[] = [
  "Supplier qualification — whey concentrate and isolate, amino acids and specialised actives sourced from established international suppliers.",
  "Incoming goods check — every consignment arrives with supplier documentation, checked against our written specification before acceptance.",
  "Blending on our own line — under our own FSSAI Central Licence, at a licensed capacity of one metric tonne per day.",
  "In-house quality control — our facility operates an in-house quality control laboratory.",
  "Accredited batch testing — chemical and microbiological contaminant testing through NABL-accredited or FSSAI-recognised laboratories.",
  "Coded and sealed — every tub carries a unique verification code linked to its batch number, manufacturing date and expiry.",
];

export const aboutCertifications: {
  name: string;
  number: string;
  issuer: string;
  validUntil: string;
}[] = [
  {
    name: "FSSAI Central Licence",
    number: "13322999001439",
    issuer: "Food Safety and Standards Authority of India",
    validUntil: "4 December 2028",
  },
  {
    name: "ISO 9001:2015 — Quality Management",
    number: "24MEQST58",
    issuer: "Magnitude Management Services Pvt. Ltd. (EGAC accredited, IAF MLA signatory)",
    validUntil: "1 July 2027",
  },
  {
    name: "GMP — Good Manufacturing Practices",
    number: "INWGMP/HR-46395/0724",
    issuer: "Paramount Quality Certifications",
    validUntil: "30 June 2027",
  },
];

export const aboutComparison: { label: string; typical: string; fivexl: string }[] = [
  {
    label: "Who owns the factory?",
    typical: "Undisclosed third-party contract manufacturer",
    fivexl: "We do — FSSAI Central Licence 13322999001439",
  },
  {
    label: "Is the address public?",
    typical: "“State-of-the-art facility”",
    fivexl: "Anita Road, Kanina, Mahendragarh, Haryana",
  },
  {
    label: "Who sets the doses?",
    typical: "A cost target",
    fivexl: "A PhD scholar in exercise physiology",
  },
  { label: "Proprietary blends?", typical: "Common", fivexl: "Never" },
  {
    label: "Label claim verification",
    typical: "Trust the front of the tub",
    fivexl: "Batch-tested against label claim",
  },
  {
    label: "Anti-spiking screening",
    typical: "Rarely disclosed",
    fivexl: "Free-form amino acid profile screened",
  },
  {
    label: "Can you verify any of it?",
    typical: "Usually not",
    fivexl: "Yes — licence number above, government portal",
  },
];

export const companyDetails: { label: string; value: string }[] = [
  { label: "Registered entity", value: "Fitamins Healthcare Private Limited" },
  { label: "Brand", value: "The 5XL Nutrition" },
  { label: "GSTIN", value: "09AAFCF3205J1ZQ" },
  { label: "FSSAI Central Licence", value: "13322999001439" },
  {
    label: "Manufacturing facility",
    value: "Anita Road, Near Ajay Big Bazar, Kanina, Mahendragarh, Haryana - 123027, India",
  },
  { label: "Customer support", value: "+91 92895 37733" },
  { label: "Support email", value: "5xlnutrition@gmail.com" },
  { label: "Support hours", value: "Monday to Saturday, 10:00 AM – 6:00 PM IST" },
];

export const aboutFaqs: { q: string; a: string }[] = [
  {
    q: "Who owns The 5XL Nutrition?",
    a: "The 5XL Nutrition is owned and operated by Fitamins Healthcare Private Limited, a private limited company registered in India (GSTIN 09AAFCF3205J1ZQ). The brand was founded in 2019 by Shourya Rao, who serves as Founder and Director. Kuldeep Singh Yadav is a director and leads formulation and quality, and Pradeep Rao is Chief Executive Officer.",
  },
  {
    q: "Who formulates The 5XL Nutrition products?",
    a: "Formulation and quality are led by Kuldeep Singh Yadav, a director of Fitamins Healthcare Private Limited, a graduate of LNIPE, Gwalior, and a PhD scholar in exercise physiology. He is also a competitive athlete, with a 190 kg raw bench press at 93 kg bodyweight (Jamshedpur, 2015) and a top-six finish at the IFBB Amateur Olympia Italy in 2018. Brand direction and product strategy are led by founder Shourya Rao, a state-gold weightlifter in the 105 kg category.",
  },
  {
    q: "Where are The 5XL Nutrition supplements manufactured?",
    a: "All products are manufactured at our own 15,000 sq ft facility on Anita Road, Kanina, Mahendragarh, Haryana - 123027. We do not use third-party contract manufacturers. The facility holds FSSAI Central Licence 13322999001439 in the Manufacturer category and operates at a licensed capacity of one metric tonne per day.",
  },
  {
    q: "Is The 5XL Nutrition FSSAI approved?",
    a: "Yes. Fitamins Healthcare Private Limited holds FSSAI Central Licence number 13322999001439, in the category Manufacturer - Food or Health Supplements and Nutraceuticals, valid until 4 December 2028 with no suspension history. You can verify it at foscos.fssai.gov.in. Our facility is also ISO 9001:2015 certified (certificate 24MEQST58) and GMP certified (certificate INWGMP/HR-46395/0724).",
  },
  {
    q: "Are The 5XL Nutrition products steroid-free?",
    a: "Yes. Every 5XL product is a food supplement or nutraceutical manufactured under our FSSAI Central Licence, and contains no steroids, no hormones and no banned substances. Our formulations are restricted to the 18 categories approved on that licence, and batches are tested for heavy metals, microbiological safety and protein content against label claim.",
  },
  {
    q: "What are your On Cycle and Post Cycle Support products?",
    a: "They are organ and recovery support formulations — liver, kidney and cardiovascular support built around ingredients such as milk thistle, N-acetylcysteine and antioxidants — intended for athletes training and eating at high intensity over sustained periods. They contain no steroids or hormones, and are manufactured under our FSSAI Central Licence. If you have an underlying health condition or take prescription medication, consult a doctor before use.",
  },
  {
    q: "Does The 5XL Nutrition use proprietary blends?",
    a: "No. Every 5XL label declares the exact quantity of every active ingredient per serving. We also screen the free-form amino acid profile of our protein products against the declared protein content to guard against amino spiking.",
  },
  {
    q: "How do I verify that my 5XL product is genuine?",
    a: "Every product carries a unique scratch or QR verification code. Enter it on our Verify Product page for an instant result, along with your batch number, manufacturing date and expiry. If your code returns invalid, contact us with your order number and photographs of the packaging and we will investigate.",
  },
  {
    q: "Where does The 5XL Nutrition deliver?",
    a: "We deliver across India, through our website and through our 579+ retail and gym partners. Track your order from your account once it has shipped.",
  },
];
