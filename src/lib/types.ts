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

export interface TokenSocials {
  website?: string;
  twitter?: string;
  telegram?: string;
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
  /** 24h price change percent */
  change24h?: number;
  /** Estimated liquidity in USD */
  liquidityUsd?: number;
  /** Unique holders */
  holders?: number;
  /** Transactions 24h */
  txns24h?: number;
  /** Verified / legitimate launch */
  verified?: boolean;
  /** Social proof for legit launches */
  socials?: TokenSocials;
  /** LP locked % after graduation */
  lpLocked?: number;
  /** Mint authority renounced */
  renounced?: boolean;
  /** Premium featured placement */
  featured?: boolean;
  /** Category tags */
  tags?: string[];
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

export type SortOption = "new" | "market_cap" | "volume" | "trending" | "gainers";
export type FeedTab = "all" | "new" | "graduating" | "graduated" | "verified";
