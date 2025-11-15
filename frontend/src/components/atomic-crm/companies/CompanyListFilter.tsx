import { Building, Truck, Users } from "lucide-react";
import { FilterLiveForm, useGetIdentity } from "ra-core";
import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";

import { FilterCategory } from "../filters/FilterCategory";

const serviceAreas = [
  "Denver",
  "Boulder",
  "Pueblo",
  "El Paso",
  "Douglas",
  "Jefferson",
  "Adams",
  "Broomfield",
];

const referralCategories = [
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
    types: [
      "Assisted Living",
      "Independent Living",
      "Memory Care",
      "CCRC",
    ],
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
];

export const CompanyListFilter = () => {
  const { identity } = useGetIdentity();
  return (
    <div className="w-52 min-w-52 flex flex-col gap-8">
      <FilterLiveForm>
        <SearchInput source="q" />
      </FilterLiveForm>

      <FilterCategory
        icon={<Building className="h-4 w-4" />}
        label="Service Area / County"
      >
        {serviceAreas.map((area) => (
          <ToggleFilterButton
            key={area}
            className="w-full justify-between"
            label={area}
            value={{ size: area }}
          />
        ))}
      </FilterCategory>

      <FilterCategory icon={<Truck className="h-4 w-4" />} label="Referral Type">
        <div className="flex flex-col gap-4">
          {referralCategories.map((category) => (
            <div key={category.label} className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wide text-secondary-foreground/70">
                {category.label}
              </p>
              {category.types.map((type) => (
                <ToggleFilterButton
                  key={type}
                  className="w-full justify-between"
                  label={type}
                  value={{ sector: type }}
                />
              ))}
            </div>
          ))}
        </div>
      </FilterCategory>

      <FilterCategory
        icon={<Users className="h-4 w-4" />}
        label="Account Manager"
      >
        <ToggleFilterButton
          className="w-full justify-between"
          label={"Me"}
          value={{ sales_id: identity?.id }}
        />
      </FilterCategory>
    </div>
  );
};
