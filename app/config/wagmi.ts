// import { createConfig, http } from 'wagmi';
// import { baseSepolia } from 'wagmi/chains';
// import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

// // @notice Wagmi configuration for Base Sepolia
// export const wagmiConfig = createConfig({
//   chains: [baseSepolia],
//   connectors: [
//     injected(),
//     walletConnect({ projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '' }),
//     coinbaseWallet(),
//   ],
//   transports: {
//     [baseSepolia.id]: http('https://sepolia.base.org'),
//   },
// });

import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';


// @notice Wagmi configuration for Base Sepolia using wagmi v2+
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '' }),
    coinbaseWallet(),
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});