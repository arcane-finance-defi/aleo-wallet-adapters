export { configureConnection as configureConnectionForPuzzle } from '@puzzlehq/sdk';


export { LeoWalletAdapter, LeoWalletName } from '@demox-labs/aleo-wallet-adapter-leo';
export type { LeoWallet, LeoWalletEvents, LeoWindow, LeoWalletAdapterConfig } from '@demox-labs/aleo-wallet-adapter-leo';

export { FoxWalletAdapter, FoxWalletName } from './fox';
export type { FoxWindow } from './fox';

export { PuzzleWalletAdapter, PuzzleWalletName } from './puzzle';
export type { PuzzleWindow, PuzzleWalletAdapterConfig } from './puzzle';

export { SoterWalletAdapter, SoterWalletName } from './soter';
export type { SoterWindow, SoterWalletAdapterConfig } from './soter';

export { version } from './version';