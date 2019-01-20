# @futuretense/stellar-multisig

[![Build Status](https://travis-ci.com/future-tense/stellar-multisig.svg?branch=master)](https://travis-ci.com/future-tense/stellar-multisig)


# Install

Using npm:

`npm install --save @futuretense/stellar-multisig`

or, using yarn:

`yarn add @futuretense/stellar-multisig`



# Usage

```
import StellarSdk from 'stellar-sdk';
import multisig from '@futuretense/stellar-multisig';

const server = StellarSdk.Server('...');
const networkId = StellarSdk.hash(StellarSdk.Networks.PUBLIC);

const tx = StellarSdk.TransactionBuilder('...').build();

...

const sources = multisig.getTransactionSourceAccounts(tx);
const accounts = await multisig.fetchSourceAccounts(server, sources);

const signatures = ['...', '...', ...];
const res = multisig.isApproved(tx, networkId, accounts, signatures);
```
