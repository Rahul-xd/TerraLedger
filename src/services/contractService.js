import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../core/config';
import UserRegistry from '../artifacts/contracts/UserRegistry.sol/UserRegistry.json';
import LandRegistry from '../artifacts/contracts/LandRegistry.sol/LandRegistry.json';
import TransactionRegistry from '../artifacts/contracts/TransactionRegistry.sol/TransactionRegistry.json';
import DisputeRegistry from '../artifacts/contracts/DisputeRegistry.sol/DisputeRegistry.json';
import createLogger from '../utils/logger';

const logger = createLogger('ContractService');

// Simplify to core functionality
const contractState = {
    contracts: null,
    provider: null, // Add this
    signer: null,   // Add this
    isInitializing: false,
    error: null,
    initializationPromise: null // Add promise to track initialization
};

export const getContractState = () => ({
    isInitialized: !!contractState.contracts,
    isInitializing: contractState.isInitializing,
    error: contractState.error
});

// Simple network validation
export const validateNetwork = async (provider) => {
    try {
        const network = await provider.getNetwork();
        return network.chainId === 31337n;
    } catch (error) {
        logger.error('Network validation failed:', error);
        return false;
    }
};

// Add detailed logging structure
const logContractEvent = (stage, details) => {
    const timestamp = new Date().toISOString();
    logger.info(`[${timestamp}] Contract ${stage}:`, details);
};

// Update initialization
export const getOrInitializeContracts = async (provider, signer) => {
    const correlationId = Date.now();

    if (contractState.initializationPromise) {
        try {
            return await contractState.initializationPromise;
        } catch (error) {
            // Clear failed initialization
            contractState.initializationPromise = null;
        }
    }

    // Create new initialization promise
    contractState.initializationPromise = (async () => {
        logContractEvent('Initialization Start', {
            correlationId,
            hasProvider: !!provider,
            hasSigner: !!signer
        });

        try {
            // Store provider and signer
            contractState.provider = provider;
            contractState.signer = signer;

            if (!provider || !signer) {
                logger.error(`[${correlationId}] Missing dependencies`, { hasProvider: !!provider, hasSigner: !!signer });
                throw new Error('Provider and signer are required');
            }

            if (contractState.contracts) {
                logger.debug(`[${correlationId}] Checking existing contracts`);
                try {
                    const currentSigner = await signer.getAddress();
                    const contractSigner = await contractState.contracts.userRegistry.signer.getAddress();
                    if (currentSigner === contractSigner) {
                        logger.info(`[${correlationId}] Reusing existing contracts`);
                        return contractState.contracts;
                    }
                } catch (error) {
                    logger.warn(`[${correlationId}] Existing contracts invalid`, error);
                    contractState.contracts = null;
                }
            }

            if (contractState.isInitializing) {
                throw new Error('Contract initialization in progress');
            }

            contractState.isInitializing = true;
            contractState.error = null;

            logContractEvent('Network Validation', {
                correlationId,
                isValidating: true
            });

            // Single network validation
            const isValidNetwork = await validateNetwork(provider);
            if (!isValidNetwork) {
                logContractEvent('Network Error', {
                    correlationId,
                    error: 'Invalid network'
                });
                throw new Error('Invalid network');
            }

            logContractEvent('Contract Creation', {
                correlationId,
                status: 'starting'
            });

            // Initialize all contracts in one go
            const contractInstances = await initializeAllContracts(provider, signer);

            logContractEvent('Contract Creation', {
                correlationId,
                status: 'success',
                contracts: Object.keys(contractInstances)
            });

            contractState.contracts = contractInstances;
            return contractInstances;

        } catch (error) {
            logContractEvent('Initialization Failed', {
                correlationId,
                error: error.message,
                stack: error.stack
            });
            contractState.error = error;
            throw error;
        } finally {
            contractState.isInitializing = false;
            contractState.lastInitAttempt = Date.now();
            contractState.initializationPromise = null;
        }
    })();

    return contractState.initializationPromise;
};

