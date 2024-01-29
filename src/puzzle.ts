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
    SessionTypes
  } from "@puzzlehq/sdk";
  import {LeoWallet} from "@demox-labs/aleo-wallet-adapter-leo";
  
  
  export interface PuzzleWindow extends Window {
    puzzle?: LeoWallet;
  }
  
  
  declare const window: PuzzleWindow;
  
  export interface PuzzleWalletAdapterConfig {
    appName?: string
  }
  
  export const PuzzleWalletName = 'Puzzle Wallet' as WalletName<'Puzzle Wallet'>;
  
  export class PuzzleWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = PuzzleWalletName;
    url = 'https://chrome.google.com/webstore/detail/fdchdcpieegfofnofhgdombfckhbcokj';
    icon = 'data:image/png;base64,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';
    readonly supportedTransactionVersions = null;
  
    private _connecting: boolean;
    private _wallet: SessionTypes.Struct | undefined | null;
    private _publicKey: string | null;
    private _decryptPermission: string;
    private _readyState: WalletReadyState =
      typeof window === 'undefined' || typeof document === 'undefined'
        ? WalletReadyState.Unsupported
        : WalletReadyState.NotDetected;
  
    constructor({appName = 'sample'}: PuzzleWalletAdapterConfig = {}) {
      super();
      this._connecting = false;
      this._wallet = null;
      this._publicKey = null;
      this._decryptPermission = DecryptPermission.NoDecrypt;
  
      if (this._readyState !== WalletReadyState.Unsupported) {
        scopePollingDetectionStrategy(() => {
          if (window?.puzzle) {
            this._readyState = WalletReadyState.Installed;
            this.emit('readyStateChange', this._readyState);
            return true;
          } else {
            // Check if user is on a mobile device
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
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
  
    async decrypt(cipherText: string, tpk?: string, programId?: string, functionName?: string, index?: number) {
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
          const filter = {
            programIds: [program],
            type: "unspent"
          } as RecordsFilter;
          const result = await getRecords({address: this.publicKey, filter});
          if (result.error) {
            throw new Error(result.error);
          }
          return result.records!.map((record: any) => {
            return {
              ...record,
              owner: this.publicKey,
              program_id: program,
              spent: false
            };
          });
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
          const requestData = {
            type: EventType.Execute,
            programId: transaction.transitions[0].program,
            functionId: transaction.transitions[0].functionName,
            fee: transaction.fee / 1000000,
            inputs: transaction.transitions[0].inputs
          } as CreateEventRequestData;
          const result = await requestCreateEvent(requestData);
          if (result.error) {
            throw new Error(result.error);
          }
          return result.eventId ? result.eventId : "";
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
          const result = await getEvent({id: transactionId, address: this.publicKey});
          if (result.error) {
            throw new Error(result.error);
          }
          return result.event ? (result.event.status == EventStatus.Settled ? "Finalized" : result.event.status) : "";
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
  
    async connect(decryptPermission: DecryptPermission, network: WalletAdapterNetwork): Promise<void> {
      try {
        if (this.connected || this.connecting) return;
        if (this._readyState !== WalletReadyState.Installed && this._readyState !== WalletReadyState.Loadable)
          throw new WalletNotReadyError();
  
        this._connecting = true;
  
        try {
          this._wallet = await connect();
          const account = await getAccount();
          if (account.error) {
            throw new Error(account.error);
          }
          this._publicKey = account.account?.address;
          this.emit('connect', this._publicKey);
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
          this.emit('error', new WalletDisconnectionError(error?.message, error));
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
            address: this.publicKey
          });
          if (signature.error) {
            throw new Error(signature.error);
          }
          // convert signature to Uint8Array
          return new TextEncoder().encode(signature.signature!);
        } catch (error: any) {
          throw new WalletSignTransactionError(error?.message, error);
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
  
    requestBulkTransactions(transactions: AleoTransaction[]): Promise<string[]> {
      throw new Error('Method not implemented.');
    }
  
    getExecution(transactionId: string): Promise<string> {
      throw new Error('Method not implemented.');
    }
  
    requestTransactionHistory(program: string): Promise<any[]> {
      throw new Error('Method not implemented.');
    }
}