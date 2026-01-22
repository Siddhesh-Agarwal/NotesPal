export type Note = {
  id: string;
  content: string;
  tapeColor: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Meta = {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  site: string;
};
