# Land Registration Smart Contract

A blockchain-based land registration system implemented using Solidity smart contracts.

## Overview

This project implements a decentralized land registration system with the following features:
- Land ownership management
- Property transaction handling
- User verification system
- Purchase request processing
- Market metrics tracking

## Smart Contracts

- `TransactionRegistry.sol`: Handles all property transactions and purchase requests
- `LandRegistry.sol`: Manages land records and ownership
- `UserRegistry.sol`: Manages user verification and roles
- `BaseRegistry.sol`: Base contract with common functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Compile contracts:
```bash
npx hardhat compile
```

3. Run tests:
```bash
npx hardhat test
```

## License

MIT
