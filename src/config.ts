/**
 * wagmi configuration — ArcLink
 * Active target: Arc Mainnet (5042).
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'
import {
  ARC_MAINNET_CHAIN_ID,
  ARC_MAINNET_RPC,
  ARC_MAINNET_EXPLORER,
  ARC_MAINNET_USDC,
} from './chain-config'

/** Arc Mainnet viem chain definition. */
export const arcMainnet = defineChain({
  id: ARC_MAINNET_CHAIN_ID,
  name: 'Arc',
  nativeCurrency: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 18, // gas token uses 18 decimals; ERC-20 USDC uses 6
  },
  rpcUrls: {
    default: { http: [ARC_MAINNET_RPC] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: ARC_MAINNET_EXPLORER },
  },
  contracts: {
    usdc: {
      address: ARC_MAINNET_USDC,
    },
  },
})

// Register chain RPC URL for trace event labelling
registerChain(arcMainnet.id, arcMainnet.rpcUrls.default.http[0])

export const config = createConfig({
  chains: [arcMainnet, mainnet],
  connectors: [injected()],
  transports: {
    [arcMainnet.id]: http(ARC_MAINNET_RPC),
    [mainnet.id]:    http(), // ENS resolution only
  },
})
