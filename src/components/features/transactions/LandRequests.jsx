import React, { useEffect, useMemo, useState, useCallback, useContext } from 'react';
import { useUser } from '../../../core/hooks/useUser';
import LoadingSpinner from '../../common/LoadingSpinner';
import { REQUEST_STATUS } from '../../../core/config'; // Changed from TRANSACTION_STATUS
import { useAuth } from '../../../core/context/AuthContext';
import createLogger from '../../../utils/logger';
import { showToast, dismissToasts } from '../../../utils/toast';  // Add dismissToasts
import { sharedStyles, colors, mixins } from '../../../styles/sharedPage';
import { ethers } from 'ethers';

const logger = createLogger('LandRequests');

// Update color palette with more sophisticated colors
const colorPalette = {
    primary: {
        light: '#60a5fa',
        main: '#3b82f6',
        dark: '#2563eb',
        contrast: '#ffffff'
    },
    neutral: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
    },
    success: {
        light: '#4ade80',
        main: '#22c55e',
        dark: '#16a34a'
    },
    error: {
        light: '#f87171',
        main: '#ef4444',
        dark: '#dc2626'
    },
    warning: {
        light: '#fbbf24',
        main: '#f59e0b',
        dark: '#d97706'
    }
};

// Update status colors to use new palette
const statusColors = {
    [REQUEST_STATUS.PENDING]: {
        bg: colorPalette.warning.light + '20',
        text: colorPalette.warning.dark,
        border: colorPalette.warning.main,
        icon: '⏳'
    },
    [REQUEST_STATUS.ACCEPTED]: {
        bg: colorPalette.success.light,
        text: colorPalette.success.dark,
        icon: '✅'
    },
    [REQUEST_STATUS.REJECTED]: {
        bg: colorPalette.error.light,
        text: colorPalette.error.dark,
        icon: '❌'
    },
    [REQUEST_STATUS.COMPLETED]: {
        bg: colorPalette.success.light,
        text: colorPalette.success.dark,
        icon: '🎉'
    }
};

