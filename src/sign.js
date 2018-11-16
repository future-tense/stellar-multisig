// @flow

import StellarSdk from 'stellar-sdk';

const envelopeType = StellarSdk.xdr.EnvelopeType.envelopeTypeTx().toXDR();

/**
 *
 * @private
 * @param tx
 * @param networkId
 * @return {Buffer}
 */

const signatureBase = (
    tx: StellarSdk.Transaction,
    networkId: Buffer,
): Buffer => Buffer.concat([networkId, envelopeType, tx.tx.toXDR()]);

/**
 *
 * @param tx
 * @param networkId
 * @return {*}
 */

const getTransactionHashRaw = (
    tx: StellarSdk.Transaction,
    networkId: Buffer,
): Buffer => StellarSdk.hash(signatureBase(tx, networkId));

/**
 *
 * @param tx
 * @param networkId
 * @return {string}
 */

const getTransactionHash = (
    tx: StellarSdk.Transaction,
    networkId: Buffer,
): string => getTransactionHashRaw(tx, networkId).toString('hex');

/**
 *
 * @param tx
 * @param networkId
 * @param keypair
 * @return {StellarSdk.xdr.DecoratedSignature}
 */

const createTransactionSignature = (
    tx: StellarSdk.Transaction,
    networkId: Buffer,
    keypair: StellarSdk.Keypair,
): StellarSdk.xdr.DecoratedSignature => {
    const hash = getTransactionHashRaw(tx, networkId);
    return keypair.signDecorated(hash);
};

/**
 *
 * @param {Buffer} preimage
 * @return {StellarSdk.xdr.DecoratedSignature}
 */

const createPreimageSignature = (
    preimage: Buffer | string
): StellarSdk.xdr.DecoratedSignature => {
    const hint = StellarSdk.hash(preimage).slice(28);
    return new StellarSdk.xdr.DecoratedSignature({hint, signature: (preimage: any)});
};

export {
    getTransactionHash,
    getTransactionHashRaw,
    createTransactionSignature,
    createPreimageSignature
}
