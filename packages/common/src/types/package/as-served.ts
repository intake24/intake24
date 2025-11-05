export type PkgAsServedImage = {
  imagePath: string;
  imageKeywords: string[];
  weight: number;
};

export type PkgAsServedSet = {
  id: string;
  description: string;
  selectionImagePath: string;
  images: PkgAsServedImage[];
  label?: Record<string, string>;
};
