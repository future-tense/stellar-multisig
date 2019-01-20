// @ flow

import test from 'ava';
import StellarSdk from 'stellar-sdk';
import * as multisig from '../src/index';

import alice from './helpers/alice';
import bob from './helpers/bob';

const networkId = StellarSdk.hash('test test test test');

//

test('two source accounts, single signers', t => {

    const account = new StellarSdk.Account(alice.id, '0');

    const tx = new StellarSdk.TransactionBuilder(account)
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

test('hash(x) signer', t => {

    const account = new StellarSdk.Account(bob.id, '0');

    const tx = new StellarSdk.TransactionBuilder(account)
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
