export type User = {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
  profilePhotoUrl?: string | null;
  course?: string;
  averageRating?: number | null;
  ratingCount?: number;
};