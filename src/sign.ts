
import * as StellarSdk from 'stellar-sdk';

/**
 * Create a signature that's valid for signing a transaction by an 'ed25519PublicKey` signer
 *
 * @public
 * @category High-level
 * @param tx - the transaction
 * @param keypair - the signing keys
 * @returns a signature
 */

export function createKeypairSignature(
    tx: StellarSdk.Transaction,
    keypair: StellarSdk.Keypair,
): StellarSdk.xdr.DecoratedSignature {
    const hash = tx.hash();
    return keypair.signDecorated(hash);
}

/**
 * Create a preimage signature that's valid for signing by a `sha256Hash` signer
 *
 * @public
 * @category High-level
 * @param preimage - the hash preimage
 * @returns a signature
 */

export function createPreimageSignature(
    preimage: Buffer
): StellarSdk.xdr.DecoratedSignature {
    const hint = StellarSdk.hash(preimage).slice(28);
    return new StellarSdk.xdr.DecoratedSignature({hint, signature: preimage});
}