// Update styles with optimized spacing and layout
const requestStyles = {
    mainContainer: {
        maxWidth: '1200px', // Reduced from 1400px
        margin: '0 auto',
        padding: '1rem', // Reduced from 2rem
        backgroundColor: colorPalette.neutral[50],
        minHeight: '100vh'
    },
    header: {
        background: `linear-gradient(135deg, ${colorPalette.primary.main} 0%, ${colorPalette.primary.dark} 100%)`,
        borderRadius: '0.5rem', // Reduced from 1rem
        padding: '1rem 1.5rem', // Reduced padding
        marginBottom: '1rem', // Reduced margin
        color: colorPalette.primary.contrast,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    tabContainer: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem', // Reduced margin
        borderBottom: `1px solid ${colorPalette.neutral[200]}`,
        padding: '0 0.5rem'
    },
    tab: (isActive) => ({
        padding: '0.75rem 1.25rem',
        color: isActive ? colorPalette.primary.main : colorPalette.neutral[500],
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${isActive ? colorPalette.primary.main : 'transparent'}`,
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    }),
    requestCard: {
        background: colorPalette.neutral[50],
        borderRadius: '0.5rem',
        border: `1px solid ${colorPalette.neutral[200]}`,
        overflow: 'hidden',
        marginBottom: '0.75rem', // Reduced margin
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            boxShadow: `0 2px 4px ${colorPalette.neutral[200]}`
        }
    },
    requestHeader: {
        padding: '0.75rem 1rem',
        borderBottom: `1px solid ${colorPalette.neutral[200]}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: colorPalette.neutral[100]
    },
    requestDetails: {
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', // Change to 2 columns for better readability
        gap: '1.5rem',
        fontSize: '0.875rem',
        '@media screen and (maxWidth: 768px)': { // Fixed media query syntax
            gridTemplateColumns: '1fr' // Single column on mobile
        }
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    detailLabel: {
        color: colorPalette.neutral[500],
        fontSize: '0.75rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
    },
    detailValue: {
        color: colorPalette.neutral[900],
        fontWeight: '500',
        background: colorPalette.neutral[100],
        padding: '0.75rem',
        borderRadius: '0.375rem',
        border: `1px solid ${colorPalette.neutral[200]}`,
        fontSize: '0.875rem',
        wordBreak: 'break-all'
    },
    statusBadge: (status) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: statusColors[status]?.bg,
        color: statusColors[status]?.text,
        border: `1px solid ${statusColors[status]?.border}`
    }),
    actionBar: {
        padding: '0.75rem 1rem',
        borderTop: `1px solid ${colorPalette.neutral[200]}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
        background: colorPalette.neutral[50]
    },
    actionButton: (variant = 'primary') => ({
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        background: colorPalette[variant].main,
        color: '#ffffff',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: colorPalette[variant].dark
        },
        '&:disabled': {
            opacity: 0.6,
            cursor: 'not-allowed'
        }
    }),
    emptyState: {
        textAlign: 'center',
        padding: '2rem',
        background: colorPalette.neutral[50],
        borderRadius: '0.5rem',
        border: `1px dashed ${colorPalette.neutral[300]}`,
        color: colorPalette.neutral[500]
    },
    detailSection: {
        background: colorPalette.neutral[50],
        borderRadius: '0.5rem',
        padding: '1.25rem',
        border: `1px solid ${colorPalette.neutral[200]}`,
        marginBottom: '1rem'
    },

    sectionTitle: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: colorPalette.neutral[700],
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: `1px solid ${colorPalette.neutral[200]}`
    },
};

// Add ProcessingState context to manage loading states
const ProcessingContext = React.createContext(null);

const ProcessingProvider = ({ children }) => {
    const [processingState, setProcessingState] = useState({
        isProcessing: false,
        requestId: null,
        action: null
    });

    return (
        <ProcessingContext.Provider value={[processingState, setProcessingState]}>
            {children}
        </ProcessingContext.Provider>
    );
};

// Add helper for price formatting
const formatPrice = (priceInWei) => {
    try {
        if (!priceInWei || priceInWei.toString() === '0') return '0.00';
        return ethers.formatEther(priceInWei.toString());
    } catch (error) {
        console.error('Error formatting price:', error);
        return '0.00';
    }
};

// Simplified RequestCard component with proper hooks ordering
const RequestCard = ({ request, type, onProcess, onMakePayment, onCancel }) => {
    // 1. Group all hooks at the top
    const { handleContractCall, authState: { currentUser } } = useAuth();
    const [landDetails, setLandDetails] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingState, setProcessingState] = useContext(ProcessingContext);

    // 2. Define callbacks before any conditional returns
    const renderPrice = useCallback((price) => {
        if (!price) return 'N/A';
        return ethers.formatEther(price.toString()) + ' ETH';
    }, []);

    const handleAction = useCallback(async (action, ...args) => {
        if (!action) return;

        setProcessingState({
            isProcessing: true,
            requestId: request.requestId,
            action: action.name
        });

        try {
            if (action === onMakePayment && landDetails?.price) {
                await onMakePayment(request.requestId, {
                    value: landDetails.price.toString()
                });
                showToast.success('Payment completed successfully!');
            } else {
                await action(...args);
            }
        } catch (error) {
            logger.error('Action failed:', error);
            showToast.error(error.message || 'Transaction failed');
        } finally {
            setProcessingState({
                isProcessing: false,
                requestId: null,
                action: null
            });
        }
    }, [request?.requestId, landDetails?.price, onMakePayment, setProcessingState]);

    // 3. Single useEffect for data loading
    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            if (!request?.requestId || !request?.landId) return;

            try {
                const landInfo = await handleContractCall(
                    'landRegistry',
                    'getLandDetails',
                    [request.landId],
                    { isView: true }
                );

                if (mounted) {
                    setLandDetails(landInfo);
                    setIsLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err);
                    logger.error('Failed to load request details:', err);
                }
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [request?.requestId, request?.landId, handleContractCall]);

    if (isLoading) return <LoadingSpinner />;
    if (error) return <div style={requestStyles.errorState}>Error loading request details</div>;
    if (!landDetails) return null;

    // 4. Render methods
    const renderActions = () => {
        const requestStatus = Number(request?.status || 0);
        const isSeller = request?.seller?.toLowerCase() === currentUser?.address?.toLowerCase();
        const isBuyer = request?.buyer?.toLowerCase() === currentUser?.address?.toLowerCase();

        if (type === 'incoming' && isSeller && requestStatus === REQUEST_STATUS.PENDING) {
            return (
                <>
                    <button onClick={() => handleAction(onProcess, request.requestId, true)}
                        disabled={processingState.isProcessing}
                        style={requestStyles.actionButton('success')}>
                        Accept Request
                    </button>
                    <button onClick={() => handleAction(onProcess, request.requestId, false)}
                        disabled={processingState.isProcessing}
                        style={requestStyles.actionButton('error')}>
                        Reject Request
                    </button>
                </>
            );
        }

        if (type === 'outgoing' && isBuyer) {
            if (requestStatus === REQUEST_STATUS.PENDING) {
                return (
                    <button onClick={() => handleAction(onCancel, request.requestId)}
                        disabled={processingState.isProcessing}
                        style={requestStyles.actionButton('error')}>
                        Cancel Request
                    </button>
                );
            }

            if (requestStatus === REQUEST_STATUS.ACCEPTED && !request.isPaymentDone && landDetails?.price) {
                return (
                    <button onClick={() => handleAction(onMakePayment, request.requestId)}
                        disabled={processingState.isProcessing}
                        style={requestStyles.actionButton('success')}>
                        {`Complete Purchase (${renderPrice(landDetails.price)})`}
                    </button>
                );
            }
        }

        return null;
    };

    // Only show details that exist in contract
    const details = [
        ['Request ID', `#${request?.requestId || 'N/A'}`],
        ['Location', landDetails?.location || 'N/A'],
        ['Area', landDetails ? `${Number(landDetails.area).toLocaleString()} sq ft` : 'N/A'],
        ['Price', landDetails ? `${ethers.formatEther(landDetails.price)} ETH` : 'N/A'],
        ['Survey Number', landDetails?.surveyNumber || 'N/A'],
        [type === 'incoming' ? 'Buyer' : 'Seller',
        type === 'incoming' ? request?.buyer : request?.seller]
    ].filter(([_, value]) => value !== 'N/A'); // Only show fields with values


    return (
        <div style={requestStyles.requestCard}>
            <div style={requestStyles.requestHeader}>
                <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: colorPalette.neutral[900] }}>
                        Request #{request?.requestId}
                    </h3>
                    <span style={{ color: colorPalette.neutral[500], fontSize: '0.875rem' }}>
                        {type === 'incoming' ? 'From' : 'To'}: {type === 'incoming' ?
                            `${request?.buyer?.slice(0, 6)}...${request?.buyer?.slice(-4)}` :
                            `${request?.seller?.slice(0, 6)}...${request?.seller?.slice(-4)}`
                        }
                    </span>
                </div>
                <span style={requestStyles.statusBadge(request?.status)}>
                    {statusColors[request?.status]?.icon} {REQUEST_STATUS[request?.status]}
                </span>
            </div>

            <div style={requestStyles.requestDetails}>
                {/* Property Details Section */}
                <div style={requestStyles.detailSection}>
                    <h4 style={requestStyles.sectionTitle}>Property Details</h4>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <DetailItem
                            label="Property ID"
                            value={landDetails?.propertyPID?.toString() || 'N/A'}
                        />
                        <DetailItem
                            label="Location"
                            value={landDetails?.location || 'N/A'}
                        />
                        <DetailItem
                            label="Area"
                            value={landDetails ? `${Number(landDetails.area).toLocaleString()} sq ft` : 'N/A'}
                        />
                        <DetailItem
                            label="Survey Number"
                            value={landDetails?.surveyNumber || 'N/A'}
                        />
                        <DetailItem
                            label="Coordinates"
                            value={landDetails?.coordinates || 'N/A'}
                        />
                    </div>
                </div>

                {/* Transaction Details Section */}
                <div style={requestStyles.detailSection}>
                    <h4 style={requestStyles.sectionTitle}>Transaction Details</h4>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <DetailItem
                            label="Price"
                            value={renderPrice(landDetails?.price)}
                            highlight={true}
                        />
                        <DetailItem
                            label={type === 'incoming' ? 'Buyer' : 'Seller'}
                            value={type === 'incoming' ? request?.buyer : request?.seller}
                            isAddress={true}
                        />
                        <DetailItem
                            label="Payment Status"
                            value={request?.isPaymentDone ? 'Completed' : 'Pending'}
                            status={request?.isPaymentDone ? REQUEST_STATUS.COMPLETED : REQUEST_STATUS.PENDING}
                        />
                    </div>
                </div>
            </div>

            <div style={requestStyles.actionBar}>
                {renderActions()}
            </div>
        </div>
    );
};

