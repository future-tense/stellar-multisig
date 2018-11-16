// @flow

import StellarSdk from 'stellar-sdk';

import type {AccountInfo} from 'stellar-sdk';
import type {pubKey} from './multisig';

/**
 *
 * @param account
 * @returns {Function}
 */

const unregisteredAccount = (
    account: pubKey
): Function => (): AccountInfo => ({
    id: (account: any),
    signers: [{
        key:        (account: any),
        public_key: (account: any),
        type:       'ed25519_public_key',
        weight:     1
    }],
    thresholds: {
        low_threshold:	0,
        med_threshold:	0,
        high_threshold:	0
    },
    flags: {},
    balances: [],
    sequence: '',
    subentryCount: 0
});

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
): Array<Promise<AccountInfo>> => [...accounts].map(
    (account) => horizon.accounts().accountId((account: any))
        .call()
        .catch(unregisteredAccount(account))
);

/**
 *
 * @param accountList
 * @param horizon
 * @return {Promise<Array<AccountInfo>>}
 */

const fetchSourceAccounts = async (
    accountList: Set<pubKey>,
    horizon: StellarSdk.Server
): Promise<Array<AccountInfo>> => {
    const promises = getAccountPromises(accountList, horizon);
    return Promise.all(promises);
};

export {
    fetchSourceAccounts,
    unregisteredAccount
}
