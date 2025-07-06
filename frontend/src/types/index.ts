export type Product = {
  _id: string;
  name: string;
  url: string;
  description: string;
  images: string[];
  currentPrice: number;
  platform: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  createdAt: string;
};

export type Variation = {
  _id: string;
  size?: string;
  color?: string;
  price: number;
  attributes?: Record<string, string>;
};

export type ProductDetails = {
  _id: string;
  name: string;
  description: string;
  url: string;
  images: string[];
  currentPrice: number;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  variations: Variation[];
};

export interface PriceHistoryPoint {
  _time: string;
  _value: number;
} 