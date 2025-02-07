import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../../core/hooks/useUser';
import { useAuth } from '../../../core/context/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import AddLandModal from './AddLandModal';
import UpdateLandModal from './UpdateLandModal';
import createLogger from '../../../utils/logger';
import { getIpfsUrl } from '../../../utils/ipfsUtils';
import { showToast } from '../../../utils/toast';
import Modal from '../../common/Modal';
import { REQUEST_STATUS } from '../../../core/config';
import { ethers } from 'ethers';

const logger = createLogger('MyLands');

// Update styles with improved visuals
const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: '100vh',
        background: '#f9fafb'  // Add background color
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
    },
    title: {
        fontSize: '2rem',
        fontWeight: '600',
        color: '#111827'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', // Increase card width
        gap: '2.5rem',
        padding: '2rem',
        alignItems: 'stretch' // Make cards equal height
    },
    card: {
        background: 'white',
        borderRadius: '16px', // Slightly larger radius
        padding: '2.5rem', // More padding
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        transition: 'all 0.3s ease',
        border: '1px solid #e5e7eb',
        minHeight: '400px', // Set minimum height
        position: 'relative', // For better hover effect
        '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem', // Increased gap
        margin: '1rem 0'
    },
    detailItem: {
        background: '#f8fafc',
        padding: '1.25rem', // Increased padding
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: '#f1f5f9',
            borderColor: '#cbd5e1'
        }
    },
    label: {
        color: '#64748b', // More muted blue-gray
        fontSize: '0.875rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        marginBottom: '0.25rem'
    },
    value: {
        color: '#1e293b', // Darker for better contrast
        fontSize: '1.125rem', // Slightly larger
        fontWeight: '600',
        lineHeight: '1.5',
        wordBreak: 'break-word',
        display: 'block'
    },
    badge: (isVerified, isForSale) => ({
        display: 'inline-flex',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.5rem',
        background: isVerified
            ? (isForSale ? '#e0f2fe' : '#dcfce7')
            : '#fef3c7',
        color: isVerified
            ? (isForSale ? '#0284c7' : '#16a34a')
            : '#d97706'
    }),
    button: {
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    primaryButton: {
        background: '#2563eb',
        color: 'white',
        '&:hover': { background: '#1d4ed8' }
    },
    secondaryButton: {
        background: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db',
        '&:hover': { background: '#e5e7eb' }
    },
    documentLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#2563eb',
        textDecoration: 'none',
        padding: '0.75rem',
        borderRadius: '6px',
        background: '#f3f4f6',
        '&:hover': { background: '#e5e7eb' }
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
    },
    propertyDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        flex: 1  // Take remaining space
    },
    actionBar: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: 'auto',  // Push to bottom
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
    },
    metadataSection: {
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
    },
    metadataTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '1rem'
    },
    timestamp: {
        display: 'block',
        color: '#6b7280',
        fontSize: '0.75rem',
        marginTop: '0.5rem'
    }
};

// Update price formatting utility
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

