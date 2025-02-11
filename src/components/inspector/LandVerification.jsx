import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useInspector } from '../../core/hooks/useInspector';
import LoadingSpinner from '../common/LoadingSpinner';
import { showToast } from '../../utils/toast';
import { getIpfsUrl } from '../../utils/ipfsUtils';
import createLogger from '../../utils/logger';
import { useAuth } from '../../core/context/AuthContext';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';  // Make sure this is imported
const logger = createLogger('LandVerification');

// Update styles for better vertical layout and simpler design
const styles = {
    container: {
        width: '100%',
        padding: '1.5rem',
        backgroundColor: '#f9fafb'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: '600',
        color: '#111827'
    },
    propertyCard: {
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
    },
    priceTag: {
        color: '#2563eb',
        fontSize: '1.25rem',
        fontWeight: '600'
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1.5fr',
        gap: '1.5rem'
    },
    section: {
        marginBottom: '1.5rem'
    },
    sectionHeader: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid #e5e7eb'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem'
    },
    infoItem: {
        padding: '0.75rem',
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
    },
    label: {
        color: '#6b7280',
        fontSize: '0.875rem',
        marginBottom: '0.25rem'
    },
    value: {
        color: '#111827',
        fontSize: '0.938rem',
        fontWeight: '500'
    },
    documentSection: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem'
    },
    documentLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        color: '#2563eb',
        textDecoration: 'none',
        fontSize: '0.875rem',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: '#e5e7eb'
        }
    },
    actions: {
        display: 'flex',
        gap: '0.75rem',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
    },
    button: {
        padding: '0.625rem 1rem',
        borderRadius: '6px',
        border: 'none',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    },
    verifyButton: {
        backgroundColor: '#059669',
        color: 'white',
        '&:hover': { opacity: 0.9 }
    },
    rejectButton: {
        backgroundColor: '#dc2626',
        color: 'white',
        '&:hover': { opacity: 0.9 }
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        borderRadius: '12px',
        padding: '4rem 2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        margin: '2rem auto',
        maxWidth: '500px',
        textAlign: 'center'
    },
    emptyIcon: {
        fontSize: '4rem',
        marginBottom: '1.5rem',
        color: '#6B7280',
        background: '#F3F4F6',
        width: '8rem',
        height: '8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        marginBottom: '2rem'
    },
    emptyTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '0.75rem'
    },
    emptyDescription: {
        color: '#6B7280',
        fontSize: '1rem',
        maxWidth: '300px',
        lineHeight: '1.5',
        margin: '0 auto'
    },
    refreshLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#2563EB',
        fontSize: '0.875rem',
        fontWeight: '500',
        marginTop: '1.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        '&:hover': {
            background: '#DBEAFE',
            transform: 'translateY(-1px)'
        }
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: '1rem'
    },
    modalDescription: {
        fontSize: '1rem',
        color: '#6B7280',
        marginBottom: '1.5rem',
        lineHeight: '1.5'
    },
    textarea: {
        width: '100%',
        minHeight: '120px',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '2px solid #E5E7EB',
        marginBottom: '1.5rem',
        fontSize: '0.95rem',
        resize: 'vertical',
        '&:focus': {
            outline: 'none',
            borderColor: '#3B82F6',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        borderTop: '1px solid #E5E7EB',
        paddingTop: '1.5rem'
    }
};

// Move verification state outside component for better reuse
const useVerificationState = () => {
    const [state, setState] = useState({
        isProcessing: false,
        currentAction: null,
        landId: null,
        error: null
    });

    const startVerification = useCallback((landId, action) => {
        setState({
            isProcessing: true,
            currentAction: action,
            landId,
            error: null
        });
    }, []);

    const endVerification = useCallback((error = null) => {
        setState({
            isProcessing: false,
            currentAction: null,
            landId: null,
            error
        });
    }, []);

    return {
        state,
        startVerification,
        endVerification
    };
};

