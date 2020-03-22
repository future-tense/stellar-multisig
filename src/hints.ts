
import * as StellarSdk from 'stellar-sdk';

import {
    PubKey,
    Signature,
    Signer
} from './multisig';

/**
 * A signature hint is a shortened string used to identify a signer
 */

export type SignatureHint = string;

/**
 * Returns a signature hint from a public key
 *
 * @param {PubKey} key
 * @return {SignatureHint}
 */

export const getHintFromPubKey = (
    key: string
): SignatureHint =>
    StellarSdk.Keypair.fromPublicKey(key).signatureHint().toString('hex');

/**
 * Returns a signature hint from a SHA256 hash
 *
 * @param {string} key
 * @return {SignatureHint}
 */

const getHintFromHash = (
    key: string
): SignatureHint =>
    StellarSdk.StrKey.decodeSha256Hash(key).slice(28).toString('hex');

const hintFunc = {
    'sha256_hash':          getHintFromHash,
    'sha256Hash':           getHintFromHash,
    'ed25519_public_key':   getHintFromPubKey,
    'ed25519PublicKey':     getHintFromPubKey
};

/**
 *  Returns a signature hint from a signer
 *
 * @param signer
 * @return {SignatureHint}
 */

export const getHintFromSigner = (
    signer: Signer
): SignatureHint => hintFunc[signer.type](signer.key);

/**
 * Returns a signature hint from a signature
 * @param {Signature} sig
 * @return {SignatureHint}
 */

export const getHintFromSignature = (
    sig: Signature
): SignatureHint => sig.hint().toString('hex');
