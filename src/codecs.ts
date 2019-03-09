
import * as StellarSdk from 'stellar-sdk';

/**
 * Decodes a transaction object from a base64-encoded XDR blob
 *
 * @param {string} txenv
 * @return {StellarSdk.Transaction}
 */

export function decodeTransaction(
    txenv: string
): StellarSdk.Transaction {
    return new StellarSdk.Transaction(txenv);
}

/**
 * Encodes a transaction object to a base64-encoded XDR blob
 *
 * @param {StellarSdk.Transaction} tx
 * @return {string}
 */

export function encodeTransaction(
    tx: StellarSdk.Transaction
): string {
    return tx.toEnvelope().toXDR().toString('base64');
}