// Add a new DetailItem component for consistent styling
const DetailItem = ({ label, value, isAddress, highlight, status }) => (
    <div style={requestStyles.detailItem}>
        <span style={requestStyles.detailLabel}>{label}</span>
        <span style={{
            ...requestStyles.detailValue,
            ...(highlight && {
                color: colorPalette.primary.dark,
                fontWeight: '600',
                background: colorPalette.primary.light + '10'
            }),
            ...(status !== undefined && {
                color: statusColors[status]?.text,
                background: statusColors[status]?.bg + '20',
                border: `1px solid ${statusColors[status]?.border || colorPalette.neutral[200]}`
            })
        }}>
            {isAddress ? (
                <span style={{ fontFamily: 'monospace' }}>
                    {`${value?.slice(0, 6)}...${value?.slice(-4)}`}
                </span>
            ) : value}
        </span>
    </div>
);

// Add new TabHeader component
const TabHeader = ({ activeTab, onTabChange }) => (
    <div style={requestStyles.tabHeader}>
        <button
            onClick={() => onTabChange('incoming')}
            style={{
                ...requestStyles.tabButton,
                ...(activeTab === 'incoming' ? {
                    color: colors.primary.main,
                    borderBottom: `3px solid ${colors.primary.main}`
                } : {})
            }}>
            📥 Received Requests
        </button>
        <button
            onClick={() => onTabChange('outgoing')}
            style={{
                ...requestStyles.tabButton,
                ...(activeTab === 'outgoing' ? {
                    color: colors.primary.main,
                    borderBottom: `3px solid ${colors.primary.main}`
                } : {})
            }}>
            📤 Sent Requests
        </button>
    </div>
);

