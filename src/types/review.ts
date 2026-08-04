export type ReviewDTO = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  reply: { body: string; repliedAt: string | null } | null;
};

export type ReviewSummary = {
  count: number; // written reviews
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};
