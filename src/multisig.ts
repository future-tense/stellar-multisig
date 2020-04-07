
import * as StellarSdk from 'stellar-sdk';

import {
    getHintFromSignature,
    getHintFromSigner
} from './hints';

/**
 * A string containing a StellarSdk.StrKey
 * @public
 */

export type StrKey = string;

/**
 * @public
 */

export type Signature = StellarSdk.xdr.DecoratedSignature;

/**
 * @public
 */

export type AccountRecord = Pick<StellarSdk.ServerApi.AccountRecord, 'id' | 'signers' | 'thresholds' | 'balances'>;

/**
 * @public
 */

export type AccountSignerType = 'ed25519_public_key' | 'preauth_tx' | 'sha256_hash';

/**
 * @public
 */

export type Signer = {
    key: string;
    type: string;
    weight: number;
};

/**
 * @public
 */

export type SignatureWeights = {[index: string]: number};

/**
 * `Signers` is a structure that contains the immutable parts of the information
 *  that's needed to figure out how far the process of signing a specific
 *  transaction has progressed.
 *
 * `Signers.hints` maps a signature hint to a set of StrKeys.
 *
 * `Signers.keys` maps an StrKey to a SignatureWeights structure that contains
 * the source accounts the StrKey signs for, and the signing weights
 *
 * `Signers.isEmpty` is true if Signers hasn't had any info added to it
 *
 * @public
 */

export type Signers = {
    hints: {[index: string]: Set<StrKey>},
    keys: {[index: string]: SignatureWeights},
    isEmpty: boolean
};

/**
 * An exception thrown when more signatures than needed have been added to a transaction
 *
 * @public
 */

export class TooManySignatures extends Error {}

/**
 * @internal
 */

type AccountThresholdsType = 'low_threshold' | 'med_threshold' | 'high_threshold';

/**
 * @internal
 */

type OperationSigner = {[index: string]: any};

/**
 * Returns the source account for an operation
 *
 * @internal
 * @param op - the operation
 * @param tx - the transaction that contains it
 * @returns an StrKey
 */

const _getOperationSourceAccount = (
    op: StellarSdk.Operation,
    tx: StellarSdk.Transaction
): StrKey => (op.source ? op.source : tx.source);

/**
 * Returns the source accounts for a transaction
 *
 * @public
 * @category High-level
 * @param tx - the transaction
 * @returns a set of all of the source account strkeys
 */

export function getTransactionSourceAccounts(
    tx: StellarSdk.Transaction
): Set<StrKey> {
    return new Set(tx.operations.map((op) => _getOperationSourceAccount(op, tx)));
}

/**
 * Returns the threshold category of an operation
 *
 * @internal
 * @param op - the operation
 * @returns a string
 */

