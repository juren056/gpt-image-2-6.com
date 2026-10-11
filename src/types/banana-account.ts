export type AccountCreditBalance = {
  balance: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  promotionalCredits: number;
  nextExpiresAt?: string | null;
};

export type AccountImageTask = {
  id: string;
  prompt: string;
  model: string;
  status: string;
  costCredits: number;
  createdAt: string;
  images: Array<{ imageUrl?: string }>;
  errorMessage?: string;
  options?: Record<string, unknown>;
};