// Update the ETH formatting utility
const formatEthPrice = (priceInWei) => {
    try {
        if (!priceInWei) return '0.00';
        // Convert price to string first since it's a BigInt
        const priceString = priceInWei.toString();
        return ethers.formatEther(priceString);
    } catch (error) {
        console.error('Error formatting ETH price:', error);
        return '0.00';
    }
};

// Update PropertyCard component layout
const PropertyCard = React.memo(({ land, ownerDetails, onVerify, onReject, isVerifying }) => {
    // Add input validation and conversion
    const formattedData = useMemo(() => {
        if (!land) return null;

        return {
            id: Number(land.id),
            area: Number(land.area),
            price: formatEthPrice(land.price),
            propertyPID: Number(land.propertyPID),
            location: land.location || 'Not provided',
            surveyNumber: land.surveyNumber || 'Not provided',
            coordinates: land.coordinates || 'Not provided',
            documentHash: land.documentHash || null
        };
    }, [land]);

    // Add user document details formatting
    const userDetails = useMemo(() => {
        if (!ownerDetails) return null;

        return {
            name: ownerDetails.name,
            age: ownerDetails.age,
            city: ownerDetails.city,
            email: ownerDetails.email,
            aadharNumber: ownerDetails.aadharNumber,
            panNumber: ownerDetails.panNumber,
            documentHash: ownerDetails.documentHash,
            isVerified: ownerDetails.isVerified
        };
    }, [ownerDetails]);

    if (!formattedData || !userDetails) return null;

    const propertyDetails = [
        {
            id: 'price', // Add unique id
            label: 'Price',
            value: `${formatEthPrice(land.price)} ETH`,
            style: { color: '#2563eb', fontWeight: 'bold' }
        },
        {
            id: 'pid',
            label: 'Property ID',
            value: formattedData.propertyPID,
            style: { fontFamily: 'monospace', fontWeight: 'bold' }
        },
        {
            id: 'location',
            label: 'Location',
            value: formattedData.location,
            style: { maxHeight: '5em', overflowY: 'auto' }
        },
        {
            id: 'area',
            label: 'Total Area',
            value: `${formattedData.area.toLocaleString()} sq ft`,
            style: { fontWeight: '600', color: '#1a56db' }
        },
        {
            id: 'survey',
            label: 'Survey Number',
            value: formattedData.surveyNumber,
            style: { fontFamily: 'monospace', letterSpacing: '0.05em' }
        },
        {
            id: 'coordinates',
            label: 'Coordinates',
            value: formattedData.coordinates,
            style: { fontFamily: 'monospace', fontSize: '0.9em' }
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.propertyCard}
        >
            <div style={styles.cardHeader}>
                <div style={styles.priceTag}>
                    💰 {formatEthPrice(land.price)} ETH
                </div>
                <div style={styles.documentSection}>
                    {userDetails?.documentHash && (
                        <a href={getIpfsUrl(userDetails.documentHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.documentLink}>
                            📄 KYC Documents
                        </a>
                    )}
                    {land.documentHash && (
                        <a href={getIpfsUrl(land.documentHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.documentLink}>
                            📄 Property Documents
                        </a>
                    )}
                </div>
            </div>

            <div style={styles.contentGrid}>
                <div style={styles.section}>
                    <h3 style={styles.sectionHeader}>Property Details</h3>
                    <div style={styles.infoGrid}>
                        {propertyDetails.map(({ id, label, value, style }) => (
                            <div
                                key={id} // Use the unique id here
                                style={{
                                    ...styles.infoItem,
                                    '&:hover': {
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }
                                }}
                            >
                                <div style={styles.label}>{label}</div>
                                <div style={{
                                    ...styles.value,
                                    ...style
                                }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionHeader}>Owner Information</h3>
                    <div style={styles.infoGrid}>
                        {[
                            { id: 'name', label: 'Full Name', value: userDetails.name },
                            { id: 'age', label: 'Age', value: userDetails.age ? `${userDetails.age} years` : 'Not provided' },
                            { id: 'city', label: 'City', value: userDetails.city },
                            { id: 'email', label: 'Email Address', value: userDetails.email },
                            { id: 'aadhar', label: 'Aadhar Number', value: userDetails.aadharNumber },
                            { id: 'pan', label: 'PAN Number', value: userDetails.panNumber }
                        ].map(({ id, label, value }) => (
                            <div
                                key={id} // Add unique key here
                                style={styles.infoItem}
                            >
                                <div style={styles.label}>{label}</div>
                                <div style={styles.value}>
                                    {value || 'Not provided'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={styles.actions}>
                <button
                    onClick={() => onVerify(land.id)}
                    disabled={isVerifying}
                    style={{ ...styles.button, ...styles.verifyButton }}>
                    {isVerifying ? '⌛ Verifying...' : '✓ Verify Property'}
                </button>
                <button
                    onClick={() => onReject(land.id)}
                    disabled={isVerifying}
                    style={{ ...styles.button, ...styles.rejectButton }}>
                    ✕ Reject Property
                </button>
            </div>
        </motion.div>
    );
});

const RejectDialog = React.memo(({ onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        const trimmedReason = reason.trim();
        if (!trimmedReason || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onConfirm(trimmedReason);
        } catch (error) {
            showToast.error('Failed to reject property');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter' && e.ctrlKey) handleConfirm();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return (
        <div style={styles.modal} onClick={onCancel}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h3 style={styles.modalTitle}>Reject Property Verification</h3>
                <p style={styles.modalDescription}>
                    Please provide a detailed reason for rejection.
                    This will be visible to the property owner.
                </p>

                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    style={styles.textarea}
                    disabled={isSubmitting}
                    autoFocus
                />

                <div style={styles.modalActions}>
                    <button
                        onClick={onCancel}
                        style={{ ...styles.button, background: '#6B7280' }}
                        disabled={isSubmitting}>
                        Cancel (Esc)
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isSubmitting}
                        style={{ ...styles.button, ...styles.rejectButton }}>
                        {isSubmitting ? 'Rejecting...' : 'Confirm Rejection (Ctrl+Enter)'}
                    </button>
                </div>
            </div>
        </div>
    );
});

// Update the main component
const LandVerification = () => {
    const { verifyLand, getPendingLands } = useInspector();
    const { handleContractCall } = useAuth(); // Add this line to get handleContractCall
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRejectDialog, setShowRejectDialog] = useState({ show: false, landId: null });
    const { state: verificationState, startVerification, endVerification } = useVerificationState();

    // Simplified loading function
    const loadPendingLands = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const pendingLands = await getPendingLands();

            // Add debug logging
            logger.debug('Raw pending lands:', pendingLands);

            // Filter out rejected lands
            const validatedLands = pendingLands?.filter(land =>
                land && !land.verificationRemark // Only include lands without rejection remarks
            ).map(land => ({
                ...land,
                id: Number(land.id),
                area: Number(land.area),
                price: land.price,
                propertyPID: Number(land.propertyPID)
            })) || [];

            logger.debug('Validated lands:', validatedLands);
            setLands(validatedLands);
        } catch (error) {
            logger.error('Failed to load lands:', error);
            setError('Failed to load pending lands');
            setLands([]);
        } finally {
            setLoading(false);
        }
    }, [getPendingLands]);

    // Load lands only once on mount
    useEffect(() => {
        loadPendingLands();
    }, [loadPendingLands]);

    // Add back the verification handlers
    const handleVerifyLand = useCallback(async (landId) => {
        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Starting land verification:`, landId);
        setLoading(true);

        try {
            // 1. Verify
            const result = await verifyLand(landId, true, "Land verification approved");

            // 2. Wait for transaction confirmation
            if (result?.success) {
                // 3. Double check the verification state after a short delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                const updatedLand = await handleContractCall(
                    'landRegistry',
                    'getLandDetails',
                    [landId],
                    { isView: true }
                );

                if (!updatedLand?.isVerified) {
                    throw new Error('Verification state not updated correctly');
                }

                // 4. Show success toast and update UI
                showToast.success('Land verified successfully!', {
                    icon: '✅',
                    duration: 4000
                });

                // 5. Refresh the list
                await loadPendingLands();
            } else {
                throw new Error(result?.error || 'Verification failed');
            }
        } catch (error) {
            logger.error(`[${correlationId}] Verification failed:`, error);
            showToast.error(`Verification failed: ${error.message}`, {
                icon: '❌',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    }, [verifyLand, loadPendingLands, handleContractCall]); // Add handleContractCall to dependencies

    const handleRejectLand = useCallback(async (landId, reason) => {
        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Rejecting land:`, { landId, reason });
        setLoading(true);

        try {
            // 1. Reject
            const result = await verifyLand(landId, false, reason.trim());

            // 2. Wait for transaction confirmation
            if (result?.success) {
                // 3. Verify rejection state after a short delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                const updatedLand = await handleContractCall(
                    'landRegistry',
                    'getLandDetails',
                    [landId],
                    { isView: true }
                );

                if (!updatedLand?.verificationRemark) {
                    throw new Error('Rejection state not updated correctly');
                }

                // 4. Show success toast and update UI
                showToast.success('Land rejected successfully', {
                    icon: '🚫',
                    duration: 4000
                });

                // 5. Remove from list and refresh
                setLands(prevLands => prevLands.filter(land => land.id !== landId));
                await loadPendingLands();
            } else {
                throw new Error(result?.error || 'Rejection failed');
            }
        } catch (error) {
            logger.error(`[${correlationId}] Rejection failed:`, error);
            showToast.error(`Rejection failed: ${error.message}`, {
                icon: '❌',
                duration: 5000
            });
        } finally {
            setLoading(false);
            setShowRejectDialog({ show: false, landId: null });
        }
    }, [verifyLand, loadPendingLands, handleContractCall]);

    // Add event listeners for contract events
    useEffect(() => {
        const handleVerificationEvent = async (event) => {
            logger.debug('Verification event received:', event.type);
            await loadPendingLands();
        };

        window.addEventListener('contract:LandVerified', handleVerificationEvent);
        window.addEventListener('contract:LandRejected', handleVerificationEvent);

        return () => {
            window.removeEventListener('contract:LandVerified', handleVerificationEvent);
            window.removeEventListener('contract:LandRejected', handleVerificationEvent);
        };
    }, [loadPendingLands]);

    // Simplified PropertyCard render
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Land Verification Portal</h1>
                <button
                    onClick={loadPendingLands}
                    style={{ ...styles.button, ...styles.refreshButton }}
                    disabled={loading}>
                    {loading ? '⌛ Refreshing...' : '🔄 Refresh'}
                </button>
            </div>

            {loading ? (
                <LoadingSpinner message="Loading pending lands..." />
            ) : error ? (
                <div style={styles.error}>{error}</div>
            ) : lands.length > 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%' // Added to ensure full width
                }}>
                    {lands.map(land => (
                        <PropertyCard
                            key={land.id}
                            land={land}
                            ownerDetails={land.ownerDetails}
                            onVerify={handleVerifyLand}
                            onReject={(id) => setShowRejectDialog({ show: true, landId: id })}
                            isVerifying={verificationState.landId === land.id}
                        />
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={styles.emptyState}
                >
                    <div style={styles.emptyIcon}>
                        🏠
                    </div>
                    <h3 style={styles.emptyTitle}>
                        No Pending Verifications
                    </h3>
                    <p style={styles.emptyDescription}>
                        All properties have been verified. New properties pending verification will appear here.
                    </p>
                    <button
                        onClick={loadPendingLands}
                        style={styles.refreshLink}
                    >
                        <span>🔄</span>
                        Check for new properties
                    </button>
                </motion.div>
            )}

            {showRejectDialog.show && (
                <RejectDialog
                    onConfirm={(reason) => {
                        handleRejectLand(showRejectDialog.landId, reason);
                        setShowRejectDialog({ show: false, landId: null });
                    }}
                    onCancel={() => setShowRejectDialog({ show: false, landId: null })}
                />
            )}
        </div>
    );
};

export default React.memo(LandVerification);

