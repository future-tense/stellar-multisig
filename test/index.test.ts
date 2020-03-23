
import test from 'ava';
import * as StellarSdk from 'stellar-sdk';
import * as multisig from '../src';

import alice from './helpers/alice';
import bob from './helpers/bob';

const builderOptions = {
    fee: 100,
    networkPassphrase: 'test test test test'
};

//

test('two source accounts, single signers', t => {

    const tx = new StellarSdk.TransactionBuilder(alice.account, builderOptions)
    .addOperation(StellarSdk.Operation.payment({
        source: bob.id,
        destination: alice.id,
        asset: StellarSdk.Asset.native(),
        amount: '10'
    }))
    .setTimeout(0)
    .build();

    const accounts = [
        alice.accountInfo,
        bob.accountInfo
    ];

    const signatures = [
        multisig.createTransactionSignature(tx, alice.keys),
        multisig.createTransactionSignature(tx, bob.keys)
    ];

    const res = multisig.isApproved(tx, accounts, signatures);
    t.true(res);
});

//

test('two source accounts, single signers (prevalidated)', t => {

    const tx = new StellarSdk.TransactionBuilder(alice.account, builderOptions)
    .addOperation(StellarSdk.Operation.payment({
        source: bob.id,
        destination: alice.id,
        asset: StellarSdk.Asset.native(),
        amount: '10'
    }))
    .setTimeout(0)
    .build();

    const accounts = [
        alice.accountInfo,
        bob.accountInfo
    ];

    const signingKeys = [
        alice.keys.publicKey(),
        bob.keys.publicKey()
    ];

    const res = multisig.isApproved_prevalidated(tx, accounts, signingKeys);
    t.true(res);
});

//

test('hash(x) signer', t => {

    const tx = new StellarSdk.TransactionBuilder(bob.account, builderOptions)
    .addOperation(StellarSdk.Operation.payment({
        destination: alice.id,
        asset: StellarSdk.Asset.native(),
        amount: '10'
    }))
    .setTimeout(0)
    .build();

    const accounts = [
        bob.accountInfo
    ];

    const signatures = [
        multisig.createPreimageSignature(bob.preimage)
    ];

    const res = multisig.isApproved(tx, accounts, signatures);
    t.true(res);
});
