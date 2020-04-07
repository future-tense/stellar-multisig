
import * as StellarSdk from 'stellar-sdk';
import { StrKey } from './multisig';

/**
 *
 * @public
 * @param account -
 * @returns Function
 */

export function unregisteredAccount(
    account: StrKey
): () => any {
    return () => ({
        id: account,
        signers: [{
            key: account,
            type: 'ed25519_public_key',
            weight: 1
        }],
        thresholds: {
            low_threshold: 0,
            med_threshold: 0,
            high_threshold: 0
        },
        flags: {
            auth_required: false,
            auth_revocable: false
        },
        balances: [],
        sequence: 0,
        subentry_count: 0
    });
}

/**
 * Returns an array of promises for account information
 *
 * @internal
 * @param horizon - the horizon server to query
 * @param accounts - the array of accounts to get account information for
 * @returns an array of promises
 */

const _getAccountPromises = (
    horizon: StellarSdk.Server,
    accounts: Set<StrKey>
): Promise<StellarSdk.ServerApi.AccountRecord>[] => [...accounts].map(
    (account) => horizon.accounts().accountId(account)
        .call()
        .catch(unregisteredAccount(account))
);

/**
 * Fetches the account records for all of the listed accounts
 *
 * @public
 * @category High-level
 * @param horizon - the horizon server to query
 * @param accountList - the list of public keys for accounts
 * @returns a promise for an array of account records
 */

export async function fetchAccountRecords(
    horizon: StellarSdk.Server,
    accountList: Set<StrKey>
): Promise<StellarSdk.ServerApi.AccountRecord[]> {
    const promises = _getAccountPromises(horizon, accountList);
    return Promise.all(promises);
}
