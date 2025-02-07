const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function copyArtifacts() {
    const srcDir = path.join(__dirname, '..', 'artifacts');
    const destDir = path.join(__dirname, '..', 'src', 'artifacts');
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
    }
    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(srcDir, destDir, { recursive: true });
}

async function setupInspectorRoles(contracts, inspector, owner) {
    const { userRegistry, landRegistry, transactionRegistry, disputeRegistry } = contracts;

    // Add inspector to UserRegistry first (this also assigns INSPECTOR_ROLE)
    await userRegistry.connect(owner).addInspector(
        inspector.address,
        `Inspector ${inspector.address.slice(0, 6)}`,
        35,
        "Land Inspector"
    );

    // Get INSPECTOR_ROLE from any contract since it's the same across all
    const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();

    // Assign INSPECTOR_ROLE in other contracts
    await landRegistry.connect(owner).assignRole(inspector.address, INSPECTOR_ROLE);
    await transactionRegistry.connect(owner).assignRole(inspector.address, INSPECTOR_ROLE);
    await disputeRegistry.connect(owner).assignRole(inspector.address, INSPECTOR_ROLE);

    console.log(`Inspector roles set up for ${inspector.address}`);
}

async function authorizeContracts(contracts, owner) {
    const { landRegistry, transactionRegistry } = contracts;
    console.log("\nAuthorizing TransactionRegistry in LandRegistry...");
    await landRegistry.connect(owner).authorizeTransactionRegistry(
        await transactionRegistry.getAddress()
    );
    console.log("Authorization complete");
}

async function main() {
    try {
        const [owner, inspector1, inspector2] = await ethers.getSigners();
        console.log("Deploying contracts with owner:", await owner.getAddress());

        // 1. First deploys UserRegistry
        console.log("\nDeploying UserRegistry...");
        const UserRegistry = await ethers.getContractFactory("UserRegistry");
        const userRegistry = await UserRegistry.deploy();
        await userRegistry.waitForDeployment();
        console.log("UserRegistry deployed to:", await userRegistry.getAddress());

        // 2. Then deploys LandRegistry with UserRegistry address
        console.log("\nDeploying LandRegistry...");
        const LandRegistry = await ethers.getContractFactory("LandRegistry");
        const landRegistry = await LandRegistry.deploy(await userRegistry.getAddress());
        await landRegistry.waitForDeployment();
        console.log("LandRegistry deployed to:", await landRegistry.getAddress());

        // 3. Then deploys TransactionRegistry with LandRegistry address
        console.log("\nDeploying TransactionRegistry...");
        const TransactionRegistry = await ethers.getContractFactory("TransactionRegistry");
        const transactionRegistry = await TransactionRegistry.deploy(await landRegistry.getAddress());
        await transactionRegistry.waitForDeployment();
        console.log("TransactionRegistry deployed to:", await transactionRegistry.getAddress());

        // 4. Authorizes TransactionRegistry in LandRegistry
        await landRegistry.authorizeTransactionRegistry(await transactionRegistry.getAddress());

        // 5. Deploy DisputeRegistry
        console.log("\nDeploying DisputeRegistry...");
        const DisputeRegistry = await ethers.getContractFactory("DisputeRegistry");
        const disputeRegistry = await DisputeRegistry.deploy(await landRegistry.getAddress());
        await disputeRegistry.waitForDeployment();
        console.log("DisputeRegistry deployed to:", await disputeRegistry.getAddress());

        const contracts = {
            userRegistry,
            landRegistry,
            transactionRegistry,
            disputeRegistry
        };

        // Setup contract authorizations
        await authorizeContracts(contracts, owner);

        // Setup inspector roles
        console.log("\nSetting up inspector roles...");
        await setupInspectorRoles(contracts, inspector1, owner);
        await setupInspectorRoles(contracts, inspector2, owner);

        // Copy artifacts for frontend
        await copyArtifacts();
        console.log("\nContract artifacts copied to src/artifacts");

        // Log deployment success
        console.log("\nDeployment completed successfully!");

        return contracts;

    } catch (error) {
        console.error("Deployment failed:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;