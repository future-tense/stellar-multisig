// @flow

import StellarSdk from 'stellar-sdk';
import type {pubKey, signature} from './multisig';

/**
 * A signature hint is a shortened string used to identify a signer
 */

export opaque type signatureHint = string;

/**
 * Returns a signature hint from a public key
 *
 * @param {pubKey} key
 * @return {signatureHint}
 */

const getHintFromPubKey = (
    key: pubKey
): signatureHint =>
    StellarSdk.Keypair.fromPublicKey((key: any)).signatureHint().toString('hex');

/**
 * Returns a signature hint from a SHA256 hash
 *
 * @param {string} key
 * @return {signatureHint}
 */

const getHintFromHash = (
    key: string
): signatureHint =>
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
 * @return {signatureHint}
 */

const getHintFromSigner = (
    signer: Object
): signatureHint => hintFunc[signer.type](signer.key);

/**
 * Returns a signature hint from a signature
 * @param {signature} sig
 * @return {signatureHint}
 */

const getHintFromSignature = (
    sig: signature
): signatureHint => sig.hint().toString('hex');

export {
    getHintFromPubKey,
    getHintFromSignature,
    getHintFromSigner,
}