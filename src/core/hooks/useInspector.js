import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import createLogger from '../../utils/logger';
import { ethers } from 'ethers';

export const useInspector = () => {
    const { authState: { currentUser }, handleContractCall } = useAuth();
    const [inspectorData, setInspectorData] = useState({
        pendingVerifications: 0,
        pendingLands: 0,
        openDisputes: 0,
        lastRefresh: null
    });

    const logger = createLogger('useInspector');

    // Ensure proper error handling aligned with ContractService
    const isInspectorReady = useCallback(async () => {
        try {
            if (!currentUser?.isInspector) return false;

            // Use ethers.id to get the role hash
            const roleHash = ethers.id("INSPECTOR_ROLE");
            return await handleContractCall('userRegistry', 'hasRole', [roleHash, currentUser.address], { isView: true });
        } catch (error) {
            logger.error('Inspector ready check failed:', error);
            return false;
        }
    }, [currentUser, handleContractCall]);

    // Align error handling with ContractService patterns
    const callInspectorMethod = useCallback(async (method, ...args) => {
        try {
            // Add retries for contract reinitialization
            for (let i = 0; i < 2; i++) {
                try {
                    if (!await isInspectorReady()) {
                        throw new Error('Not authorized as inspector');
                    }
                    const result = await method(...args);
                    return { success: true, data: result };
                } catch (error) {
                    if (error.message.includes('null') && i === 0) {
                        // Wait for contract reinitialization
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }
                    throw error;
                }
            }
        } catch (error) {
            logger.error(`Inspector method failed:`, error);
            return { success: false, error: error.message };
        }
    }, [isInspectorReady]);

    // Simplified and aligned contract calls
    const updateInspectorData = useCallback(async () => {
        const result = await callInspectorMethod(async () => {
            try {
                // First get pending users
                const pendingUsers = await handleContractCall(
                    'userRegistry',
                    'getPendingUsers',
                    [],
                    { isView: true }
                );

                // Then get other data
                const [pendingLands, disputes] = await Promise.all([
                    handleContractCall('landRegistry', 'getPendingVerifications', [], { isView: true }),
                    handleContractCall('disputeRegistry', 'getOpenDisputes', [], { isView: true })
                ]);

                // Debug logging
                logger.debug('Inspector Data Update:', {
                    pendingUsersCount: pendingUsers?.length || 0,
                    pendingLandsCount: pendingLands?.length || 0,
                    disputesCount: Number(disputes || 0)
                });

                return {
                    pendingVerifications: pendingUsers?.length || 0,
                    pendingLands: pendingLands?.length || 0,
                    openDisputes: Number(disputes || 0),
                    lastRefresh: Date.now()
                };
            } catch (error) {
                logger.error('Failed to update inspector data:', error);
                throw error;
            }
        });

        if (result.success) {
            setInspectorData(result.data);
        }
    }, [handleContractCall, callInspectorMethod]);

    // Add more comprehensive event handling
    useEffect(() => {
        let mounted = true;

        const cleanup = () => {
            mounted = false;
        };

        const events = [
            'UserRegistered',
            'UserVerified',
            'UserRejected',
            'LandVerified',
            'DisputeOpened',
            'DisputeClosed'
        ];

        const handleEvent = () => {
            if (mounted) {
                updateInspectorData();
            }
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            cleanup();
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [updateInspectorData]);

    useEffect(() => {
        let mounted = true;

        const cleanup = () => {
            mounted = false;
        };

        const events = [
            'LandVerified',
            'LandRejected',
            'LandVerificationFailed'
        ];

        const handleEvent = (event) => {
            const correlationId = Date.now();
            logger.info(`[${correlationId}] Contract event received:`, {
                eventName: event.type,
                data: event.detail,
                timestamp: new Date().toISOString(),
                inspector: currentUser?.address
            });

            // Update inspector data after event
            if (mounted) {
                updateInspectorData().then(() => {
                    logger.debug(`[${correlationId}] Inspector data updated after event`);
                });
            }
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            cleanup();
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [updateInspectorData, currentUser]);

    // Aligned contract interaction methods
    const verifyUser = useCallback(async (userAddress) => {
        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Starting user verification:`, userAddress);

        try {
            // 1. Check inspector role first
            const INSPECTOR_ROLE = ethers.id("INSPECTOR_ROLE");
            const hasRole = await handleContractCall(
                'userRegistry',
                'hasRole',
                [INSPECTOR_ROLE, currentUser?.address],
                { isView: true }
            );

            if (!hasRole) {
                throw new Error("Not authorized as inspector");
            }

            // 2. Get pre-verification state
            const beforeStatus = await handleContractCall(
                'userRegistry',
                'getVerificationStatus',
                [userAddress],
                { isView: true }
            );

            // 3. Execute verification
            const tx = await handleContractCall(
                'userRegistry',
                'verifyUser',
                [userAddress],
                { waitForConfirmation: true }
            );

            // 4. Verify the change
            const afterStatus = await handleContractCall(
                'userRegistry',
                'getVerificationStatus',
                [userAddress],
                { isView: true }
            );

            if (!afterStatus.isVerified) {
                throw new Error("Verification state not updated");
            }

            return { success: true, data: tx };
        } catch (error) {
            logger.error(`[${correlationId}] Verification failed:`, error);
            throw error;
        }
    }, [currentUser, handleContractCall]);

    const rejectUser = useCallback(async (userAddress, reason) => {
        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Starting user rejection:`, {
            user: userAddress,
            reason
        });

        try {
            // 1. Validate inputs
            if (!reason?.trim()) {
                throw new Error("Rejection reason is required");
            }

            // 2. Validate inspector role
            const INSPECTOR_ROLE = ethers.id("INSPECTOR_ROLE");
            const hasRole = await handleContractCall(
                'userRegistry',
                'hasRole',
                [INSPECTOR_ROLE, currentUser?.address],
                { isView: true }
            );

            if (!hasRole) {
                throw new Error("Not authorized as inspector");
            }

            // 3. Check if user is already rejected
            const isRejected = await handleContractCall(
                'userRegistry',
                'isUserRejected',
                [userAddress],
                { isView: true }
            );

            if (isRejected) {
                throw new Error("User already rejected");
            }

            // 4. Execute rejection with increased gas limit
            const tx = await handleContractCall(
                'userRegistry',
                'rejectUser',
                [userAddress, reason.trim()],
                {
                    gasLimit: 750000,
                    waitForConfirmation: true
                }
            );

            // 5. Verify rejection state
            const verificationStatus = await handleContractCall(
                'userRegistry',
                'getVerificationStatus',
                [userAddress],
                { isView: true }
            );

            if (!verificationStatus.remarks) {
                throw new Error("Rejection reason not stored");
            }

            return { success: true, data: tx };
        } catch (error) {
            logger.error(`[${correlationId}] Rejection failed:`, error);
            throw error;
        }
    }, [currentUser, handleContractCall]);

    const getPendingUsers = useCallback(async () => {
        const result = await callInspectorMethod(() =>
            handleContractCall('userRegistry', 'getPendingUsers', [], { isView: true })
        );
        return result.success ? result.data : [];
    }, [callInspectorMethod, handleContractCall]);

    const getUserDocuments = useCallback(async (userAddress) => {
        const result = await callInspectorMethod(async () => {
            const [, , documentHash] = await handleContractCall(
                'userRegistry',
                'getUserDocuments',
                [userAddress],
                { isView: true }
            );
            return documentHash;
        });
        return result.success ? result.data : null;
    }, [callInspectorMethod, handleContractCall]);

    // Add these new methods
    const verifyLand = useCallback(async (landId, isApproved, reason) => {
        const correlationId = Date.now();

        try {
            // 1. Get initial state
            const beforeState = await handleContractCall(
                'landRegistry',
                'getLandDetails',
                [landId],
                { isView: true }
            );

            // 2. Execute verification with wait for confirmation
            const tx = await handleContractCall(
                'landRegistry',
                'verifyLand',
                [landId, isApproved, reason],
                { waitForConfirmation: true }
            );

            // 3. Wait for state update
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 4. Verify state change
            const afterState = await handleContractCall(
                'landRegistry',
                'getLandDetails',
                [landId],
                { isView: true }
            );

            // 5. Validate state change
            if (isApproved && !afterState.isVerified) {
                throw new Error('Verification state not updated correctly');
            }

            if (!isApproved && !afterState.verificationRemark) {
                throw new Error('Rejection state not updated correctly');
            }

            return { success: true, data: tx };

        } catch (error) {
            logger.error(`[${correlationId}] Land verification failed:`, error);
            throw error;
        }
    }, [handleContractCall]);

    const getPendingLands = useCallback(async () => {
        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Loading pending lands`);

        try {
            // Get pending land IDs
            const pendingIds = await handleContractCall(
                'landRegistry',
                'getPendingVerifications',
                [],
                { isView: true }
            );

            logger.debug(`[${correlationId}] Found pending IDs:`, pendingIds);

            if (!pendingIds?.length) {
                return [];
            }

            // Get details in parallel
            const lands = await Promise.all(
                pendingIds.map(async (id) => {
                    try {
                        const landId = Number(id);
                        const details = await handleContractCall(
                            'landRegistry',
                            'getLandDetails',
                            [landId],
                            { isView: true }
                        );

                        if (!details || !details.owner) {
                            return null;
                        }

                        // Get owner details
                        const owner = await handleContractCall(
                            'userRegistry',
                            'users',
                            [details.owner],
                            { isView: true }
                        );

                        // Add debug log
                        logger.debug(`[${correlationId}] Land ${landId} details:`, {
                            details,
                            owner
                        });

                        return {
                            id: landId,
                            area: Number(details.area),
                            price: details.price,
                            location: details.location || '',
                            coordinates: details.coordinates || '',
                            propertyPID: Number(details.propertyPID),
                            surveyNumber: details.surveyNumber || '',
                            documentHash: details.documentHash || '',
                            owner: details.owner,
                            isVerified: details.isVerified,
                            ownerDetails: owner
                        };
                    } catch (error) {
                        logger.error(`Failed to get land ${id} details:`, error);
                        return null;
                    }
                })
            );

            return lands.filter(land => land !== null);

        } catch (error) {
            logger.error(`[${correlationId}] Failed to get pending lands:`, error);
            throw error;
        }
    }, [handleContractCall]);

    const getLandVerificationDetails = useCallback(async (landId) => {
        const result = await callInspectorMethod(() =>
            handleContractCall('landRegistry', 'getLandVerificationRemark', [landId], { isView: true })
        );
        return result.success ? result.data : '';
    }, [callInspectorMethod, handleContractCall]);

    return {
        inspectorData,
        isInspectorReady,
        verifyUser,
        rejectUser,
        updateInspectorData,
        getPendingUsers,
        getUserDocuments,
        verifyLand,
        getPendingLands,
        getLandVerificationDetails, // Keep only this one
    };
};
