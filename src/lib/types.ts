export interface PlatformConfig {
  brand: {
    name: string;
    tagline: string;
    logoEmoji: string;
    primaryColor: string;
    domain: string;
  };
  fees: {
    tradeFeeBps: number;
    creationFeeSol: number;
    feeRecipient: string;
  };
  bondingCurve: {
    virtualSolReserves: number;
    virtualTokenReserves: number;
    realTokenReserves: number;
    tokenTotalSupply: number;
    graduationMarketCapUsd: number;
  };
  network: {
    cluster: "devnet" | "mainnet-beta" | "testnet";
    rpcUrl: string;
    programId: string;
  };
  features: {
    enableComments: boolean;
    enableLiveChat: boolean;
    requireAgeVerification: boolean;
    maintenanceMode: boolean;
  };
  admin: {
    password: string;
    moderationEnabled: boolean;
  };
}

export interface Token {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
  createdAt: number;
  virtualSolReserves: number;
  virtualTokenReserves: number;
  realSolReserves: number;
  realTokenReserves: number;
  complete: boolean;
  marketCapUsd: number;
  priceSol: number;
  volume24h: number;
  replies: number;
}

export interface Comment {
  id: string;
  mint: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface Trade {
  id: string;
  mint: string;
  type: "buy" | "sell";
  amount: number;
  priceSol: number;
  marketCapUsd: number;
  wallet: string;
  signature?: string;
  createdAt: number;
}

export type SortOption = "new" | "market_cap" | "volume";
