import StellarSdk from 'stellar-sdk';

const keys = StellarSdk.Keypair.random();
const id = keys.publicKey();
const account = new StellarSdk.Account(id, '0');

const accountInfo = {
    id: id,
    signers: [{
        key: id,
        type: 'ed25519_public_key',
        weight: 1
    }],
    thresholds: {
        low_threshold: 0,
        med_threshold: 0,
        high_threshold: 0
    },
    balances: []
};

export default {
    account,
    accountInfo,
    id,
    keys
}
