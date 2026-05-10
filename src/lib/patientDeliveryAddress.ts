export interface DeliveryAddress {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
}

export const EMPTY_DELIVERY_ADDRESS: DeliveryAddress = {
  line1: "",
  line2: "",
  city: "",
  region: "",
  postcode: "",
  country: "New Zealand",
};

export function getDeliveryAddressStorageKey(patientKey?: string): string {
  return `midland-delivery-address:${patientKey ?? "unknown"}`;
}

export function normalizeDeliveryAddress(
  address: Partial<DeliveryAddress>
): DeliveryAddress {
  return {
    line1: address.line1?.trim() ?? "",
    line2: address.line2?.trim() ?? "",
    city: address.city?.trim() ?? "",
    region: address.region?.trim() ?? "",
    postcode: address.postcode?.trim() ?? "",
    country: address.country?.trim() || "New Zealand",
  };
}

export function hasCompleteDeliveryAddress(address: DeliveryAddress): boolean {
  const normalized = normalizeDeliveryAddress(address);
  return Boolean(
    normalized.line1 &&
      normalized.city &&
      normalized.region &&
      normalized.postcode &&
      normalized.country
  );
}

export function formatDeliveryAddress(address: DeliveryAddress): string[] {
  const normalized = normalizeDeliveryAddress(address);
  return [
    normalized.line1,
    normalized.line2,
    [normalized.city, normalized.region, normalized.postcode]
      .filter(Boolean)
      .join(" "),
    normalized.country,
  ].filter(Boolean);
}

export function readSavedDeliveryAddress(storageKey: string): DeliveryAddress | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DeliveryAddress>;
    const normalized = normalizeDeliveryAddress(parsed);
    return hasCompleteDeliveryAddress(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function saveDeliveryAddress(
  storageKey: string,
  address: DeliveryAddress
): void {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(normalizeDeliveryAddress(address))
    );
  } catch {
    // Local browser storage is best-effort; the request form still uses the address snapshot.
  }
}
