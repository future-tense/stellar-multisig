
import test from 'ava';
import * as StellarSdk from 'stellar-sdk';
import * as multiSig from '../src';

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
        multiSig.createTransactionSignature(tx, alice.keys),
        multiSig.createTransactionSignature(tx, bob.keys)
    ];

    const res = multiSig.hasEnoughSignatures(tx, accounts, signatures);
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

    const res = multiSig.hasEnoughSigners(tx, accounts, signingKeys);
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
        multiSig.createPreimageSignature(bob.preimage)
    ];

    const res = multiSig.hasEnoughSignatures(tx, accounts, signatures);
    t.true(res);
});

test('pre-authorized transaction', t => {

    const escrowKeys = StellarSdk.Keypair.random();
    const escrowId = escrowKeys.publicKey();

    const account = new StellarSdk.Account(escrowId, '0');
    const accountInfo = {
        id: escrowId,
        signers: [{
            key: escrowId,
            type: 'ed25519_public_key',
            weight: 0
        }],
        thresholds: {
            low_threshold: 2,
            med_threshold: 2,
            high_threshold: 2
        },
        balances: []
    };

    const tx = new StellarSdk.TransactionBuilder(account, builderOptions)
    .addOperation(StellarSdk.Operation.accountMerge({
        destination: alice.id
    }))
    .setTimeout(0)
    .build();

    const hash = tx.hash();
    const key = StellarSdk.StrKey.encodePreAuthTx(hash);
    accountInfo.signers.push({
        key: key,
        type: 'preauth_tx',
        weight: 2
    });

    const accounts = [
        accountInfo
    ];

    const signatures: multiSig.Signature[] = [];

    const res = multiSig.hasEnoughSignatures(tx, accounts, signatures);
    t.true(res);
});
