
import * as StellarSdk from 'stellar-sdk';

/**
 * Decodes a transaction object from a base64-encoded XDR blob
 *
 * @public
 * @category High-level
 * @param txenv -
 * @param networkPassphrase -
 * @returns StellarSdk.Transaction
 */
export function decodeTransaction(
    txenv: string,
    networkPassphrase: string
): StellarSdk.Transaction {
    return new StellarSdk.Transaction(txenv, networkPassphrase);
}

/**
 * Encodes a transaction object to a base64-encoded XDR blob
 *
 * @public
 * @category High-level
 * @param tx -
 * @returns string
 */

export function encodeTransaction(
    tx: StellarSdk.Transaction
): string {
    return tx.toXDR();
}
