export type Note = {
  id: string;
  content: string;
  tapeColor: string;
  encryptedKey: string | null;
  iv: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  name: string;
  email: string;
  salt: string | null;
  customerId: string | null;
  subscribedTill: Date | null;
  createdAt: Date;
};

export type Meta = {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  site: string;
};
