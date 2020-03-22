
import * as StellarSdk from 'stellar-sdk';

import {
    getHintFromSignature,
    getHintFromSigner
} from './hints';

export type PubKey = string;
export type Signature = StellarSdk.xdr.DecoratedSignature;
export type AccountRecord = Pick<StellarSdk.ServerApi.AccountRecord, 'id' | 'signers' | 'thresholds' | 'balances'>;
export type AccountSignerType = 'ed25519_public_key' | 'preauth_tx' | 'sha256_hash';

export type Signer = {
    key: string;
    type: string;
    weight: number;
};

/**
 */

export type SignatureWeights = {[key: string]: number};

export type Signers = {
    hints: {[key: string]: Set<string>},
    keys: {[key: string]: SignatureWeights},
    isEmpty: boolean
};

export class TooManySignatures extends Error {}

/**
 * Returns the source account for an operation
 *
 * @private
 * @param   {StellarSdk.Operation}      op
 * @param   {StellarSdk.Transaction}    tx
 * @returns {PubKey}
 */

const getOperationSourceAccount_ = (
    op: StellarSdk.Operation,
    tx: StellarSdk.Transaction
): PubKey => (op.source ? op.source : tx.source);

/**
 * Returns the source accounts for a transaction
 *
 * @param {StellarSdk.Transaction}  tx
 * @returns {Set<PubKey>}
 */

export function getTransactionSourceAccounts(
    tx: StellarSdk.Transaction
): Set<PubKey> {
    return new Set(tx.operations.map((op) => getOperationSourceAccount_(op, tx)));
}

/**
 * Returns the threshold category of an operation
 *
 * @private
 * @param   {StellarSdk.Operation}  op
 * @returns {ThresholdCategory}
 */

const getOperationCategory_ = (
    op: StellarSdk.Operation
): string => {
    if (op.type === 'setOptions') {
        if (
            op.masterWeight ||
            op.lowThreshold ||
            op.medThreshold ||
            op.highThreshold ||
            op.signer
        ) {
            return 'high_threshold';
        }
    } else if (op.type === 'accountMerge') {
        return 'high_threshold';
    } else if (
        op.type === 'allowTrust' ||
        op.type === 'bumpSequence' ||
        op.type === 'inflation'
    ) {
        return 'low_threshold';
    }

    return 'med_threshold';
};

/**
 * Gets the required signing threshold for each source account in a transaction
 *
 * @param   {StellarSdk.Transaction}    tx
 * @param   {Array<AccountRecord>}        accounts
 * @returns {SignatureWeights}
 */

export function getThresholds(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[]
): SignatureWeights {

    const thresholds: SignatureWeights = {};
    const accountMap: {[key: string]: AccountRecord} = {};

    accounts.forEach((account) => {
        thresholds[account.id] = 1;
        accountMap[account.id] = account;
    });

    //
    //  handle transaction envelope source account
    //

    const accountThresholds = accountMap[tx.source].thresholds;
    const txThreshold = accountThresholds.low_threshold;
    thresholds[tx.source] = Math.max(thresholds[tx.source], txThreshold);

    tx.operations.forEach((op) => {
        const source = getOperationSourceAccount_(op, tx);
        const category = getOperationCategory_(op);

        const accountThresholds = accountMap[source].thresholds;
        const opThreshold = accountThresholds[category];

        thresholds[source] = Math.max(thresholds[source], opThreshold);

        if (op.type === 'setOptions') {
            if (op.lowThreshold) {
                accountThresholds.low_threshold = op.lowThreshold;
            }

            if (op.medThreshold) {
                accountThresholds.med_threshold = op.medThreshold;
            }

            if (op.highThreshold) {
                accountThresholds.high_threshold = op.highThreshold;
            }
        }
    });

    return thresholds;
}

