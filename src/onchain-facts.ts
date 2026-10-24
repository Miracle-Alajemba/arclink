/*
 * Onchain facts registry — do not edit individual values by hand.
 * Import helpers instead of typing addresses or decimal counts.
 */

export const USDC_DECIMALS = 6;

export interface TokenFact {
  symbol: string;
  address: string;
  decimals: number;
}

export interface NativeCurrencyFact {
  symbol: string;
  decimals: number;
  isUsdc: boolean;
}

export interface OnchainChain {
  chainId: number;
  name: string;
  isTestnet: boolean;
  family?: string;
  explorerBase: string;
  rpcUrls: string[];
  nativeCurrency: NativeCurrencyFact;
  usdc?: TokenFact;
  cctpDomain?: number;
  scpBlockchain?: string;
}

export interface ProtocolContractFact {
  name: string;
  address: string;
  protocol: 'CCTP' | 'Gateway';
  networkKind?: 'testnet' | 'mainnet';
}

const CHAINS: OnchainChain[] = [
  {
    chainId: 5042,
    name: 'Arc',
    isTestnet: false,
    family: 'arc',
    explorerBase: 'https://explorer.arc.io',
    rpcUrls: ['https://rpc.mainnet.arc.io'],
    nativeCurrency: { symbol: 'USDC', decimals: 18, isUsdc: true },
    usdc: { symbol: 'USDC', address: '0x3600000000000000000000000000000000000000', decimals: 6 },
    cctpDomain: 26,
  },
  {
    chainId: 5042002,
    name: 'Arc Testnet',
    isTestnet: true,
    family: 'arc',
    explorerBase: 'https://explorer.testnet.arc.io',
    rpcUrls: ['https://rpc.testnet.arc.io'],
    nativeCurrency: { symbol: 'USDC', decimals: 18, isUsdc: true },
    usdc: { symbol: 'USDC', address: '0x3600000000000000000000000000000000000000', decimals: 6 },
    cctpDomain: 26,
    scpBlockchain: 'ARC-TESTNET',
  },
  {
    chainId: 1,
    name: 'Ethereum',
    isTestnet: false,
    explorerBase: 'https://etherscan.io',
    rpcUrls: ['https://ethereum.reth.rs/rpc'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  },
  {
    chainId: 8453,
    name: 'Base',
    isTestnet: false,
    family: 'op-stack',
    explorerBase: 'https://basescan.org',
    rpcUrls: ['https://mainnet.base.org'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  },
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    isTestnet: true,
    explorerBase: 'https://sepolia.etherscan.io',
    rpcUrls: ['https://11155111.rpc.thirdweb.com'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
    cctpDomain: 0,
    scpBlockchain: 'ETH-SEPOLIA',
  },
  {
    chainId: 84532,
    name: 'Base Sepolia',
    isTestnet: true,
    family: 'op-stack',
    explorerBase: 'https://sepolia.basescan.org',
    rpcUrls: ['https://sepolia.base.org'],
    nativeCurrency: { symbol: 'ETH', decimals: 18, isUsdc: false },
    usdc: { symbol: 'USDC', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
    cctpDomain: 6,
    scpBlockchain: 'BASE-SEPOLIA',
  },
];

const BY_CHAIN_ID = new Map(CHAINS.map((c) => [c.chainId, c]));

export const ONCHAIN_CHAINS: readonly OnchainChain[] = CHAINS;

export function getChain(chainId: number): OnchainChain | undefined {
  return BY_CHAIN_ID.get(chainId);
}

export function requireChain(chainId: number): OnchainChain {
  const chain = getChain(chainId);
  if (!chain) throw new Error(`Unknown chain ID ${chainId}`);
  return chain;
}

export function getUsdc(chainId: number): TokenFact | undefined {
  return getChain(chainId)?.usdc;
}

export function buildAddressExplorerUrl(chainId: number, address: string): string {
  return `${requireChain(chainId).explorerBase}/address/${address}`;
}

export function buildTxExplorerUrl(chainId: number, txHash: string): string {
  return `${requireChain(chainId).explorerBase}/tx/${txHash}`;
}
