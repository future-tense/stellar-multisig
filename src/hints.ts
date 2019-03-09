
import * as StellarSdk from 'stellar-sdk';

import {
    Horizon
} from 'stellar-sdk';

import {pubKey, signature} from './multisig';


/**
 * A signature hint is a shortened string used to identify a signer
 */

export type signatureHint = string;

/**
 * Returns a signature hint from a public key
 *
 * @param {pubKey} key
 * @return {signatureHint}
 */

export const getHintFromPubKey = (
    key: string
): signatureHint =>
    StellarSdk.Keypair.fromPublicKey(key).signatureHint().toString('hex');

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

export const getHintFromSigner = (
    signer: Horizon.AccountSigner | any
): signatureHint => hintFunc[signer.type](signer.key);

/**
 * Returns a signature hint from a signature
 * @param {signature} sig
 * @return {signatureHint}
 */

export const getHintFromSignature = (
    sig: signature
): signatureHint => sig.hint().toString('hex');
