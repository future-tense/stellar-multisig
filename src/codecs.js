// @flow

import StellarSdk from 'stellar-sdk';

/**
 * Decodes a transaction object from a base64-encoded XDR blob
 *
 * @param {string} txenv
 * @return {StellarSdk.Transaction}
 */

const decodeTransaction = (
    txenv: string
): StellarSdk.Transaction => new StellarSdk.Transaction(txenv);

/**
 * Encodes a transaction object to a base64-encoded XDR blob
 *
 * @param {StellarSdk.Transaction} tx
 * @return {string}
 */

const encodeTransaction = (
    tx: StellarSdk.Transaction
): string => tx.toEnvelope().toXDR().toString('base64');

export {
    decodeTransaction,
    encodeTransaction
}
