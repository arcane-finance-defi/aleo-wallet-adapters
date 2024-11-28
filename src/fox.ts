import {
    BaseMessageSignerWalletAdapter,
    scopePollingDetectionStrategy,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
    WalletSignTransactionError,
    WalletDecryptionNotAllowedError,
    WalletDecryptionError,
    WalletRecordsError,
    DecryptPermission,
    WalletAdapterNetwork,
    AleoTransaction,
    AleoDeployment,
    WalletTransactionError,
} from '@demox-labs/aleo-wallet-adapter-base';
import {
    LeoWallet,
    LeoWalletAdapterConfig,
} from '@demox-labs/aleo-wallet-adapter-leo';

export interface FoxWindow extends Window {
    foxwallet?: { aleo?: LeoWallet };
}

declare const window: FoxWindow;

export const FoxWalletName = 'Fox Wallet' as WalletName<'Fox Wallet'>;

export class FoxWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = FoxWalletName;
    url = 'https://foxwallet.com/download';
    icon =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAwIiBoZWlnaHQ9IjkwMCIgdmlld0JveD0iMCAwIDkwMCA5MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI5MDAiIGhlaWdodD0iOTAwIiByeD0iNDUwIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTU3Ny4yNDkgMjE1Ljk3NUM1MzkuOTU2IDE5Ni4yMzIgNTExLjY0NiAxNjEuNTQ5IDUwMC40NjggMTE5Ljg2OEM0OTcuMDIxIDEzMi42MTMgNDk1LjI0NSAxNDUuOTg0IDQ5NS4yNDUgMTU5Ljc3NEM0OTUuMjQ1IDE3MC41MzMgNDk2LjM5NCAxODAuOTggNDk4LjQ4MyAxOTEuMTEzQzQ5OC40ODMgMTkxLjExMyA0OTguNDgzIDE5MS4xMTMgNDk4LjQ4MyAxOTEuMjE3QzQ5OC40ODMgMTkxLjMyMiA0OTguNTg4IDE5MS41MzEgNDk4LjU4OCAxOTEuNjM1QzUwMS40MDggMjA1LjIxNiA1MDYuMDA1IDIxOC4wNjUgNTEyLjE2OCAyMjkuOTc0QzQ5OS4wMDYgMjIwLjI1OCA0ODcuMzA2IDIwOC42NjMgNDc3LjQ4NiAxOTUuNjA1QzQ2NC4zMjMgMjk3LjY2NyA1MDEuNDA4IDQwMy45MDcgNTY5LjIwNiA0NzMuODk4QzY1Ny42ODcgNTc2LjkgNTc2LjEgNzUxLjY2OSA0MzguMjA3IDc0Ny4wNzNDMjQzLjA2OCA3NDguNzQ0IDIwOS42MzkgNDYxLjM2MiAzOTYuODM5IDQxNi4yMzRMMzk2LjczNSA0MTUuNzExQzQ0Ni42NjkgMzk5LjUxOSA0NzAuMDY5IDM2Ny4wMzEgNDc0LjE0MyAzMjQuODI3QzQwMi4wNjMgMzgzLjIyMyAyODguMTk2IDMxMC44MjkgMzExLjgwNSAyMjAuMTU0QzQxLjI0MjUgMzUzLjM0NiAxNDEuNzM3IDc4NS40MTEgNDQ4LjQ0NSA3ODAuMDgzQzU4Mi4wNTUgNzgwLjA4MyA2OTUuMDg1IDY5MS43MDYgNzMyLjE3IDU3MC4yMTRDNzc2LjQ2MyA0MjguNTYxIDcwNC44IDI3Ny42MDkgNTc3LjI0OSAyMTUuOTc1WiIgZmlsbD0iIzEyRkU3NCIvPgo8L3N2Zz4K';
    readonly supportedTransactionVersions = null;

    private _connecting: boolean;
    private _wallet: LeoWallet | null;
    private _publicKey: string | null;
    private _decryptPermission: string;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor({}: LeoWalletAdapterConfig = {}) {
        super();
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        this._decryptPermission = DecryptPermission.NoDecrypt;

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (window?.foxwallet && window.foxwallet?.aleo) {
                    this._readyState = WalletReadyState.Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
        }
    }

    get publicKey() {
        return this._publicKey;
    }

    get decryptPermission() {
        return this._decryptPermission;
    }

    get connecting() {
        return this._connecting;
    }

    get readyState() {
        return this._readyState;
    }

    set readyState(readyState) {
        this._readyState = readyState;
    }

    async decrypt(
        cipherText: string,
        tpk?: string,
        programId?: string,
        functionName?: string,
        index?: number,
    ) {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            switch (this._decryptPermission) {
                case DecryptPermission.NoDecrypt:
                    throw new WalletDecryptionNotAllowedError();

                case DecryptPermission.UponRequest:
                case DecryptPermission.AutoDecrypt:
                case DecryptPermission.OnChainHistory: {
                    try {
                        const text = await wallet.decrypt(
                            cipherText,
                            tpk,
                            programId,
                            functionName,
                            index,
                        );
                        return text.text;
                    } catch (error: any) {
                        throw new WalletDecryptionError(error?.message, error);
                    }
                }
                default:
                    throw new WalletDecryptionError();
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestRecords(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestRecords(program);
                return result.records;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestTransaction(transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestTransaction(transaction);
                return result.transactionId || '';
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestExecution(transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestExecution(transaction);
                return result.transactionId || '';
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestBulkTransactions(
        transactions: AleoTransaction[],
    ): Promise<string[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestBulkTransactions(
                    transactions,
                );
                return result.transactionIds || [''];
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestDeploy(deployment: AleoDeployment): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                // @ts-ignore
                const result = await wallet.requestDeploy(deployment);
                return result.transactionId || '';
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async transactionStatus(transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.transactionStatus(transactionId);
                return result.status;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async getExecution(transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.getExecution(transactionId);
                return result.execution;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestRecordPlaintexts(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestRecordPlaintexts(program);
                return result.records;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestTransactionHistory(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestTransactionHistory(program);
                return result.transactions;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async connect(
        decryptPermission: DecryptPermission,
        network: WalletAdapterNetwork,
        programs?: string[],
    ): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState !== WalletReadyState.Installed)
                throw new WalletNotReadyError();

            this._connecting = true;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = window.foxwallet && window.foxwallet.aleo;

            try {
                if (wallet)
                    await wallet.connect(decryptPermission, network, programs);
                if (!wallet?.publicKey) {
                    throw new WalletConnectionError();
                }
                this._publicKey = wallet.publicKey!;
            } catch (error: any) {
                throw new WalletConnectionError(error?.message, error);
            }

            this._wallet = wallet;
            this._decryptPermission = decryptPermission;

            this.emit('connect', this._publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            // wallet.off('disconnect', this._disconnected);

            this._wallet = null;
            this._publicKey = null;

            try {
                await wallet.disconnect();
            } catch (error: any) {
                this.emit(
                    'error',
                    new WalletDisconnectionError(error?.message, error),
                );
            }
        }

        this.emit('disconnect');
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const signature = await wallet.signMessage(message);
                return signature.signature;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }
}