const _getOperationCategory = (
    op: StellarSdk.Operation
): AccountThresholdsType => {
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
 * @public
 * @param tx - the transaction
 * @param accounts - a list of account records
 * @returns SignatureWeights
 */

export function getThresholds(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[]
): SignatureWeights {

    const thresholds: SignatureWeights = {};
    const accountMap: {[index: string]: AccountRecord} = {};

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
        const source = _getOperationSourceAccount(op, tx);
        const category = _getOperationCategory(op);

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
 * @public
 * @param accounts -
 * @param thresholds -
 * @returns SignatureWeights
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
 * Returns a `Signers` structure for a transaction
 *
 * @public
 * @param tx -
 * @param accounts -
 * @param type - the type of signers
 * @returns signers
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

    const add = (signer: Signer, accountId: StrKey) => {
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
            const account = _getOperationSourceAccount(op, tx);
            const key_ = (op.signer as OperationSigner)[keyType];
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
 * @internal
 * @param weights -
 * @param signer -
 */

const _updateSigningWeights = (
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
 * @public
 * @param message - the signed message
 * @param signers -
 * @param signature - the signature to validate
 * @returns a signer key, or null if none
 */

export function validateSignature(
    message: Buffer,
    signers: Signers,
    signature: Signature
): StrKey | null {

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
 * @public
 * @param weights - the current weights
 * @param signers - the transaction signers
 * @param signingKey - the signing key whose weight to add
 */

export function addSignatureToWeights(
    weights: SignatureWeights,
    signers: Signers,
    signingKey: string
): void {
    const signer = signers.keys[signingKey];
    if (signer) {
        _updateSigningWeights(weights, signer);
    }
}

/**
 * Checks the signature weights accumulated so far, to see if enough weight has
 * been added that the signers have approved the transaction.
 *
 * @public
 * @param weights - the current accumulated signature weights
 * @param thresholds - the thresholds for approval
 * @returns true if the thresholds have been crossed, and weights is enough
 */

export function hasEnoughWeight(
    weights: SignatureWeights,
    thresholds: SignatureWeights
): boolean {
    return Object.keys(thresholds).every((key) => weights[key] >= thresholds[key]);
}

/**
 * Checks the signature rejection weights accumulated so far, to see if enough
 * signers have rejected the transaction, such that the remaining signers doesnt'
 * have enough weight to make the transaction approved.
 *
 * @public
 * @category Low-level
 * @param weights - the accumulated signature rejection weights
 * @param thresholds - the thresholds for rejection
 * @returns true if enough rejection weight has been accumulated
 */

export function hasEnoughRejections(
    weights: SignatureWeights,
    thresholds: SignatureWeights
): boolean {
    return Object.keys(thresholds).every((key) => weights[key] > thresholds[key]);
}

/**
 * @internal
 * @param tx -
 * @param accounts -
 * @param signers -
 * @param weights -
 * @param thresholds -
 * @returns true if enough signatures have been added to approve the tx
 */

function _processPreAuthSigners(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    signers: Signers,
    weights: SignatureWeights,
    thresholds: SignatureWeights,
): boolean {

    const t: [AccountRecord, Signer][] = [];
    for (const account of accounts) {
        for (const signer of account.signers) {
            if (signer.type == 'preauth_tx') {
                t.push([account, signer]);
            }
        }
    }

    let isDone = false;
    if (t.length) {
        const hash = tx.hash();
        const key = StellarSdk.StrKey.encodePreAuthTx(hash);

        for (const [account, signer] of t) {
            if (isDone) {
                break;
            }

            if (signer.key === key) {
                const sourceAccounts = signers.keys[account.id];
                for (const source in sourceAccounts) {
                    if (source in weights) {
                        weights[source] += signer.weight;
                    } else {
                        weights[source]  = signer.weight;
                    }
                }

                isDone = hasEnoughWeight(weights, thresholds);
            }
        }
    }

    return isDone;
}

/**
 *
 * @internal
 * @param tx -
 * @param accounts -
 * @param validatedKeys -
 * @param allSignaturesMask -
 * @returns boolean
 * @throws TooManySignatures
 */

const _has_enough_common = (
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    validatedKeys: (signers: Signers) => IterableIterator<[number, string]>,
    allSignaturesMask: number
): boolean => {

    const ed25519Signers = getSigners(tx, accounts, 'ed25519_public_key');
    const thresholds = getThresholds(tx, accounts);
    const weights = {};

    let isDone = _processPreAuthSigners(tx, accounts, ed25519Signers, weights, thresholds);
    if (isDone) {
        return true;
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
            isDone = hasEnoughWeight(weights, thresholds);
            signaturesUsed |= (1 << index);
        }
    };

    const hashXSigners = getSigners(tx, accounts, 'sha256_hash');
    checkSignatures(hashXSigners);
    checkSignatures(ed25519Signers);

    if (signaturesUsed !== allSignaturesMask) {
        throw new TooManySignatures();
    }

    return isDone;
};

/**
 * Checks if the list of provided signers contains enough
 * signers to successfully sign the transaction
 *
 * @public
 * @category High-level
 * @param tx -
 * @param accounts -
 * @param signingKeys -
 * @returns true if enough signers
 * @throws TooManySignatures
 */

export function hasEnoughSigners(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    signingKeys: string[]
): boolean {

    const keys = function* (): IterableIterator<[number, string]> {
        for (let i = 0; i < signingKeys.length; i++) {
            yield [i, signingKeys[i]];
        }
    };

    const allSignaturesMask = (1 << signingKeys.length) - 1;
    return _has_enough_common(tx, accounts, keys, allSignaturesMask);
}

/**
 * Checks if the list of provided signatures contains enough
 * signatures to successfully sign the transaction
 *
 * @public
 * @category High-level
 * @param tx -
 * @param accounts -
 * @param signatures -
 * @returns true if enough signatures
 * @throws TooManySignatures
 */

export function hasEnoughSignatures(
    tx: StellarSdk.Transaction,
    accounts: AccountRecord[],
    signatures: Signature[]
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
    return _has_enough_common(tx, accounts, keys, allSignaturesMask);
}
