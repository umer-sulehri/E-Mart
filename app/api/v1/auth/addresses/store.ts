export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

const addressStore = new Map<string, Address[]>();

export function getAddresses(userId: string): Address[] {
  return addressStore.get(userId) ?? [];
}

export function setAddresses(userId: string, addresses: Address[]): void {
  addressStore.set(userId, addresses);
}