/**
 * Gets the thresholds for when a source account rejects a transaction
 *
 * @param   {Array<AccountRecord>}    accounts
 * @param   {SignatureWeights}      thresholds
 * @returns {SignatureWeights}
 */

export function getRejectionThresholds(
    accounts: Array<AccountRecord>,
    thresholds: SignatureWeights
): SignatureWeights {

    const totals: SignatureWeights = {};
    accounts.forEach((account) => {
        const t: number = thresholds[account.id];
        totals[account.id] = account.signers
            .map(signer => signer.weight)
            .reduce((a, b) => a + b, -t);
    });

    return totals;
}

/**
 *
 * @param   {StellarSdk.Transaction}    tx
 * @param   {Array<AccountRecord>}      accounts
 * @param   {AccountSignerType}         type
 * @returns {signers}
 */

export function getSigners(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    type: AccountSignerType
): Signers {

    const signers: Signers = {
        hints: {},
        keys: {},
        isEmpty: true
    };

    const add = (signer: Signer, accountId: PubKey) => {
        const hint = getHintFromSigner(signer);
        if (!(hint in signers.hints)) {
            signers.hints[hint] = new Set();
        }

        const {key, weight} = signer;
        signers.hints[hint].add(key);

        if (!(key in signers.keys)) {
            signers.keys[key] = {};
        }
        signers.keys[key][accountId] = weight;
        signers.isEmpty = false;
    };

    accounts.forEach((account) => {
        account.signers
        .filter((signer) => signer.type !== 'preauth_tx')
        .filter((signer) => signer.type === type)
        .forEach((signer) => {
            add(signer, account.id);
        });
    });

    if (type === 'preauth_tx') {
        return signers;
    }

    //  if any op is adding/modifying a signer, apply it to its source account

    const keyType = {
        ed25519_public_key: 'ed25519PublicKey',
        sha256_hash: 'sha256Hash'
    }[type];

    for (const op of tx.operations) {
        if ((op.type === 'setOptions') &&
            op.signer &&
            (keyType in op.signer) &&
            (op.signer.weight !== 0))
        {
            const account = getOperationSourceAccount_(op, tx);
            const key_ = op.signer[keyType];
            const key = keyType === 'sha256Hash' ? StellarSdk.StrKey.encodeSha256Hash(key_) : key_;
            const weight = op.signer.weight as number;

            const signer = {
                key,
                weight,
                type
            };
            add(signer, account);
        }
    }

    return signers;
}

/**
 * @private
 * @param weights
 * @param signer
 */

const updateSigningWeights_ = (
    weights: SignatureWeights,
    signer: SignatureWeights,
): void => {

    Object.keys(signer).forEach((id) => {
        if (id in weights) {
            weights[id] += signer[id];
        } else {
            weights[id]  = signer[id];
        }
    });
};

/**
 * Validates a signature and returns the key that signed it, if any
 *
 * @param {Buffer | string} message
 * @param signers
 * @param {signature} signature
 * @return {string | null}
 */

export function validateSignature(
    message: Buffer,
    signers: Signers,
    signature: Signature
): string | null {

    const hint = getHintFromSignature(signature);
    const keys = signers.hints[hint];
    if (!keys) {
        return null;
    }

    for (let key of keys) {
        if (key[0] === 'G') {
            const keypair = StellarSdk.Keypair.fromPublicKey(key);
            const sig = signature.signature();
            if (keypair.verify(message, sig)) {
                return key;
            }
        }

        else if (key[0] === 'X') {
            const preimage = signature.signature();
            const hashx = StellarSdk.hash(preimage);
            const hashxKey = StellarSdk.StrKey.encodeSha256Hash(hashx);
            if (hashxKey === key) {
                return key;
            }
        }
    }

    return null;
}

/**
 *
 * @param weights
 * @param signers
 * @param signingKey
 */

export function addSignatureToWeights(
    weights: SignatureWeights,
    signers: Signers,
    signingKey: string
): void {
    const signer = signers.keys[signingKey];
    if (signer) {
        updateSigningWeights_(weights, signer);
    }
}