const LandCard = ({ land, onUpdate, onToggleSale, onDelete }) => {
    const { handleContractCall } = useAuth(); // Add this line
    // Add status check for rejected lands
    const isRejected = land.verificationRemark && !land.isVerified;

    const propertyDetails = [
        {
            label: 'Price',
            value: `${formatEthPrice(land.price)} ETH`, // Now handles Wei conversion
            style: { color: '#2563eb', fontWeight: 'bold' }
        },
        {
            label: 'Location',
            value: land.location,
            style: { maxHeight: '5em', overflowY: 'auto' }
        },
        {
            label: 'Total Area',
            value: `${land.area.toLocaleString()} sq ft`,
            style: { fontWeight: '600' }
        },
        {
            label: 'Survey Number',
            value: land.surveyNumber,
            style: { fontFamily: 'monospace' }
        },
        {
            label: 'Property ID',
            value: land.propertyPID,
            style: { fontFamily: 'monospace' }
        },
        {
            label: 'Status',
            value: isRejected
                ? '❌ Rejected'
                : land.isVerified
                    ? (land.isForSale ? '🏷️ For Sale' : '✓ Verified')
                    : '⌛ Pending Verification',
            style: {
                color: isRejected
                    ? '#dc2626' // Red for rejected
                    : land.isVerified
                        ? (land.isForSale ? '#0369a1' : '#059669')
                        : '#d97706'
            }
        },
        // If rejected, show rejection reason
        ...(isRejected ? [{
            label: 'Rejection Reason',
            value: land.verificationRemark,
            style: { color: '#dc2626', fontStyle: 'italic' }
        }] : []),
        {
            label: 'Coordinates',
            value: land.coordinates,
            style: { wordBreak: 'break-all' }
        }
    ];

    const handleToggleSale = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (land.isProcessing) return;
        onToggleSale(land.id);
    }, [land, onToggleSale]);

    const handleUpdate = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onUpdate(land);
    }, [land, onUpdate]);

    const handleDocumentClick = useCallback((e) => {
        e.stopPropagation();
    }, []);

    const handleDelete = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            try {
                await onDelete(land.id);
                showToast.success('Property deleted successfully');
            } catch (error) {
                showToast.error('Failed to delete property');
            }
        }
    }, [land.id, onDelete]);

    // Add status check for pending requests
    const [hasPendingRequests, setHasPendingRequests] = useState(false);

    useEffect(() => {
        const checkPendingRequests = async () => {
            try {
                // Use RequestStatus.PENDING (0) instead of string
                const requests = await handleContractCall(
                    'transactionRegistry',
                    'getLandRequests',
                    [land.id, REQUEST_STATUS.PENDING], // Changed from TRANSACTION_STATUS to REQUEST_STATUS
                    { isView: true }
                );
                setHasPendingRequests(requests?.length > 0);
            } catch (error) {
                logger.error('Failed to check pending requests:', error);
            }
        };

        if (land && handleContractCall) {
            checkPendingRequests();
        }
    }, [land.id, handleContractCall]);

    const [metadataDocuments, setMetadataDocuments] = useState(null);

    // Add effect to load metadata documents
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const metadata = await handleContractCall(
                    'landRegistry',
                    'getLandMetadata',
                    [land.id],
                    { isView: true }
                );
                setMetadataDocuments(metadata);
            } catch (error) {
                logger.error('Failed to load metadata:', error);
            }
        };
        loadMetadata();
    }, [land.id, handleContractCall]);

    // Add this section after the main property details rendering
    const renderMetadataDocuments = () => {
        if (!metadataDocuments?.documents?.length) return null;

        return (
            <div style={styles.metadataSection}>
                <h4 style={styles.metadataTitle}>Additional Documents</h4>
                <div style={styles.documentGrid}>
                    {metadataDocuments.documents.map((hash, index) => (
                        <div key={index} style={styles.documentCard}>
                            <a
                                href={getIpfsUrl(hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleDocumentClick}
                                style={styles.documentLink}
                            >
                                <span>📄</span> {metadataDocuments.descriptions[index]}
                            </a>
                            <small style={styles.timestamp}>
                                Added: {new Date(Number(metadataDocuments.lastUpdated) * 1000).toLocaleDateString()}
                            </small>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <div style={styles.priceTag}>
                    <span>💰</span> {formatEthPrice(land.price)} ETH
                </div>
            </div>

            <div style={styles.detailsGrid}>
                {propertyDetails.map(({ label, value, style }) => (
                    <div key={label} style={styles.detailItem}>
                        <span style={styles.label}>{label}</span>
                        <span style={{
                            ...styles.value,
                            ...style
                        }}>
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {land.documentHash && (
                <div style={styles.documentSection}>
                    <a
                        href={getIpfsUrl(land.documentHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleDocumentClick}
                        style={styles.documentLink}
                    >
                        <span>📋</span>
                        View Property Documents
                    </a>
                </div>
            )}

            {/* Add metadata documents section */}
            {renderMetadataDocuments()}

            {/* Update action buttons */}
            <div style={styles.actionBar}>
                {isRejected ? (
                    <>
                        <button
                            onClick={handleDelete}
                            style={{
                                ...styles.button,
                                background: '#dc2626'
                            }}
                        >
                            🗑️ Delete Property
                        </button>
                        <button
                            onClick={handleUpdate}
                            style={{
                                ...styles.button,
                                ...styles.primaryButton,
                            }}
                        >
                            🔄 Update & Resubmit
                        </button>
                    </>
                ) : land.isVerified && (
                    <>
                        <button
                            onClick={handleToggleSale}
                            disabled={land.isProcessing || hasPendingRequests}
                            style={{ ...styles.button, ...styles.primaryButton }}
                        >
                            {land.isProcessing ? '⌛ Processing...' :
                                hasPendingRequests ? '🔒 Has Pending Requests' :
                                    land.isForSale ? '🔒 Remove from Sale' : '🔓 List for Sale'}
                        </button>
                        <button
                            onClick={handleUpdate}
                            style={{
                                ...styles.button,
                                ...styles.secondaryButton
                            }}
                        >
                            ✏️ Update Details
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const MyLands = ({ preview = false, limit = null }) => {
    const { authState: { currentUser }, handleContractCall } = useAuth(); // Add handleContractCall here
    const {
        lands,
        setLands,
        loading,
        fetchLands,
        isInitialized,
        addLand,
        putLandForSale,
        takeLandOffSale
    } = useUser();

    const [showAddLand, setShowAddLand] = useState(false);
    const [selectedLand, setSelectedLand] = useState(null);
    const [pageInfo, setPageInfo] = useState({ currentPage: 0, totalItems: 0 });
    const [processingSale, setProcessingSale] = useState(null);

    const loadLands = useCallback(async () => {
        if (!isInitialized || !currentUser?.address) return;

        try {
            const result = await fetchLands(pageInfo.currentPage);
            if (result?.lands) {
                // Add verification status check here
                const updatedLands = await Promise.all(
                    result.lands.map(async (land) => {
                        // Get fresh verification status
                        const details = await handleContractCall(
                            'landRegistry',
                            'getLandDetails',
                            [land.id],
                            { isView: true }
                        );

                        // Ensure price is properly converted from contract
                        return {
                            ...land,
                            ...details,
                            price: details.price, // Keep original BigInt price
                            isVerified: details.isVerified,
                            verificationRemark: details.verificationRemark,
                            isProcessing: land.id === processingSale
                        };
                    })
                );

                setLands(updatedLands);
            }
            setPageInfo(prev => ({
                ...prev,
                totalItems: result?.totalItems || 0
            }));
        } catch (error) {
            logger.error('Failed to load lands:', error);
            showToast.error('Failed to load properties');
        }
    }, [isInitialized, currentUser?.address, fetchLands, pageInfo.currentPage, processingSale, handleContractCall]); // Add handleContractCall to dependencies

    useEffect(() => {
        loadLands();
    }, [loadLands]);

    const handleToggleSale = async (landId) => {
        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Attempting to toggle sale:`, { landId });

        try {
            setProcessingSale(landId);

            // Get fresh land details first
            const landDetails = await handleContractCall(
                'landRegistry',
                'getLandDetails',
                [landId],
                { isView: true }
            );

            logger.debug(`[${correlationId}] Land details:`, landDetails);

            // Call appropriate contract function based on current sale state
            if (landDetails.isForSale) {
                await handleContractCall(
                    'landRegistry',
                    'takeLandOffSale',
                    [landId]
                );
                showToast.success('Property removed from sale');
            } else {
                await handleContractCall(
                    'landRegistry',
                    'putLandForSale',
                    [landId]
                );
                showToast.success('Property listed for sale');
            }

            // Refresh the lands list
            await loadLands();
        } catch (error) {
            logger.error(`[${correlationId}] Toggle sale failed:`, {
                error: error.message,
                landId
            });
            showToast.error(error.message || 'Failed to update sale status');
        } finally {
            setProcessingSale(null);
        }
    };

    const handleAddLand = useCallback(async (data) => {
        try {
            // Data should already have price as properly formatted string from AddLandModal
            logger.debug('Adding land:', {
                ...data,
                price: data.price
            });

            const result = await addLand(data);

            if (result) {
                setShowAddLand(false);
                await loadLands();
                showToast.success('Property added successfully');
            }
        } catch (error) {
            logger.error('Failed to add land:', error);
            showToast.error(error.message || 'Failed to add land');
        }
    }, [addLand, loadLands]);

    const handleDeleteLand = useCallback(async (landId) => {
        const correlationId = Date.now();
        try {
            // 1. Get land details first
            const landDetails = await handleContractCall(
                'landRegistry',
                'getLandDetails',
                [landId],
                { isView: true }
            );

            // 2. Verify ownership and state
            if (landDetails.isForSale) {
                throw new Error('Cannot delete land while it is for sale');
            }

            // 3. Execute deletion with increased gas limit
            const result = await handleContractCall(
                'landRegistry',
                'removeLand',
                [landId],
                {
                    gasLimit: 500000,
                    correlationId
                }
            );

            // 4. Wait for confirmation
            if (result) {
                // 5. Remove from local state
                setLands(prev => prev.filter(land => land.id !== landId));
                showToast.success('Property deleted successfully');
            }

            // 6. Refresh the list
            await loadLands();
        } catch (error) {
            logger.error(`[${correlationId}] Failed to delete land:`, error);
            showToast.error(error.message || 'Failed to delete property');
            throw error;
        }
    }, [handleContractCall, loadLands]);

    useEffect(() => {
        return () => {
            setProcessingSale(null);
            setShowAddLand(false);
            setSelectedLand(null);
        };
    }, []);

    useEffect(() => {
        const events = ['LandAdded', 'LandUpdated', 'LandRemoved'];

        const handleLandEvent = async (event) => {
            logger.debug('Land event received:', event.type);
            await loadLands();
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleLandEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleLandEvent);
            });
        };
    }, [loadLands]);

    useEffect(() => {
        const handleLandAdded = async () => {
            logger.debug('New land added, refreshing list');
            await loadLands();
        };

        window.addEventListener('contract:LandAdded', handleLandAdded);
        return () => window.removeEventListener('contract:LandAdded', handleLandAdded);
    }, [loadLands]);

    if (!isInitialized || loading) return <LoadingSpinner message="Loading properties..." />;

    const displayLands = preview ? lands.slice(0, limit) : lands;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>
                    {preview ? 'Recent Properties' : 'My Properties'}
                </h1>
                {!preview && (
                    <button
                        onClick={() => setShowAddLand(true)}
                        style={{ ...styles.button, ...styles.primaryButton }}>
                        <span>➕</span> Add New Property
                    </button>
                )}
            </div>

            <div style={styles.grid}>
                {displayLands.length > 0 ? (
                    displayLands.map(land => (
                        <LandCard
                            key={land.id}
                            land={land}
                            onUpdate={setSelectedLand}
                            onToggleSale={handleToggleSale}
                            onDelete={handleDeleteLand}  // Add this prop
                        />
                    ))
                ) : (
                    <div style={styles.emptyState}>
                        <span style={{ fontSize: '3rem' }}>🏠</span>
                        <h3 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
                            No properties found
                        </h3>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            Add your first property to get started
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                isOpen={showAddLand}
                onClose={() => setShowAddLand(false)}
                title="Add New Property">
                <AddLandModal
                    onClose={() => setShowAddLand(false)}
                    onSubmit={handleAddLand}
                />
            </Modal>

            <Modal
                isOpen={!!selectedLand}
                onClose={() => setSelectedLand(null)}
                title="Update Property">
                {selectedLand && (
                    <UpdateLandModal
                        land={selectedLand}
                        onClose={() => setSelectedLand(null)}
                        onUpdate={loadLands}
                    />
                )}
            </Modal>
        </div>
    );
};

export default MyLands;