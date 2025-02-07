import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import createLogger from '../../utils/logger';
import { showToast, dismissToasts } from '../../utils/toast';
import { getContractState } from '../../services/contractService';
import { ethers } from 'ethers';

const logger = createLogger('useUser');

const useUser = () => {
    const { handleContractCall, authState: { currentUser, contractsInitialized } } = useAuth(); // Add currentUser
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lands, setLands] = useState([]);
    const [stats, setStats] = useState({
        totalLands: 0,
        pendingRequests: 0,
        activeDisputes: 0,
        lastRefresh: null
    });

    // Add request tracking state
    const [requestStates, setRequestStates] = useState({});

    // Remove redundant initialization check since we have it from AuthContext
    useEffect(() => {
        if (error) {
            logger.error('User hook error:', error);
        }
    }, [error]);

    // Simplify stats fetch using improved contract calls
    const fetchUserStats = useCallback(async () => {
        if (!currentUser?.address || !contractsInitialized) return stats;

        try {
            const [landCount, transactionSummary] = await Promise.all([
                handleContractCall('landRegistry', 'getUserLands', [currentUser.address], { isView: true }),
                handleContractCall('transactionRegistry', 'getUserTransactionSummary', [currentUser.address], { isView: true })
            ]);

            logger.debug('Raw transaction summary:', {
                summary: transactionSummary,
                values: {
                    total: Number(transactionSummary[0] || 0),
                    pending: Number(transactionSummary[1] || 0),
                    incoming: Number(transactionSummary[2] || 0),
                    outgoing: Number(transactionSummary[3] || 0)
                }
            });

            // Convert BigInt values to numbers and ensure only active requests are counted
            const newStats = {
                totalLands: Array.isArray(landCount) ? landCount.length : 0,
                pendingRequests: Number(transactionSummary[1] || 0),  // Only PENDING
                incomingRequests: Number(transactionSummary[2] || 0), // Only PENDING incoming
                outgoingRequests: Number(transactionSummary[3] || 0), // Only PENDING outgoing
                lastRefresh: Date.now()
            };

            logger.debug('Formatted stats:', newStats);
            setStats(newStats);
            return newStats;
        } catch (error) {
            logger.error('Stats fetch failed:', error);
            return stats;
        }
    }, [currentUser?.address, contractsInitialized, handleContractCall]);

    // Simplify to essential operations
    const landOperations = {
        fetchLands: useCallback(async (page = 0, pageSize = 10) => {
            try {
                const userLandIds = await handleContractCall(
                    'landRegistry',
                    'getUserLands',
                    [currentUser.address],
                    { isView: true }
                );

                logger.debug('User land IDs:', userLandIds);

                // Get details for each land and format them
                const landsPromises = userLandIds.map(async (id) => {
                    const landDetails = await handleContractCall(
                        'landRegistry',
                        'getLandDetails',
                        [id],
                        { isView: true }
                    );

                    // Format the land data
                    return {
                        id: Number(landDetails.id),
                        area: Number(landDetails.area),
                        location: landDetails.location,
                        price: Number(landDetails.price),
                        coordinates: landDetails.coordinates,
                        propertyPID: Number(landDetails.propertyPID),
                        surveyNumber: landDetails.surveyNumber,
                        documentHash: landDetails.documentHash,
                        isForSale: landDetails.isForSale,
                        owner: landDetails.owner,
                        isVerified: landDetails.isVerified,
                        verificationRemark: landDetails.verificationRemark || ''
                    };
                });

                const lands = await Promise.all(landsPromises);
                logger.debug('Formatted user lands:', lands);

                // Handle pagination
                const totalItems = lands.length;
                const totalPages = Math.ceil(totalItems / pageSize);
                const start = page * pageSize;
                const paginatedLands = lands.slice(start, start + pageSize);

                setLands(paginatedLands);
                return {
                    lands: paginatedLands,
                    totalPages,
                    totalItems
                };
            } catch (error) {
                logger.error('Lands fetch failed:', error);
                return { lands: [], totalPages: 0, totalItems: 0 };
            }
        }, [handleContractCall]),

        putLandForSale: async (landId) => {
            const correlationId = Date.now();
            logger.debug(`[${correlationId}] Putting land for sale:`, { landId });

            try {
                // Verify land ownership and status first
                const landDetails = await handleContractCall(
                    'landRegistry',
                    'getLandDetails',
                    [landId],
                    { isView: true }
                );

                logger.debug(`[${correlationId}] Land details:`, landDetails);

                // Make the contract call
                const tx = await handleContractCall(
                    'landRegistry',
                    'putLandForSale',
                    [landId]
                );

                // Wait for confirmation
                await tx.wait();

                return { success: true, data: tx };
            } catch (error) {
                logger.error(`[${correlationId}] Put land for sale failed:`, error);
                throw error;
            }
        },

        takeLandOffSale: async (landId) => {
            dismissToasts();
            const correlationId = Date.now();
            logger.debug(`[${correlationId}] Taking land off sale:`, { landId });

            try {
                const result = await handleContractCall(
                    'landRegistry',
                    'takeLandOffSale',
                    [landId],
                    { correlationId }
                );

                if (!result?.success) {
                    throw new Error(result?.error || 'Failed to remove land from sale');
                }

                return { success: true };
            } catch (error) {
                logger.error(`[${correlationId}] Take land off sale failed:`, error);
                throw error;
            }
        },

        getLandDetails: async (landId) => {
            try {
                return await handleContractCall(
                    'landRegistry',
                    'getLandDetails',  // Using correct contract method
                    [landId],
                    { isView: true }
                );
            } catch (error) {
                logger.error('Failed to get land details:', error);
                throw error;
            }
        },

        getLandMetadata: async (landId) => {
            try {
                const { documents, descriptions, lastUpdated } = await handleContractCall(
                    'landRegistry',
                    'getLandMetadata',
                    [landId],
                    { isView: true }
                );
                return { documents, descriptions, lastUpdated };
            } catch (error) {
                logger.error('Failed to get land metadata:', error);
                throw error;
            }
        },
    };

    // Separate addLand from landOperations
    const addLand = useCallback(async (data) => {
        try {
            // Update price handling for ethers v6
            let priceInWei;
            try {
                if (typeof data.price === 'string') {
                    // Parse the string directly using ethers.parseUnits
                    priceInWei = ethers.parseUnits(data.price, 'ether');
                } else {
                    throw new Error('Price must be a string');
                }
            } catch (error) {
                throw new Error(`Price conversion failed: ${error.message}`);
            }

            const args = [
                data.area,
                data.location,
                priceInWei,
                data.coordinates,
                data.propertyPID,
                data.surveyNumber,
                data.documentHash
            ];

            logger.debug('Adding land with args:', {
                ...args,
                priceInWei: priceInWei.toString()
            });

            return await handleContractCall('landRegistry', 'addLand', args);
        } catch (error) {
            logger.error('Failed to add land:', error);
            throw error;
        }
    }, [handleContractCall]);

    // Add transactions state
    const [transactions, setTransactions] = useState([]);

    // Simplify to essential operations
    const transactionOperations = {
        fetchTransactions: useCallback(async (page = 0, pageSize = 10) => {
            if (!currentUser?.address) return { transactions: [], totalPages: 0, totalItems: 0 };

            try {
                // Change to use getUserPurchaseRequests
                const requests = await handleContractCall(
                    'transactionRegistry',
                    'getUserPurchaseRequests',
                    [currentUser.address],
                    { isView: true }
                );

                // Format requests with land details
                const enhancedRequests = await Promise.all(
                    requests.map(async (req) => {
                        const landDetails = await handleContractCall(
                            'landRegistry',
                            'getLandDetails',
                            [req.landId],
                            { isView: true }
                        );

                        return {
                            ...req,
                            land: landDetails
                        };
                    })
                );

                setTransactions(enhancedRequests);
                return {
                    transactions: enhancedRequests,
                    totalPages: 1,
                    totalItems: enhancedRequests.length
                };
            } catch (error) {
                logger.error('Failed to fetch transactions:', error);
                throw error;
            }
        }, [currentUser?.address, handleContractCall]),

        // Add back missing functions
        processPurchaseRequest: async (requestId, accept) => {
            const correlationId = Date.now();
            logger.debug(`[${correlationId}] Processing purchase request:`, { requestId, accept });

            try {
                // Verify request status first
                const requestDetails = await handleContractCall(
                    'transactionRegistry',
                    'getPurchaseRequest',
                    [requestId],
                    { isView: true }
                );

                // Process the request
                const result = await handleContractCall(
                    'transactionRegistry',
                    'processPurchaseRequest',
                    [requestId, accept]
                );

                return { success: true, status: accept ? 'ACCEPTED' : 'REJECTED' };
            } catch (error) {
                logger.error(`[${correlationId}] Process request failed:`, error);
                throw error;
            }
        },

        cancelPurchaseRequest: async (requestId) => {
            const correlationId = Date.now();
            try {
                const result = await handleContractCall(
                    'transactionRegistry',
                    'cancelPurchaseRequest',
                    [requestId]
                );
                return { success: true, data: result };
            } catch (error) {
                logger.error(`[${correlationId}] Cancel request failed:`, error);
                throw error;
            }
        },

        makePayment: useCallback(async (requestId, options = {}) => {
            try {
                logger.debug('Making payment:', { requestId, options });

                // Verify the request exists and is in correct state
                const request = await handleContractCall(
                    'transactionRegistry',
                    'getPurchaseRequest',
                    [requestId],
                    { isView: true }
                );

                if (!request) {
                    throw new Error('Request not found');
                }

                // Verify payment amount matches land price
                const landDetails = await handleContractCall(
                    'landRegistry',
                    'getLandDetails',
                    [request.landId],
                    { isView: true }
                );

                const price = BigInt(landDetails.price.toString());
                const value = BigInt(options.value.toString());

                if (price !== value) {
                    throw new Error('Payment amount does not match land price');
                }

                // Send transaction with exact value
                const tx = await handleContractCall(
                    'transactionRegistry',
                    'makePayment',
                    [requestId],
                    {
                        value: value.toString(),
                        gasLimit: BigInt(800000) // Add fixed gas limit
                    }
                );

                // Wait for confirmation
                await tx.wait();

                // Refresh data
                await Promise.all([
                    fetchUserStats(),
                    loadTransactions()
                ]);

                return tx;
            } catch (error) {
                logger.error('Payment failed:', error);
                throw error;
            }
        }, [handleContractCall, fetchUserStats]),
    };

    // Add missing marketOperations
    const marketOperations = {
        getLandsForSale: useCallback(async (filters) => {
            try {
                if (!currentUser?.address) {
                    logger.warn('User not connected');
                    return [];
                }

                const lands = await handleContractCall(
                    'landRegistry',
                    'getLandsForSale',
                    [
                        ethers.parseEther(filters.minPrice || '0'),
                        ethers.parseEther(filters.maxPrice || '1000'),
                        filters.location
                    ],
                    { isView: true }
                );

                // Filter out user's own lands
                return lands.filter(land =>
                    land.owner.toLowerCase() !== currentUser.address.toLowerCase()
                );
            } catch (error) {
                logger.error('Failed to get lands for sale:', error);
                throw error;
            }
        }, [currentUser?.address, handleContractCall]),

        createPurchaseRequest: async (landId) => {
            dismissToasts();
            const correlationId = Date.now();
            logger.debug(`[${correlationId}] Creating purchase request for land:`, landId);

            try {
                // Pre-validation and request creation
                const result = await handleContractCall(
                    'transactionRegistry',
                    'createPurchaseRequest',
                    [landId]
                );

                // Add debug logging
                logger.debug(`[${correlationId}] Purchase request result:`, result);

                // Immediately update stats and data
                await Promise.all([
                    fetchUserStats(),
                    transactionOperations.fetchTransactions(0)
                ]);

                // Dispatch custom event to trigger UI updates
                window.dispatchEvent(new CustomEvent('contract:PurchaseRequestCreated', {
                    detail: { landId, requestId: result?.requestId }
                }));

                return { success: true, data: result };
            } catch (error) {
                logger.error(`[${correlationId}] Purchase request failed:`, error);
                throw error;
            }
        }
    };

    // Remove duplicate event handling - rely on ContractService events
    useEffect(() => {
        const handler = () => {
            landOperations.fetchLands(0);
            transactionOperations.fetchTransactions(0);
        };

        window.addEventListener('contract:LandUpdated', handler);
        window.addEventListener('contract:TransactionUpdated', handler);

        return () => {
            window.removeEventListener('contract:LandUpdated', handler);
            window.removeEventListener('contract:TransactionUpdated', handler);
        };
    }, [landOperations, transactionOperations]);

    // Add new event listeners for transaction-related events
    useEffect(() => {
        const events = [
            'LandPurchaseRequested',
            'PurchaseRequestStatusChanged',
            'PurchaseRequestCancelled',
            'LandOwnershipTransferred'
        ];

        const handleEvent = async () => {
            await Promise.all([
                fetchUserStats(),
                landOperations.fetchLands(),
                transactionOperations.fetchTransactions(0)
            ]);
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [fetchUserStats, landOperations.fetchLands, transactionOperations.fetchTransactions]);

    // Add new event listeners for ownership transfer
    useEffect(() => {
        const handleOwnershipTransfer = async () => {
            await Promise.all([
                fetchUserStats(),
                landOperations.fetchLands(),
                transactionOperations.fetchTransactions(0)
            ]);
        };

        window.addEventListener('contract:LandOwnershipTransferred', handleOwnershipTransfer);
        return () => {
            window.removeEventListener('contract:LandOwnershipTransferred', handleOwnershipTransfer);
        };
    }, [fetchUserStats, landOperations.fetchLands, transactionOperations.fetchTransactions]);

    // Add this event listener
    useEffect(() => {
        const events = ['LandPurchaseRequested', 'PurchaseRequestStatusChanged'];

        const handleRequestEvent = async () => {
            logger.debug('Purchase request event received');
            await Promise.all([
                fetchUserStats(),
                transactionOperations.fetchTransactions(0)
            ]);
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleRequestEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleRequestEvent);
            });
        };
    }, [fetchUserStats, transactionOperations]);

    // Add specific event listener for purchase requests
    useEffect(() => {
        const handlePurchaseEvent = async () => {
            logger.debug('Purchase request event received');
            await Promise.all([
                fetchUserStats(),
                transactionOperations.fetchTransactions(0)
            ]);
        };

        window.addEventListener('contract:PurchaseRequestCreated', handlePurchaseEvent);
        window.addEventListener('contract:PurchaseRequestStatusChanged', handlePurchaseEvent);

        return () => {
            window.removeEventListener('contract:PurchaseRequestCreated', handlePurchaseEvent);
            window.removeEventListener('contract:PurchaseRequestStatusChanged', handlePurchaseEvent);
        };
    }, [fetchUserStats, transactionOperations]);

    return {
        ...landOperations,
        addLand,
        loading,
        setLoading, // Add this
        error,
        stats,
        fetchUserStats,
        lands,
        setLands,
        isInitialized: contractsInitialized,
        transactions,
        fetchTransactions: transactionOperations.fetchTransactions, // Expose fetchTransactions directly
        processPurchaseRequest: transactionOperations.processPurchaseRequest,
        cancelPurchaseRequest: transactionOperations.cancelPurchaseRequest,
        makePayment: async (requestId, options = {}) => {
            try {
                // Send payment with exact value in transaction
                return await handleContractCall(
                    'transactionRegistry',
                    'makePayment',
                    [requestId],
                    {
                        value: options.value, // Pass the value through
                        gasLimit: 800000
                    }
                );
            } catch (error) {
                // ...error handling
            }
        },
        getLandsForSale: marketOperations.getLandsForSale,
        createPurchaseRequest: marketOperations.createPurchaseRequest
    };
};

export { useUser };