/**
 * Checks the signature weights accumulated so far, to see if enough weight has
 * been added that the signers have approved the transaction.
 *
 * @param weights
 * @param thresholds
 * @return {boolean}
 */

export function hasEnoughApprovals(
    weights: SignatureWeights,
    thresholds: SignatureWeights
): boolean {
    return Object.keys(thresholds).every((key) => weights[key] >= thresholds[key]);
}

/**
 * Checks the signature rejection weights accumulated so far, to see if enough
 * weight have been added that the signers have rejected the transaction, i.e.
 * it cannot be approved by the other signers.
 *
 * @param weights
 * @param rejects
 * @return {boolean}
 */

export function hasEnoughRejections(
    weights: SignatureWeights,
    rejects: SignatureWeights
): boolean {
    return Object.keys(rejects).every((key) => weights[key] > rejects[key]);
}

/**
 *
 * @private
 * @param tx
 * @param accounts
 * @param validatedKeys
 * @param allSignaturesMask
 * @param preAuth
 * @return {boolean}
 * @throws {TooManySignatures}
 */

const isApproved_common_ = (
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    validatedKeys: (signers: Signers) => IterableIterator<[number, string]>,
    allSignaturesMask: number,
    preAuth?: string[]
): boolean => {

    const hashXSigners = getSigners(tx, accounts, 'sha256_hash');
    const ed25519Signers = getSigners(tx, accounts, 'ed25519_public_key');
    const thresholds = getThresholds(tx, accounts);
    const weights = {};

    let isDone = false;

    if (preAuth) {
        for (let signingKey of preAuth) {
            if (isDone) {
                return true;
            }

            addSignatureToWeights(weights, ed25519Signers, signingKey);
            isDone = hasEnoughApprovals(weights, thresholds);
        }
    }

    let signaturesUsed = 0;

    const checkSignatures = (signers: Signers) => {

        if (signers.isEmpty) {
            return;
        }

        for (let [index, signingKey] of validatedKeys(signers)) {
            if (isDone) {
                break;
            }
            addSignatureToWeights(weights, signers, signingKey);
            isDone = hasEnoughApprovals(weights, thresholds);
            signaturesUsed |= (1 << index);
        }
    };

    checkSignatures(hashXSigners);
    checkSignatures(ed25519Signers);

    if (signaturesUsed !== allSignaturesMask) {
        throw new TooManySignatures();
    }

    return isDone;
};

/**
 *
 * @param tx
 * @param accounts
 * @param signingKeys
 * @param preAuth
 * @return {boolean}
 * @throws {TooManySignatures}
 */

export function isApproved_prevalidated(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    signingKeys: string[],
    preAuth?: string[]
): boolean {

    const keys = function* (signers: Signers): IterableIterator<[number, string]> {
        for (let i = 0; i < signingKeys.length; i++) {
            yield [i, signingKeys[i]];
        }
    };

    const allSignaturesMask = (1 << signingKeys.length) - 1;
    return isApproved_common_(tx, accounts, keys, allSignaturesMask, preAuth);
}

/**
 *
 * @param tx
 * @param accounts
 * @param signatures
 * @param preAuth
 * @return {boolean}
 * @throws {TooManySignatures}
 */

export function isApproved(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    signatures: Signature[],
    preAuth?: string[]
): boolean {

    const hash = tx.hash();
    const keys = function* (signers: Signers): IterableIterator<[number, string]> {
        for (let i = 0; i < signatures.length; i++) {
            const signingKey = validateSignature(hash, signers, signatures[i]);
            if (signingKey) {
                yield [i, signingKey];
            }
        }
    };

    const allSignaturesMask = (1 << signatures.length) - 1;
    return isApproved_common_(tx, accounts, keys, allSignaturesMask, preAuth);
}
