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
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTM1IiBoZWlnaHQ9IjU1MSIgdmlld0JveD0iMCAwIDUzNSA1NTEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEyLjQzNCAzMTIuMjQ5QzIxMy42NDMgMzEyLjY0NCAyMTQuODkgMzEyLjkwOSAyMTYuMTU0IDMxMy4wNDJDMjE2LjE1NCAzMTMuMDQyIDIxMC45MTQgMzE1LjAwNSAyMDAuMDc0IDMxMS4zMzRDMjAwLjA3NCAzMTEuMzM0IDE5MS45NjQgMzA4LjAzNCAxODUuODg0IDMwOC41ODhDMTc4LjgyNCAzMDkuMjI3IDE3My45NTQgMzE4LjQwNiAxNzMuOTU0IDMxOC40MDZDMTc1LjM0OSAzMTcuNjUxIDE3Ni44MyAzMTcuMDY3IDE3OC4zNjQgMzE2LjY2NkMxODMuMTc0IDMxNS42ODkgMTgxLjUxNCAzMTYuNTA1IDE4MS41MTQgMzE2LjUwNUMxODEuNTE0IDMxNi41MDUgMTcyLjI2NCAzMjAuMzgxIDE3MS42MzQgMzIzLjgyOEMxNzEuNDg0IDMyNC42ODggMTc0LjA3NCAzMjIuMjYgMTgwLjkxNCAzMjIuNDc1QzE4OS4zMTQgMzIyLjczOSAxOTYuNjE0IDMyNy42MTUgMTk5LjYxNCAzMjguNDE5QzIwNS43NjQgMzMwLjA2NCAyMTQuNTg0IDMzMC40MzkgMjIyLjY3NCAzMjQuMDk1QzIyMi42NzQgMzI0LjA5NSAyMzAuMTQ0IDMxOS40MTEgMjMyLjQ1NCAzMTAuNzU1QzIzMy4wNTIgMzA4LjM1NCAyMzMuNDA0IDMwNS44OTggMjMzLjUwNCAzMDMuNDI1QzIzMy41NDIgMzAxLjI1IDIzMy4zMiAyOTkuMDc3IDIzMi44NDQgMjk2Ljk1NEMyMzIuODQ0IDI5Ni45NTQgMjI4LjQ3NCAzMDcuMDczIDIxMi40MzQgMzEyLjI0OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzcxLjMwNCA0MDcuMTlDMzg3LjYgMzg2Ljc2MSAzOTYuNDc0IDM2MS40MDQgMzk2LjQ3NCAzMzUuMjczQzM5Ni40NzQgMzA5LjE0MSAzODcuNiAyODMuNzg0IDM3MS4zMDQgMjYzLjM1NUw0NzUuNjk0IDI1MS44NzNDNDc1LjY5NCAyNTEuODczIDQ4Ni41NDQgMjgxLjYzIDQ4OS40MDQgMjk3LjU0MUM0ODkuNzc0IDI5OS41OCA0OTAuNDE0IDMwMy42ODcgNDkwLjQxNCAzMDMuNjg3QzQ5MC40MTQgMzAzLjY4NyA0NzQuMjI0IDM0Mi45OTggNDQ5LjM2NCAzNjQuNTk5QzQxNS45NTQgMzkzLjYzMyAzNzEuMzA0IDQwNy4xOSAzNzEuMzA0IDQwNy4xOVpNMTI0LjExIDQwNS43NTZMODQuMDk4MiA0MTMuMTczQzcxLjQwMSAzODEuMDIgNjYuNzYxNCAzNDYuMjQ5IDcwLjU4MzkgMzExLjg5MUM3NC40MDY1IDI3Ny41MzMgODYuNTc1MiAyNDQuNjMyIDEwNi4wMjkgMjE2LjA1NkMxMDYuODc0IDIxNC44MTcgMTA4LjYwNCAyMTIuMzY5IDEwOC42MDQgMjEyLjM2OUwxNTIuODE0IDMzNi44NzNMMTI0LjExIDQwNS43NTZaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfNzRfNTMpIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjY4Ljg1NCAxNTAuNDI1QzI2OC45ODQgMTUwLjI1NiAyNjkuMDk0IDE1MC4xODEgMjY5LjIzNCAxNTAuMDFDMjcwLjMwNCAxNDguODc4IDI5NS4xNDQgMTIyLjE0NyAyNjUuNTI0IDc2LjkzOEMyNDMuNjY0IDQzLjU5OSAxODguMDA0IDQ0LjUzOCAxNjUuMjg0IDI3LjE4N0MxNjYuOTY0IDQwLjU1MiAxODAuMDY0IDUyLjU5OSAxNzguNjQ0IDcwLjkxNEMxNzguMDg3IDc2Ljk0OTkgMTc2Ljk1OSA4Mi45MTk0IDE3NS4yNzQgODguNzQyQzE3Mi41NjQgOTkuMTk4IDE3MC4wNjQgMTA5LjExMiAxNzMuODE0IDEyOC42QzE3Ni43NDQgMTQzLjc4MyAxODMuNjY0IDE1NC44NjEgMTk0LjQwNCAxNjEuNTI4QzIwNi42OTQgMTY5LjE0OCAyMjMuNzE0IDE3MC44MjIgMjQxLjE3NCAxNjYuMDc0QzI1Mi44NzQgMTYyLjg5MSAyNjMuMjI0IDE1Ny4wMTQgMjY4Ljg1NCAxNTAuNDI1WiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzc0XzUzKSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwNS45MTQgMTMwLjkyNkMzMTIuMjk0IDExOS45MTYgMzEzLjUwNCAxMDcuMDY5IDMwOS41ODQgOTIuODJDMzA0LjEyNCA3Mi45MTIgMjkzLjY5NCA1OS44NTggMjg1LjI4NCA0OS4zNjFDMjgyLjY1NCA0Ni4wMzkgMjgwLjE2NCA0Mi45NDIgMjc4LjE3NCA0MC4wMjJDMjcwLjE3OCAyOC4zMDY1IDI2Ni43MzIgMTQuMDc1NiAyNjguNDg0IDBDMjU4LjM0NCA3LjI4NiAyMzguODM0IDIxLjA2OCAyMjYuMzQ0IDM1LjczNkMyNDQuMzc0IDQ0LjM3MiAyNTguNDQ0IDUzLjc5NiAyNjkuNTk0IDcwLjc4MkMyODguNTY0IDk5LjcxMiAyODguMjY0IDEyMy4wOTYgMjg0LjY2NCAxMzcuNjE0QzI4My42NTQgMTQxLjYxNCAyOTEuMzA0IDE0NS4xNTMgMjg5Ljg4NCAxNDguMjQ5QzI5Ni4zNjIgMTQzLjYzOSAzMDEuODIgMTM3Ljc0MiAzMDUuOTE0IDEzMC45MjZaIiBmaWxsPSJ1cmwoI3BhaW50Ml9saW5lYXJfNzRfNTMpIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNDQ0LjE3MyAyNTEuMTE3QzQyMi45NzMgMjQ5LjA5OSAzODAuMDMzIDI0My44NzkgMzgwLjAzMyAyNDMuODc5QzI4My40NTMgMjM4LjQ5OCAyMjguNjQzIDI2Ny40ODUgMTg3LjI1MyAzMDUuNDA5QzE1NS4zMTMgMzM3LjEyMyAxMjYuODczIDQxOS4zNjMgMTI2Ljg3MyA0MTkuMzYzTDkyLjI3OTMgNDE3LjQ4NkM5Mi4yNzkzIDQxNy40ODYgMTAzLjMwMiAzODQuNjcgMTE2LjAzNyAzNjAuOEMxMzAuNjM3IDMzMy40MzQgMTMzLjkxNyAzMzUuNjcgMTMwLjYwMiAzMzEuMTEzQzExNS4xNjUgMzA5Ljg5MyAxMDcuOTMxIDI5My4yMTggMTAxLjcyMyAyNTcuNTVDMTAxLjcyMyAyNTcuNTUgMTA4Ljk4NSAyNjMuMjUgMTE0LjQ3OCAyNTkuNzdDMTE0LjQ3OCAyNTkuNzcgMTAyLjAwMSAyMzguMTE0IDEwMC4wNzggMjE0Ljc1N0M5Ni42NjkzIDE3My4zNTEgMTE2LjA2MSAxMTYuODM0IDExNi41MTEgMTE1LjUzQzExNi4zMjYgMTE2LjEyMyAxMTUuMjg4IDEyMC45ODMgMTI2LjY2OCAxMjguMjM2QzEyNy40ODIgMTI0LjgxMiAxMjguMzQ1IDEyMS40NjQgMTI5LjI1NyAxMTguMTk0QzEzMy4yNjkgOTguNjU4OCAxNDMuOTYzIDU2LjAyMDggMTY1LjM2MyAyNy4xMTI4QzE2NS4zNjMgMjcuMTEyOCAxNzcuMzMzIDY4LjkwNTggMjA3LjM5MyA4Ny44NjI4QzI2NS45MTMgMTI0Ljc3OCAzMDIuNTUzIDEyNC45NzYgMzAyLjU1MyAxMjQuOTc2QzM4NS4yMjMgMTM0LjIyIDQyMC41MjMgMTc0Ljc3NiA0MjAuNTIzIDE3NC43NzZDNDc5Ljg1MyAyMzguNzc2IDUzMy43NDMgMjM4LjE3NiA1MzMuNzQzIDIzOC4xNzZDNTE0LjM4MyAyNTYuNjg4IDQ0NC4xNzMgMjUxLjExNyA0NDQuMTczIDI1MS4xMTdaTTExNi41MTEgMTE1LjUzQzExNi41MTcgMTE1LjUwOSAxMTYuNTI0IDExNS40ODkgMTE2LjUzMiAxMTUuNDY5TDExNi41MTEgMTE1LjUzWiIgZmlsbD0idXJsKCNwYWludDNfbGluZWFyXzc0XzUzKSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUzNC43NTQgMjM4LjE4NUM1MzQuNzU0IDIzOC4xODUgNTI2LjM0NCAyODQuNzQyIDQ4Mi4yMzQgMjkwLjE3MkM0ODIuMjM0IDI5MC4xNzIgMzIyLjI5NCAyODkuMTQgMzEwLjYzNCA0MzQuNDM1TDMwNy45MjQgNDc1LjI1MkwxMTYuMDQ5IDQxOS4zMzFDMTE2LjA0OSA0MTkuMzMxIDEzNC4xNDMgMzU3LjYzOSAxNzMuNjg0IDMwOC4xMDlDMTczLjY4NCAzMDguMTA5IDI0MC44NDQgMjEzLjIzIDQzMi4yMzQgMjM4LjIzMUM0MzIuMjM0IDIzOC4yMzEgNDU0LjU4NCAyNDIuNzMxIDQ4NS45NDQgMjQ1LjY2OEM1MTIuNDQ0IDI0OC4xNDkgNTM0Ljc1NCAyMzguMTg1IDUzNC43NTQgMjM4LjE4NVoiIGZpbGw9InVybCgjcGFpbnQ0X2xpbmVhcl83NF81MykiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00MjUuOTM0IDIxNi4wNDNDNDI1LjkzNCAyMTYuMDQzIDM4NC4zODQgMTk0LjQzMiAzMzIuNzA0IDE5Ni40NzJDMzMyLjcwNCAxOTYuNDcyIDM2MC44MTQgMTc0LjUwNiAzOTguODA0IDE3OS44NzJMNDI1LjkzNCAyMTYuMDQzWiIgZmlsbD0iIzcyMkIwMCIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyMC44OTQgNDE0LjUyM0MzMjAuODk0IDQxNC41MjMgMzM0LjQwNCA0MjMuODQ4IDM1NS44NjQgNDE4Ljg5NUMzNTUuODY0IDQxOC44OTUgMzIxLjE5NCA0MzguOTk1IDI0OC4xMjQgNDExLjQzNkMyNDguMTI0IDQxMS40MzYgMTcyLjc2NCAzNzcuNzI4IDExOS43NTQgMzg1LjQxNEM4NS42ODE5IDM5MC4zNTQgNTUuNTUzOSA0MTcuNDI0IDM3LjMwODkgNDM4LjAzM0MxNS4yNjQ5IDQ2Mi45MzMgMTguMDA4OSA0NTEuMjkyIDczLjM2ODkgNDQ0LjQ0MUM4Ni42NzY5IDQ0Mi43OTQgNzkuMDEyOCA0NDYuNTc5IDc5LjAxMjggNDQ2LjU3OUM3OS4wMTI4IDQ0Ni41NzkgNS4wNTA4OCA0NzcuNTU5IDAuMDUyODc2OSA1MDUuMTE1Qy0xLjE5NTEyIDUxMS45OTUgMTkuNTM1OSA0OTIuNTggNzQuMjAzOSA0OTQuMzAxQzE0MS4zMTQgNDk2LjQxNCAxOTkuNzA0IDUzNS4zODggMjIzLjcxNCA1NDEuODEzQzI3Mi44NjQgNTU0Ljk2MiAzNDMuMzY0IDU1Ny45NjQgNDA4LjAzNCA1MDcuMjQ4QzQwOC4wMzQgNTA3LjI0OCA0NjcuNzE0IDQ2OS44MDUgNDg2LjE2NCA0MDAuNjE1QzQ5MC45NjQgMzgxLjQyIDQ5My43OTIgMzYxLjc4NSA0OTQuNjA0IDM0Mi4wMTVDNDk1LjU4NCAzMTYuMjUyIDQ4Ny43NDQgMjg5LjEzIDQ4Ny43NDQgMjg5LjEzQzQ4Ny43NDQgMjg5LjEzIDQ0NC4xMzQgMzg1LjczNyAzMjAuODk0IDQxNC41MjNaIiBmaWxsPSJ1cmwoI3BhaW50NV9saW5lYXJfNzRfNTMpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNzRfNTMiIHgxPSIyNzEuNSIgeTE9IjIwNiIgeDI9IjI3OS44NDkiIHkyPSI0MTMuMTczIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNEQURCNDgiLz4KPHN0b3Agb2Zmc2V0PSIwLjY1NjI1IiBzdG9wLWNvbG9yPSIjNjM3NjIxIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhcl83NF81MyIgeDE9IjI4MCIgeTE9IjEwOS41IiB4Mj0iMTc4LjUiIHkyPSIxMDkuNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRUM2RjAxIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y0QjIzRCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Ml9saW5lYXJfNzRfNTMiIHgxPSIyODguNSIgeTE9IjExNCIgeDI9IjI4Mi41IiB5Mj0iMTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y0QjMzRSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGQjZGMUIiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDNfbGluZWFyXzc0XzUzIiB4MT0iMTI2LjUiIHkxPSIxMTQuNSIgeDI9IjQ4My41IiB5Mj0iMjU1LjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0ZCNkQxQSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGM0IyM0UiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDRfbGluZWFyXzc0XzUzIiB4MT0iMTY0IiB5MT0iMzk5LjUiIHgyPSI1MDMiIHkyPSIyNTAuNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRjNCNjNGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZCNzAxQyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50NV9saW5lYXJfNzRfNTMiIHgxPSIxNTIiIHkxPSI1NTAiIHgyPSI0NDUuNSIgeTI9IjM2NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRUM2RjAwIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y0QjMzRSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=';
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
