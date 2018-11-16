// @ flow

import test from 'ava';
import StellarSdk from 'stellar-sdk';
import * as multisig from '../src/index';

const aliceKeys = StellarSdk.Keypair.random();

const aliceAccount = {
    id: aliceKeys.publicKey(),
    signers: [{
        key: aliceKeys.publicKey(),
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

const bobKeys = StellarSdk.Keypair.random();
const preimage = 'preimage';
const hashx = StellarSdk.StrKey.encodeSha256Hash(StellarSdk.hash(preimage));

const bobAccount = {
    id: bobKeys.publicKey(),
    signers: [{
        key: bobKeys.publicKey(),
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

const networkId = StellarSdk.hash('test test test test');

//

test('two source accounts, single signers', t => {
    const aliceId = aliceKeys.publicKey();
    const bobId = bobKeys.publicKey();

    const account = new StellarSdk.Account(aliceId, '0');

    const tx = new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.payment({
        source: bobId,
        destination: aliceId,
        asset: StellarSdk.Asset.native(),
        amount: '10'
    }))
    .build();

    const accounts = [
        aliceAccount,
        bobAccount
    ];

    const signatures = [
        multisig.createTransactionSignature(tx, networkId, aliceKeys),
        multisig.createTransactionSignature(tx, networkId, bobKeys)
    ];

    const res = multisig.isApproved(tx, networkId, accounts, signatures);
    t.true(res);
});

//

test('hash(x) signer', t => {
    const aliceId = aliceKeys.publicKey();
    const bobId = bobKeys.publicKey();

    const account = new StellarSdk.Account(bobId, '0');

    const tx = new StellarSdk.TransactionBuilder(account)
    .addOperation(StellarSdk.Operation.payment({
        destination: aliceId,
        asset: StellarSdk.Asset.native(),
        amount: '10'
    }))
    .build();

    const accounts = [
        bobAccount
    ];

    const signatures = [
        multisig.createPreimageSignature(preimage)
    ];

    const res = multisig.isApproved(tx, networkId, accounts, signatures);
    t.true(res);
});
