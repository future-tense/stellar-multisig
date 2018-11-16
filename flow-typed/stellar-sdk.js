
declare module 'stellar-sdk' {

    /* stellar-base */

    declare class xdrBase {
        toXDR(): Buffer;
    }

    declare class xdr$Signature extends xdrBase {
        signature(): Buffer;
    }

    declare class xdr$DecoratedSignature extends xdr$Signature {
        constructor({hint: Buffer, signature: Buffer}): xdr$DecoratedSignature;
        hint(): Buffer;
    }

    declare class xdr$Transaction extends xdrBase {
    }

    declare class xdr$TransactionEnvelope extends xdrBase {
        tx: xdr$Transaction;
        signatures: Array<xdr$DecoratedSignature>;
    }

    declare class xdr$EnvelopeType extends xdrBase {
        static envelopeTypeTx(): xdr$EnvelopeType;
    }

    declare class xdr$Memo extends xdrBase {
    }

    declare class xdr$Asset extends xdrBase {
    }

    declare var xdr: {
        DecoratedSignature: typeof xdr$DecoratedSignature,
        Transaction: xdr$Transaction,
        TransactionEnvelope: xdr$TransactionEnvelope,
        EnvelopeType: typeof xdr$EnvelopeType
    };

    declare var Networks: {
        PUBLIC: string,
        TESTNET: string;
    }

    declare function hash(s: any): Buffer;

    declare type BuilderOptions = {
        fee?: number,
        timebounds?: TimeBounds,
        memo?: Memo
    }

    declare type TimeBounds = {
        minTime?: number | string,
        maxTime?: number | string
    }

    declare class Account {
        constructor(accountId: string, sequence: string): Account;
        accountId(): string;
        sequenceNumber(): string;
        incrementSequenceNumber(): void;
    }

    declare class Asset {
        code: string;
        issuer: string;

        constructor(code: string, issuer: string): Asset;
        static native(): Asset;
        static fromOperation(xdr$Asset): Asset;
        toXDRObject(): xdr$Asset;

        getCode(): string;
        getIssuer(): string;
        getAssetType(): string;
        isNative(): boolean;
        equals(asset: Asset): boolean;
    }

    declare class Keypair {
        static fromSecret(string): Keypair;
        static fromRawEd25519Seed(Buffer): Keypair;
        static master(): Keypair;
        static fromPublicKey(publicKey: string): Keypair;
        static random(): Keypair;
        xdrAccountId(): Buffer;
        xdrPublicKey(): Buffer;
        rawPublicKey(): Buffer;
        signatureHint(): Buffer;
        publicKey(): string;
        secret(): string;
        rawSecretKey(): Buffer;
        canSign(): boolean;
        sign(Buffer): Buffer;
        verify(message: Buffer, signature: Buffer): boolean;
        signDecorated(Buffer): xdr$DecoratedSignature;
    }

    declare class Memo {
        type: string;
        value: null | string | Buffer;
        static none(): Memo;
        static text(string): Memo;
        static id(string): Memo;
        static hash(any): Memo;
        static return(any): Memo;
        toXDRObject(): xdr$Memo;
        static fromXDRObject(xdr$Memo): Memo;
    }

    declare class Network {
        _networkPassphrase: string;

        constructor(networkPassphrase: string): Network;
        static usePublicNetwork(): void;
        static useTestNetwork(): void;
        static use(Network): void;
        static current(): Network;
        networkPassphrase(): string;
        networkId(): string;
    }

    declare class Operation {
        source: string;
        type: string;
        masterWeight: number;
        lowThreshold: number;
        medThreshold: number;
        highThreshold: number;
        signer: Object;
        static payment(Object): Operation;
    }

    declare class StrKey {
        static encodeEd25519PublicKey(Buffer): string;
        static decodeEd25519PublicKey(string): Buffer;
        static isValidEd25519PublicKey(string): boolean;
        static encodeEd25519SecretSeed(Buffer): string;
        static decodeEd25519SecretSeed(string): Buffer;
        static isValidEd25519SecretSeed(string): boolean;
        static encodePreAuthTx(Buffer): string;
        static decodePreAuthTx(string): Buffer;
        static encodeSha256Hash(Buffer): string;
        static decodeSha256Hash(string): Buffer;
    }

    declare class Transaction {
        source: string;
        tx: xdr$Transaction;
        signatures: Array<xdr$DecoratedSignature>;
        operations: Array<Operation>;
        memo: Memo;
        sequence: string;
        fee: number | string;
        timeBounds?: TimeBounds;
        _memo: xdr$Memo;

        constructor(envelope: string | xdr$TransactionEnvelope): Transaction;
        sign(Array<Keypair>): void;
        signHashX(Buffer | string): void;
        hash(): Buffer;
        signatureBase(): Buffer;
        toEnvelope(): xdr$TransactionEnvelope;
    }

    declare class TransactionBuilder {
        source: string;
        operations: Array<Operation>;
        baseFee: number;
        timebounds?: TimeBounds;
        memo: Memo;

        constructor(sourceAccount: Account, opts: ?BuilderOptions): TransactionBuilder;
        addOperation(Operation): TransactionBuilder;
        addMemo(Memo): TransactionBuilder;
        build(): Transaction;
    }

    /* stellar-sdk */

    declare type SignerTypeEnum = (
        'ed25519_public_key' |
        'preauth_tx' |
        'sha256_hash'
    );

    declare type Signer = {
        key: string,
        public_key?: string,
        type: SignerTypeEnum,
        weight: number
    }

    declare type AssetTypeEnum = (
        'native' |
        'credit_alphanum4' |
        'credit_alphanum12'
    );

    declare type Trustline = {
        balance: string | number,
        asset_type: AssetTypeEnum,
        asset_issuer?: string,
        asset_code?: string,
        limit?: number
    }

    declare type AccountFlagsEnum = (
        'auth_required' |
        'auth_revocable' |
        'auth_immutable'
    );

    declare type ThresholdCategory = (
        'low_threshold' |
        'med_threshold' |
        'high_threshold'
    );

    declare type AccountInfo = {
        balances: Array<Trustline>,
        flags: {[AccountFlagsEnum]: boolean},
        id: string,
        inflationDest?: string,
        sequence: string,
        signers: Array<Signer>,
        subentryCount: number,
        thresholds: {[ThresholdCategory]: number},
    }

    declare class Server {
        constructor(url: any): Server;
        accounts(): AccountCallBuilder;
    }

    declare class AccountCallBuilder {
        accountId(id: string): AccountCallBuilder;
        call(): Promise<AccountInfo>;
    }
}
