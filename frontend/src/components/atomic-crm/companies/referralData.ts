export const SERVICE_AREAS = [
  "Denver",
  "Boulder",
  "Pueblo",
  "El Paso",
  "Douglas",
  "Jefferson",
  "Adams",
  "Broomfield",
];

export const REFERRAL_CATEGORIES = [
  {
    label: "Medical Providers",
    types: [
      "Hospitals",
      "Rehab Hospitals",
      "Skilled Nursing Facilities",
      "Home Health",
      "Hospice",
      "Physicians",
      "Outpatient PT",
      "Behavioral Health",
    ],
  },
  {
    label: "Senior Living",
    types: ["Assisted Living", "Independent Living", "Memory Care", "CCRC"],
  },
  {
    label: "Government & Veteran Services",
    types: [
      "VA Community Care",
      "VSO Offices",
      "Medicaid/SEP Case Managers",
      "County Aging Services",
      "PACE Programs",
    ],
  },
  {
    label: "Legal & Financial",
    types: [
      "Elder Law",
      "Probate",
      "Estate Planners",
      "Fiduciaries",
      "Financial Advisors",
    ],
  },
  {
    label: "Community & Nonprofit",
    types: [
      "Senior Centers",
      "Support Groups",
      "Faith Organizations",
      "Alzheimer’s Groups",
      "Parkinson’s Groups",
      "Meals on Wheels",
      "Fire Departments",
    ],
  },
  {
    label: "Service Providers",
    types: [
      "DME Companies",
      "Pharmacies",
      "Home Modification Contractors",
      "Mobility Companies",
      "Transportation",
      "In-home Diagnostics",
    ],
  },
  {
    label: "Digital & Direct-to-Consumer",
    types: [
      "Facebook Groups",
      "Nextdoor",
      "Google Maps",
      "Website",
      "Ads",
      "Word of Mouth",
    ],
  },
] as const;

export const REFERRAL_TYPES = REFERRAL_CATEGORIES.flatMap((category) => category.types);
