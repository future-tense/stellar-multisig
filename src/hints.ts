
import * as StellarSdk from 'stellar-sdk';

import {
    StrKey,
    Signature,
    Signer
} from './multisig';

/**
 * A signature hint is a shortened string used to identify a signer
 * @public
 */

export type SignatureHint = string;

/**
 * Returns a signature hint from a public key
 *
 * @public
 * @param key -
 * @returns SignatureHint
 */

export const getHintFromPubKey = (
    key: StrKey
): SignatureHint =>
    StellarSdk.Keypair.fromPublicKey(key).signatureHint().toString('hex');

/**
 * Returns a signature hint from a SHA256 hash
 *
 * @internal
 * @param key -
 * @returns SignatureHint
 */

const _getHintFromHash = (
    key: StrKey
): SignatureHint =>
    StellarSdk.StrKey.decodeSha256Hash(key).slice(28).toString('hex');

/**
 * @internal
 */

const hintFunc: {[index: string]: any} = {
    'sha256_hash':          _getHintFromHash,
    'sha256Hash':           _getHintFromHash,
    'ed25519_public_key':   getHintFromPubKey,
    'ed25519PublicKey':     getHintFromPubKey
};

/**
 *  Returns a signature hint from a signer
 *
 * @public
 * @param signer -
 * @returns SignatureHint
 */

export const getHintFromSigner = (
    signer: Signer
): SignatureHint => hintFunc[signer.type](signer.key);

/**
 * Returns a signature hint from a signature
 *
 * @public
 * @param sig -
 * @returns SignatureHint
 */

export const getHintFromSignature = (
    sig: Signature
): SignatureHint => sig.hint().toString('hex');
