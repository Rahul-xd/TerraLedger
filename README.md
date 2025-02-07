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

## Setup Instructions

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Land-Registration-Smart-Contract
```

2. Install dependencies:
```bash
npm install
````

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

5. Start local node:
```bash
npm run node
```

6. Deploy contracts:
```bash
npm run deploy
```

## License

MIT
