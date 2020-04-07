# @futuretense/stellar-multisig

[![Build Status](https://travis-ci.com/future-tense/stellar-multisig.svg?branch=master)](https://travis-ci.com/future-tense/stellar-multisig)


# Install

`npm install @futuretense/stellar-multisig`

# Usage

```
import StellarSdk from 'stellar-sdk';
import multiSig from '@futuretense/stellar-multisig';

const server = StellarSdk.Server('...');
const tx = StellarSdk.TransactionBuilder('...').build();

...

const sources = multiSig.getTransactionSourceAccounts(tx);
const accounts = await multiSig.fetchAccountRecords(server, sources);

const signatures = ['...', '...', ...];
const res = multiSig.hasEnoughSignatures(tx, accounts, signatures);
```

Copyright &copy; 2018-2020 Future Tense, LLC
