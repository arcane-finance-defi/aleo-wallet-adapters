export { configureConnection as configureConnectionForPuzzle } from '@puzzlehq/sdk';

export { LeoWalletAdapter, LeoWalletName } from '@demox-labs/aleo-wallet-adapter-leo';
export type { LeoWallet, LeoWalletEvents, LeoWindow, LeoWalletAdapterConfig } from '@demox-labs/aleo-wallet-adapter-leo';

export { FoxWalletAdapter, FoxWalletName } from './fox.js';
export type { FoxWindow } from './fox.js';

export { PuzzleWalletAdapter, PuzzleWalletName } from './puzzle.js';
export type { PuzzleWindow, PuzzleWalletAdapterConfig } from './puzzle.js';

export {AvailWalletAdapter, AvailWalletName} from './avail.js';
export type { AvailWindow, AvailWalletAdapterConfig } from './avail.js';

export { SoterWalletAdapter, SoterWalletName } from './soter.js';
export type { SoterWindow, SoterWalletAdapterConfig } from './soter.js';

export { version } from './version.js';