// Update handleContractTransaction to handle write transactions better
export const handleContractTransaction = async (contractName, method, args = [], options = {}) => {
    const correlationId = Date.now();
    logContractEvent('Transaction Start', {
        correlationId,
        contract: contractName,
        method,
        args
    });

    try {
        // Add initialization check and retry
        if (!contractState.contracts || !contractState.contracts[contractName]) {
            logger.debug(`[${correlationId}] Contracts not initialized, attempting initialization`);
            await getOrInitializeContracts(contractState.provider, contractState.signer);
        }

        // Double check after initialization attempt
        if (!contractState.contracts?.[contractName]) {
            throw new Error(`Contract ${contractName} not available`);
        }

        const contract = contractState.contracts[contractName];

        // For view functions
        if (options.isView) {
            const result = await contract[method](...args);
            return result;
        }

        // For write functions
        const signer = await contractState.provider.getSigner();
        const contractWithSigner = contract.connect(signer);

        // Add gas estimation with fallback
        let gasLimit = BigInt(1000000);

        // Execute transaction with debugging
        logger.debug(`[${correlationId}] Executing transaction:`, {
            contract: contractName,
            method,
            args,
            gasLimit: gasLimit.toString()
        });

        const tx = await contractWithSigner[method](...args, {
            gasLimit,
            ...options
        });

        // Wait for confirmation if requested
        if (options.waitForConfirmation) {
            await tx.wait();
        }

        return tx;
    } catch (error) {
        logger.error(`[${correlationId}] Transaction failed:`, {
            contract: contractName,
            method,
            args,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Add initialization status check
export const getContractStatus = () => {
    return {
        isInitialized: !!contractState.contracts,
        contracts: contractState.contracts ? Object.keys(contractState.contracts) : [],
        provider: !!contractState.provider,
        signer: !!contractState.signer
    };
};

// Add helper functions for cleaner code
const initializeAllContracts = async (provider, signer) => {
    const contractInstances = {
        userRegistry: new ethers.Contract(CONTRACT_ADDRESSES.userRegistryAddress, UserRegistry.abi, signer),
        landRegistry: new ethers.Contract(CONTRACT_ADDRESSES.landRegistryAddress, LandRegistry.abi, signer),
        transactionRegistry: new ethers.Contract(CONTRACT_ADDRESSES.transactionRegistryAddress, TransactionRegistry.abi, signer),
        disputeRegistry: new ethers.Contract(CONTRACT_ADDRESSES.disputeRegistryAddress, DisputeRegistry.abi, signer)
    };

    // Single verification for all contracts
    await Promise.all(
        Object.entries(CONTRACT_ADDRESSES).map(async ([name, address]) => {
            const code = await provider.getCode(address);
            if (code === '0x') {
                throw new Error(`Contract ${name} not deployed at ${address}`);
            }
        })
    );

    return contractInstances;
};

const handleWriteTransaction = async (contract, methodName, args, options) => {
    try {
        const tx = await contract[methodName](...args, options);
        const receipt = await tx.wait();

        // Add receipt validation
        if (!receipt.status) {
            throw new Error('Transaction failed');
        }

        return {
            success: true,
            transactionHash: receipt.transactionHash,
            receipt
        };
    } catch (error) {
        // Enhance error details
        const enhancedError = new Error(
            `Transaction failed: ${error.message || 'Unknown error'}`
        );
        enhancedError.code = error.code;
        enhancedError.receipt = error.receipt;
        enhancedError.transaction = error.transaction;
        throw enhancedError;
    }
};

const enhanceError = (error, contractName, methodName) => {
    error.message = `${contractName}.${methodName} failed: ${error.message}`;
    return error;
};

// Update event handling to correctly map events to contracts
export const setupContractEventListeners = (contracts) => {
    if (!contracts) return null;

    // Define events we actually need
    const REQUIRED_EVENTS = {
        transactionRegistry: ['PurchaseRequestCreated', 'PurchaseRequestStatusChanged'],
        landRegistry: ['LandAdded', 'LandVerified'],
        userRegistry: ['UserRegistered', 'UserVerified']
    };

    // Set up listeners only for events we need
    Object.entries(REQUIRED_EVENTS).forEach(([contractName, events]) => {
        const contract = contracts[contractName];
        if (!contract) return;

        events.forEach(eventName => {
            try {
                if (contract.interface.getEvent(eventName)) {
                    contract.on(eventName, (...args) => {
                        logger.debug(`Event ${eventName} received:`, args);
                        window.dispatchEvent(
                            new CustomEvent(`contract:${eventName}`, {
                                detail: args,
                                bubbles: true
                            })
                        );
                    });
                }
            } catch (error) {
                // Silently ignore non-existent events
            }
        });
    });

    return () => {
        Object.values(contracts).forEach(contract => {
            if (contract?.removeAllListeners) contract.removeAllListeners();
        });
    };
};

// Clean reset functionality
export const resetContracts = () => {
    if (contractState.contracts) {
        Object.values(contractState.contracts).forEach(contract => {
            contract.removeAllListeners();
        });
    }
    contractState.contracts = null;
    contractState.provider = null;
    contractState.signer = null;
};
