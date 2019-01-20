// @ flow

import test from 'ava';
import StellarSdk from 'stellar-sdk';
import multisig from '../src/index';

import alice from './helpers/alice';
import bob from './helpers/bob';

const networkId = StellarSdk.hash('test test test test');

//

test('two source accounts, single signers', t => {

    const tx = new StellarSdk.TransactionBuilder(alice.account)
        .addOperation(StellarSdk.Operation.payment({
            source: bob.id,
            destination: alice.id,
            asset: StellarSdk.Asset.native(),
            amount: '10'
        }))
        .build();

    const accounts = [
        alice.accountInfo,
        bob.accountInfo
    ];

    const signatures = [
        multisig.createTransactionSignature(tx, networkId, alice.keys),
        multisig.createTransactionSignature(tx, networkId, bob.keys)
    ];

    const res = multisig.isApproved(tx, networkId, accounts, signatures);
    t.true(res);
});

//

test('two source accounts, single signers (prevalidated)', t => {

    const tx = new StellarSdk.TransactionBuilder(alice.account)
        .addOperation(StellarSdk.Operation.payment({
            source: bob.id,
            destination: alice.id,
            asset: StellarSdk.Asset.native(),
            amount: '10'
        }))
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

    const tx = new StellarSdk.TransactionBuilder(bob.account)
        .addOperation(StellarSdk.Operation.payment({
            destination: alice.id,
            asset: StellarSdk.Asset.native(),
            amount: '10'
        }))
        .build();

    const accounts = [
        bob.accountInfo
    ];

    const signatures = [
        multisig.createPreimageSignature(bob.preimage)
    ];

    const res = multisig.isApproved(tx, networkId, accounts, signatures);
    t.true(res);
});
