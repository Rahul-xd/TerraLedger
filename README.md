# TerraLedger - Blockchain Land Registration System

A decentralized land registration system implemented using Solidity smart contracts and React.

## Prerequisites

Before setting up the project, ensure you have the following installed:

1. **Node.js & npm**
   - Download and install Node.js from [https://nodejs.org/](https://nodejs.org/)
   - Recommended version: Node.js 18.x or later
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Git**
   - Download and install Git from [https://git-scm.com/](https://git-scm.com/)
   - Verify installation:
     ```bash
     git --version
     ```

3. **Visual Studio Code** (Recommended IDE)
   - Download from [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - Recommended extensions:
     - Solidity by Juan Blanco
     - ESLint
     - Prettier

4. **MetaMask**
   - Install MetaMask extension for your browser from [https://metamask.io/](https://metamask.io/)
   - Create a wallet or import existing one
   - Add Localhost 8545 network to MetaMask:
     - Network Name: Localhost 8545
     - RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH

## Project Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Rahul-xd/TerraLedger.git
   cd TerraLedger
   ```

2. **Install Dependencies**
   ```bash
   # Install project dependencies
   npm install

   # If you encounter any errors, try:
   npm install --force
   ```

3. **Start Local Blockchain**
   Open a new terminal and run:
   ```bash
   # Start Hardhat node
   npx hardhat node
   ```
   Keep this terminal running.

4. **Deploy Smart Contracts**
   Open another terminal and run:
   ```bash
   # Deploy contracts to local network
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. **Start Development Server**
   In a new terminal:
   ```bash
   # Start the development server
   npm run dev
   ```

6. **Access the Application**
   - Open your browser and navigate to `http://localhost:5173`
   - Connect MetaMask to the local network
   - Import test accounts from Hardhat node using private keys

## Project Structure

## Smart Contracts

- `TransactionRegistry.sol`: Handles all property transactions and purchase requests
- `LandRegistry.sol`: Manages land records and ownership
- `UserRegistry.sol`: Manages user verification and roles
- `BaseRegistry.sol`: Base contract with common functionality

## License

MIT