// Simplified LandRequests component
const LandRequests = ({ preview = false }) => {
    const [activeTab, setActiveTab] = useState('incoming');
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState([]);
    const { authState: { currentUser }, handleContractCall } = useAuth();
    const { processPurchaseRequest, makePayment, cancelPurchaseRequest } = useUser();

    // Single effect for data loading
    useEffect(() => {
        const loadRequests = async () => {
            if (!currentUser?.address) return;

            try {
                setLoading(true);
                const requests = await handleContractCall(
                    'transactionRegistry',
                    'getUserPurchaseRequests',
                    [currentUser.address],
                    { isView: true }
                );

                if (Array.isArray(requests)) {
                    const filteredRequests = requests.filter(req => {
                        const isIncoming = req?.seller?.toLowerCase() === currentUser.address?.toLowerCase();
                        const isOutgoing = req?.buyer?.toLowerCase() === currentUser.address?.toLowerCase();
                        return activeTab === 'incoming' ? isIncoming : isOutgoing;
                    });

                    setRequests(filteredRequests);
                }
            } catch (error) {
                logger.error('Failed to load requests:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, [currentUser?.address, activeTab, handleContractCall]);

    // Simplified action handlers
    const handleProcessRequest = async (requestId, accept) => {
        try {
            await processPurchaseRequest(requestId, accept);
            showToast.success(`Request ${accept ? 'accepted' : 'rejected'} successfully`);
        } catch (error) {
            showToast.error(error.message || 'Failed to process request');
        }
    };

    const handleMakePayment = async (requestId, options) => {
        try {
            await makePayment(requestId, options);

            // Get updated volume after payment
            const currentYear = Math.floor(Date.now() / (365 * 24 * 60 * 60 * 1000));
            const newVolume = await handleContractCall(
                'transactionRegistry',
                'getTotalVolume',
                [currentYear],
                { isView: true }
            );

            logger.debug('Updated transaction volume:', {
                year: currentYear,
                volume: ethers.formatEther(newVolume)
            });

            showToast.success('Payment completed successfully!');
        } catch (error) {
            showToast.error(error.message || 'Payment failed');
        }
    };

    const handleCancelRequest = async (requestId) => {
        try {
            await cancelPurchaseRequest(requestId);
            showToast.success('Request cancelled successfully');
        } catch (error) {
            showToast.error(error.message || 'Failed to cancel request');
        }
    };

    // Add event listener for market updates
    useEffect(() => {
        const handleMarketUpdate = (event) => {
            const { averagePrice, totalVolume } = event.detail;
            logger.debug('Market metrics updated:', {
                averagePrice: ethers.formatEther(averagePrice),
                totalVolume: ethers.formatEther(totalVolume)
            });
        };

        window.addEventListener('contract:MarketMetricsUpdated', handleMarketUpdate);
        return () => {
            window.removeEventListener('contract:MarketMetricsUpdated', handleMarketUpdate);
        };
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <ProcessingProvider>
            <div style={requestStyles.mainContainer}>
                {!preview && (
                    <>
                        <div style={requestStyles.header}>
                            <h1 style={{ margin: 0 }}>Transaction Requests</h1>
                        </div>
                        <div style={requestStyles.tabContainer}>
                            <button
                                onClick={() => setActiveTab('incoming')}
                                style={requestStyles.tab(activeTab === 'incoming')}>
                                📥 Received Requests
                            </button>
                            <button
                                onClick={() => setActiveTab('outgoing')}
                                style={requestStyles.tab(activeTab === 'outgoing')}>
                                📤 Sent Requests
                            </button>
                        </div>
                    </>
                )}

                <div>
                    {requests.length > 0 ? (
                        requests.map(request => (
                            <RequestCard
                                key={`${request.requestId}`}
                                request={request}
                                type={activeTab}
                                onProcess={handleProcessRequest}
                                onMakePayment={handleMakePayment}
                                onCancel={handleCancelRequest}
                            />
                        ))
                    ) : (
                        <div style={requestStyles.emptyState}>
                            <span style={requestStyles.emptyStateIcon}>📬</span>
                            <h3>No {activeTab} requests found</h3>
                            <p>You have no {activeTab === 'incoming' ? 'received' : 'sent'} requests at the moment</p>
                        </div>
                    )}
                </div>
            </div>
        </ProcessingProvider>
    );
};

export default LandRequests;
