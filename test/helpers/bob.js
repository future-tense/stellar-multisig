import StellarSdk from 'stellar-sdk';

const keys = StellarSdk.Keypair.random();
const id = keys.publicKey();
const account = new StellarSdk.Account(id, '0');

const preimage = 'preimage';
const hashx = StellarSdk.StrKey.encodeSha256Hash(StellarSdk.hash(preimage));

const accountInfo = {
    id: id,
    signers: [{
        key: id,
        type: 'ed25519_public_key',
        weight: 1
    }, {
        key: hashx,
        type: 'sha256_hash',
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
    keys,
    preimage
}