
import * as StellarSdk from 'stellar-sdk';

import {
    Server,
} from 'stellar-sdk';

import {pubKey} from './multisig';

/**
 *
 * @param account
 * @returns {Function}
 */


// Server.AccountRecord

export function unregisteredAccount(
    account: pubKey
): () => any {
    return () => ({
        id: account,
        signers: [{
            key: account,
            public_key: account,
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
 * @private
 * @param  {Set<string>} accounts    The array of accounts to get account information for
 * @param horizon
 * @return {Array<Promise<AccountInfo>>}
 */
const getAccountPromises = (
    accounts: Set<pubKey>,
    horizon: StellarSdk.Server
): Promise<Server.AccountRecord>[] => [...accounts].map(
    (account) => horizon.accounts().accountId(account)
        .call()
        .catch(unregisteredAccount(account))
);

/**
 *
 * @param accountList
 * @param horizon
 * @return {Promise<Array<AccountInfo>>}
 */

export async function fetchSourceAccounts(
    accountList: Set<pubKey>,
    horizon: StellarSdk.Server
): Promise<Server.AccountRecord[]> {
    const promises = getAccountPromises(accountList, horizon);
    return Promise.all(promises);
}
