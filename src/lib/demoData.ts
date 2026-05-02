import type {
  DemoPatient, Machine, Mask,
  EntitlementItem, MaintenanceCheck,
} from "@/types";

export const DEMO_PATIENTS: DemoPatient[] = [
  {
    id: "patient-001",
    msid: "MS-238872",
    name: "Paul Moreno",
    email: "paul.moreno@example.com",
    password: "Demo@1234!",
    dob: "1978-03-15",
    phone: "027 555 0101",
    funding_stream: "ACC",
    nhi_masked: "ZZZ****",
    nhi_full: "ZZA1234",
  },
  {
    id: "patient-002",
    msid: "MS-731204",
    name: "Sarah Kim",
    email: "sarah.kim@example.com",
    password: "Demo@5678!",
    dob: "1985-09-22",
    phone: "021 555 0202",
    funding_stream: "HEALTH_NZ",
    nhi_masked: "ZZZ****",
    nhi_full: "ZZB5678",
  },
  {
    id: "patient-003",
    msid: "MS-956431",
    name: "Richard O'Brien",
    email: "richard.obrien@example.com",
    password: "Demo@9012!",
    dob: "1962-11-08",
    funding_stream: "ACC",
    nhi_masked: "ZZZ****",
    nhi_full: "ZZC9012",
  },
];

export const DEV_ACCOUNT: DemoPatient = {
  id: "dev-001",
  msid: "MS-000000",
  name: "Dev Account",
  email: "dev@oneofzero.co.nz",
  password: "Dev@test99!",
  dob: "2000-01-01",
  funding_stream: "ACC",
  nhi_masked: "ZZZ****",
  nhi_full: "ZZD0000",
};

export const DEMO_MACHINES: Record<string, Machine> = {
  "patient-001": {
    id: "machine-001", name: "AirSense 11 AutoSet",
    brand: "ResMed", model: "AirSense 11",
    serial_number: "RS-2024-001", setup_date: "2024-03-15",
  },
  "patient-002": {
    id: "machine-002", name: "SleepStyle 650",
    brand: "Fisher & Paykel", model: "SleepStyle 650",
    serial_number: "FP-2023-042", setup_date: "2023-06-10",
  },
  "patient-003": {
    id: "machine-003", name: "AirSense 10 AutoSet",
    brand: "ResMed", model: "AirSense 10",
    serial_number: "RS-2022-188", setup_date: "2022-01-20",
  },
};

export const DEMO_MASKS: Record<string, Mask> = {
  "patient-001": { id: "mask-001", name: "AirFit F30i", brand: "ResMed", type: "full_face", size: "Small", fitted_date: "2024-03-15" },
  "patient-002": { id: "mask-002", name: "Eson 2", brand: "Fisher & Paykel", type: "nasal", size: "Medium", fitted_date: "2023-06-10" },
  "patient-003": { id: "mask-003", name: "Mirage FX", brand: "ResMed", type: "nasal", size: "Large", fitted_date: "2022-01-20" },
};

export const DEMO_ENTITLEMENTS: Record<string, EntitlementItem[]> = {
  // Paul: CAN reorder
  "patient-001": [
    { item_type: "cushion",  status: "ELIGIBLE", quantity_remaining: 2, quantity_cap: 2 },
    { item_type: "headgear", status: "ELIGIBLE", quantity_remaining: 1, quantity_cap: 1 },
    { item_type: "mask_kit", status: "ELIGIBLE", quantity_remaining: 1, quantity_cap: 1 },
    { item_type: "filter",   status: "ELIGIBLE", quantity_remaining: 4, quantity_cap: 4 },
  ],
  // Sarah: NOT eligible — next Nov 2026
  "patient-002": [
    { item_type: "cushion",  status: "NOT_YET", next_eligible_date: "2026-11-15", quantity_remaining: 0, quantity_cap: 2 },
    { item_type: "headgear", status: "NOT_YET", next_eligible_date: "2026-11-15", quantity_remaining: 0, quantity_cap: 1 },
    { item_type: "mask_kit", status: "NOT_YET", next_eligible_date: "2026-11-15", quantity_remaining: 0, quantity_cap: 1 },
    { item_type: "filter",   status: "ELIGIBLE", quantity_remaining: 2, quantity_cap: 4 },
  ],
  // Richard: CAN reorder (inactive)
  "patient-003": [
    { item_type: "cushion",  status: "ELIGIBLE", quantity_remaining: 2, quantity_cap: 2 },
    { item_type: "headgear", status: "ELIGIBLE", quantity_remaining: 1, quantity_cap: 1 },
    { item_type: "mask_kit", status: "ELIGIBLE", quantity_remaining: 1, quantity_cap: 1 },
    { item_type: "filter",   status: "ELIGIBLE", quantity_remaining: 4, quantity_cap: 4 },
  ],
};

export const DEMO_MAINTENANCE: Record<string, MaintenanceCheck[]> = {
  // Paul: safety check OVERDUE
  "patient-001": [
    { check_type: "safety_check",   label: "Annual safety check",      status: "OVERDUE", due_date: "2025-09-15", last_completed: "2024-09-15" },
    { check_type: "water_chamber",  label: "Water chamber replacement", status: "OK",      due_date: "2026-09-15", last_completed: "2025-09-15" },
  ],
  // Sarah: water chamber DUE
  "patient-002": [
    { check_type: "safety_check",   label: "Annual safety check",      status: "OK",  due_date: "2027-01-10", last_completed: "2026-01-10" },
    { check_type: "water_chamber",  label: "Water chamber replacement", status: "DUE", due_date: "2026-06-10", last_completed: "2025-06-10" },
  ],
  // Richard: BOTH overdue
  "patient-003": [
    { check_type: "safety_check",   label: "Annual safety check",      status: "OVERDUE", due_date: "2024-07-20", last_completed: "2023-07-20" },
    { check_type: "water_chamber",  label: "Water chamber replacement", status: "OVERDUE", due_date: "2025-01-20", last_completed: "2024-01-20" },
  ],
};
