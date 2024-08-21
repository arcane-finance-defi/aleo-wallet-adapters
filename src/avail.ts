import {
    AleoDeployment,
    AleoTransaction,
    BaseMessageSignerWalletAdapter,
    DecryptPermission,
    scopePollingDetectionStrategy,
    WalletAdapterNetwork,
    WalletConnectionError,
    WalletDecryptionError,
    WalletDecryptionNotAllowedError,
    WalletDisconnectionError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
    WalletRecordsError,
    WalletSignTransactionError,
    WalletTransactionError,
} from '@demox-labs/aleo-wallet-adapter-base';
import {
    connect,
    CreateEventRequestData,
    decrypt,
    disconnect,
    EventStatus,
    EventType,
    getAccount,
    getEvent,
    getRecords,
    RecordsFilter,
    requestCreateEvent,
    requestSignature,
    SessionTypes,
} from '@puzzlehq/sdk';
import { LeoWallet } from '@demox-labs/aleo-wallet-adapter-leo';

export interface AvailWindow extends Window {
    avail?: LeoWallet;
}

declare const window: AvailWindow;

export interface AvailWalletAdapterConfig {
    appName?: string;
}

export const AvailWalletName = 'Avail Wallet' as WalletName<'Avail Wallet'>;

export class AvailWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = AvailWalletName;
    url = 'https://avail.global';
    icon = 'https://i.imgur.com/GUkFogY.png';
    readonly supportedTransactionVersions = null;

    private _connecting: boolean;
    private _wallet: SessionTypes.Struct | undefined | null;
    private _publicKey: string | null;
    private _decryptPermission: string;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor({ appName = 'sample' }: AvailWalletAdapterConfig = {}) {
        super();
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        this._decryptPermission = DecryptPermission.NoDecrypt;

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (window?.avail) {
                    this._readyState = WalletReadyState.Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                } else {
                    // Check if user is on a mobile device
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(
                        navigator.userAgent,
                    );
                    const isDesktop = /Mac|Windows|Linux/i.test(
                        navigator.userAgent,
                    );
                    if (isMobile || isDesktop) {
                        this._readyState = WalletReadyState.Loadable;
                        this.emit('readyStateChange', this._readyState);
                        return true;
                    }
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
                        const text = await decrypt([cipherText]);
                        if (text.error) {
                            throw new Error(text.error);
                        }
                        return text.plaintexts![0];
                    } catch (error: any) {
                        throw new WalletDecryptionError(
                            error?.message || 'Permission Not Granted',
                            error,
                        );
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
                const filter = {
                    programIds: [program],
                    status: 'Unspent',
                } as RecordsFilter;
                const result = await getRecords({
                    address: this.publicKey,
                    filter,
                });
                if (result.error) {
                    throw new Error(result.error);
                }
                return result.records!.map((record: any) => {
                    return {
                        ...record,
                        owner: this.publicKey,
                        program_id: program,
                        spent: false,
                    };
                });
            } catch (error: any) {
                throw new WalletRecordsError(
                    error?.message || 'Permission Not Granted',
                    error,
                );
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
                const requestData = {
                    type: EventType.Execute,
                    programId: transaction.transitions[0].program,
                    functionId: transaction.transitions[0].functionName,
                    fee: transaction.fee / 1000000,
                    inputs: transaction.transitions[0].inputs,
                } as CreateEventRequestData;
                const result = await requestCreateEvent(requestData);
                if (result.error) {
                    throw new Error(result.error);
                }
                return result.eventId ? result.eventId : '';
            } catch (error: any) {
                throw new WalletTransactionError(
                    error?.message || 'Permission Not Granted',
                    error,
                );
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
                const result = await getEvent({
                    id: transactionId,
                    address: this.publicKey,
                });
                if (result.error) {
                    throw new Error(result.error);
                }
                return result.event
                    ? result.event.status == EventStatus.Settled
                        ? 'Finalized'
                        : result.event.status
                    : '';
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestRecordPlaintexts(program: string): Promise<any[]> {
        return this.requestRecords(program);
    }

    async connect(
        decryptPermission: DecryptPermission,
        network: WalletAdapterNetwork,
    ): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (
                this._readyState !== WalletReadyState.Installed &&
                this._readyState !== WalletReadyState.Loadable
            )
                throw new WalletNotReadyError();

            this._connecting = true;

            try {
                this._wallet = await connect();
                const account = await getAccount();
                if (account.error) {
                    throw new Error(account.error);
                }
                this._publicKey = account.account?.address || null;
                this.emit('connect', this._publicKey?.toString() || '');
            } catch (error: any) {
                throw new WalletConnectionError(error?.message, error);
            }

            this._decryptPermission = decryptPermission;
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
                await disconnect();
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
                // convert message to string
                const messageString = new TextDecoder().decode(message);
                const signature = await requestSignature({
                    message: messageString,
                    address: this.publicKey,
                });
                if (signature.error) {
                    throw new Error(signature.error);
                }
                // convert signature to Uint8Array
                return new TextEncoder().encode(signature.signature!);
            } catch (error: any) {
                throw new WalletSignTransactionError(
                    error?.message || 'Permission Not Granted',
                    error,
                );
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    requestDeploy(deployment: AleoDeployment): Promise<string> {
        throw new Error('Method not implemented.');
    }

    requestExecution(transaction: AleoTransaction): Promise<string> {
        throw new Error('Method not implemented.');
    }

    requestBulkTransactions(
        transactions: AleoTransaction[],
    ): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    getExecution(transactionId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    requestTransactionHistory(program: string): Promise<any[]> {
        throw new Error('Method not implemented.');
    }
}
