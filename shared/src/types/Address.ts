// Address-related types

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AddressWithContact extends Address {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}
