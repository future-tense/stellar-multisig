
import * as StellarSdk from 'stellar-sdk';

/**
 *
 * @param tx
 * @param networkId
 * @param keypair
 * @return {StellarSdk.xdr.DecoratedSignature}
 */

export function createKeypairSignature(
    tx: StellarSdk.Transaction,
    keypair: StellarSdk.Keypair,
): StellarSdk.xdr.DecoratedSignature {
    const hash = tx.hash();
    return keypair.signDecorated(hash);
}

/**
 *
 * @param {Buffer} preimage
 * @return {StellarSdk.xdr.DecoratedSignature}
 */

export function createPreimageSignature(
    preimage: Buffer
): StellarSdk.xdr.DecoratedSignature {
    const hint = StellarSdk.hash(preimage).slice(28);
    return new StellarSdk.xdr.DecoratedSignature({hint, signature: preimage});
}
