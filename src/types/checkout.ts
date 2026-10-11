export type CheckoutProduct = {
  productId: string;
  productName: string;
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  recurring: boolean;
  prepaidMonths?: number;
  paymentMethods: string[];
};
