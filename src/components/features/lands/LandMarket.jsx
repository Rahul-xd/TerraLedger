import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Fix import
import { useUser } from '../../../core/hooks/useUser';
import { useAuth } from '../../../core/context/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import { ethers } from 'ethers';
import { getIpfsUrl } from '../../../utils/ipfsUtils';
import { showToast } from '../../../utils/toast';
import { REQUEST_STATUS } from '../../../core/config';
import createLogger from '../../../utils/logger';

const logger = createLogger('LandMarket');

// Update color palette for a more modern and professional look
const colors = {
    primary: {
        light: '#4299e1',
        main: '#3182ce',
        dark: '#2c5282',
        contrast: '#ffffff'
    },
    secondary: {
        light: '#edf2f7',
        main: '#a0aec0',
        dark: '#4a5568',
        contrast: '#2d3748'
    },
    success: {
        light: '#9ae6b4',
        main: '#48bb78',
        dark: '#2f855a',
        contrast: '#ffffff'
    },
    error: {
        light: '#feb2b2',
        main: '#f56565',
        dark: '#c53030',
        contrast: '#ffffff'
    },
    warning: {
        light: '#fbd38d',
        main: '#ed8936',
        dark: '#c05621',
        contrast: '#ffffff'
    },
    background: {
        default: '#f7fafc',
        paper: '#ffffff',
        accent: '#edf2f7'
    },
    text: {
        primary: '#2d3748',
        secondary: '#4a5568',
        disabled: '#a0aec0'
    },
    border: '#e2e8f0'
};

// Update styles for better visual hierarchy and spacing
const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1.25rem',
        backgroundColor: colors.background.default,
        minHeight: '100vh'
    },
    header: {
        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
        borderRadius: '0.75rem',
        padding: '1.5rem 2rem',
        marginBottom: '1.5rem',
        color: colors.primary.contrast,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    title: {
        fontSize: '1.875rem',
        fontWeight: '600',
        margin: 0,
        color: colors.primary.contrast
    },
    filterSection: {
        background: colors.background.paper,
        borderRadius: '0.75rem',
        border: `1px solid ${colors.border}`,
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'flex-end'
    },
    filterRow: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'end'
    },
    filterGroup: {
        flex: '1',
        minWidth: '200px',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    },
    filterLabel: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: '0.25rem',
        textTransform: 'uppercase'
    },
    input: {
        width: '100%',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        border: `1px solid ${colors.border}`,
        fontSize: '0.875rem',
        color: colors.text.primary,
        transition: 'all 0.2s',
        outline: 'none',
        '&:focus': {
            borderColor: colors.primary.main,
            boxShadow: `0 0 0 1px ${colors.primary.main}`
        }
    },
    select: {
        width: '100%',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        border: `1px solid ${colors.border}`,
        fontSize: '0.875rem',
        color: colors.text.primary,
        backgroundColor: colors.background.paper,
        cursor: 'pointer',
        outline: 'none',
        '&:focus': {
            borderColor: colors.primary.main,
            boxShadow: `0 0 0 1px ${colors.primary.main}`
        }
    },
    propertyGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr', // Change to single column
        gap: '1.5rem',
        padding: '0.5rem',
        maxWidth: '100%',
        margin: '0 auto'
    },
    propertyCard: {
        background: colors.background.paper,
        borderRadius: '0.75rem',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        '&:hover': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
    },
    mainContent: {
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr', // Two-column layout inside card
        gap: '2rem',
        '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr' // Stack on mobile
        }
    },
    sectionTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: '1rem',
        borderBottom: `2px solid ${colors.primary.main}`,
        paddingBottom: '0.5rem'
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.25rem',
        marginBottom: '1.5rem'
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem'
    },
    label: {
        fontSize: '0.875rem',
        color: colors.text.secondary,
        fontWeight: '500'
    },
    value: {
        fontSize: '1rem',
        color: colors.text.primary,
        fontWeight: '500',
        padding: '0.5rem',
        background: colors.background.accent,
        borderRadius: '0.375rem',
        border: `1px solid ${colors.border}`
    },
    documentSection: {
        marginTop: '1.5rem'
    },
    documentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
    },
    documentCard: {
        padding: '1rem',
        background: colors.background.accent,
        borderRadius: '0.5rem',
        border: `1px solid ${colors.border}`
    },
    documentLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: colors.primary.main,
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: '500',
        '&:hover': {
            color: colors.primary.dark
        }
    },
    priceSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        background: colors.background.accent,
        borderRadius: '0.75rem',
        border: `1px solid ${colors.border}`
    },
    priceTag: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: colors.primary.dark,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'center',
        padding: '1rem',
        background: colors.background.paper,
        borderRadius: '0.5rem',
        border: `1px solid ${colors.border}`
    },
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        background: colors.background.paper,
        color: colors.primary.main,
        border: `1px solid ${colors.primary.main}`,
        marginTop: '1rem'
    },
    actionButton: {
        width: '100%',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: 'none',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: colors.primary.main,
        color: colors.primary.contrast,
        '&:hover': {
            backgroundColor: colors.primary.dark
        },
        '&:disabled': {
            backgroundColor: colors.text.disabled,
            cursor: 'not-allowed'
        }
    },
    filters: {
        background: colors.background.paper,
        borderRadius: '0.75rem',
        border: `1px solid ${colors.border}`,
        padding: '1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
};

// Add price formatting helper
const formatLandPrice = (priceInWei) => {
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

// Add timestamp formatting helper
const formatTimestamp = (timestamp) => {
    try {
        const timestampNum = typeof timestamp === 'bigint' ?
            Number(timestamp.toString()) :
            Number(timestamp);
        return new Date(timestampNum * 1000).toLocaleDateString();
    } catch (error) {
        logger.error('Error formatting timestamp:', error);
        return 'Unknown date';
    }
};

// Update helper function for better request checking
const isLandRequested = (landId, userRequests = []) => {
    if (!userRequests?.length) return false;

    return userRequests.some(req =>
        Number(req.landId) === Number(landId) &&
        (req.status === REQUEST_STATUS.PENDING ||
            req.status === REQUEST_STATUS.ACCEPTED ||
            req.status === REQUEST_STATUS.PAYMENT_DONE)
    );
};

// Update the LandCard component to include metadata documents
const LandCard = ({ land, onPurchaseRequest }) => {
    const { handleContractCall } = useAuth();
    const { currentUser } = useAuth().authState;
    const [requestStatus, setRequestStatus] = useState({
        isRequested: false,
        requestId: null,
        status: null
    });
    const [metadataDocuments, setMetadataDocuments] = useState(null);

    useEffect(() => {
        const checkRequestStatus = async () => {
            try {
                const userRequests = await handleContractCall(
                    'transactionRegistry',
                    'getUserPurchaseRequests',
                    [currentUser.address],
                    { isView: true }
                );

                // Check for any pending request for this land
                const request = userRequests?.find(req =>
                    req?.landId === land.id &&
                    (req?.status === REQUEST_STATUS.PENDING || req?.status === REQUEST_STATUS.ACCEPTED)
                );

                if (request) {
                    setRequestStatus({
                        isRequested: true,
                        requestId: request.requestId,
                        status: request.status
                    });
                }

                logger.debug('Request status check:', {
                    landId: land.id,
                    hasRequest: !!request,
                    status: request?.status
                });

            } catch (error) {
                logger.error('Failed to check request status:', error);
            }
        };

        if (land?.id && currentUser?.address && handleContractCall) {
            checkRequestStatus();
        }
    }, [land?.id, currentUser?.address, handleContractCall]);

    // Check if user has already requested this land
    useEffect(() => {
        const checkRequestStatus = async () => {
            try {
                const requests = await handleContractCall(
                    'transactionRegistry',
                    'getUserPurchaseRequests',
                    [currentUser.address],
                    { isView: true }
                );

                // Find any active request for this land
                const request = requests?.find(req =>
                    req?.landId === land.id &&
                    (req?.status === REQUEST_STATUS.PENDING ||
                        req?.status === REQUEST_STATUS.ACCEPTED)
                );

                if (request) {
                    setRequestStatus({
                        isRequested: true,
                        requestId: request.requestId,
                        status: request.status
                    });
                }
            } catch (error) {
                logger.error('Failed to check request status:', error);
            }
        };

        if (currentUser?.address) {
            checkRequestStatus();
        }
    }, [currentUser?.address, land.id]);

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

    const handlePurchaseRequest = async () => {
        setRequestStatus(prev => ({ ...prev, processing: true }));
        try {
            await onPurchaseRequest(land.id);
            setRequestStatus({ isRequested: true, processing: false });
            showToast.success('Purchase request sent successfully!');
        } catch (error) {
            setRequestStatus(prev => ({ ...prev, processing: false }));
            showToast.error(error.message || 'Failed to send request');
        }
    };

    const statusConfig = {
        requested: {
            style: styles.requestedButton,
            text: '✅ Request Sent',
            badge: { bg: '#dcfce7', color: '#059669' }
        },
        pending: {
            style: styles.pendingButton,
            text: '⏳ Request Pending',
            badge: { bg: '#fef3c7', color: '#d97706' }
        },
        available: {
            style: styles.requestButton,
            text: '🤝 Request to Purchase',
            badge: { bg: '#e0f2fe', color: '#0284c7' }
        }
    };

    const getStatus = () => {
        if (requestStatus.isRequested) {
            return requestStatus.status === REQUEST_STATUS.ACCEPTED ? 'requested' : 'pending';
        }
        return 'available';
    };

    const currentStatus = getStatus();

    // Skip rendering if land is already requested
    if (requestStatus.isRequested) {
        return null;
    }

    return (
        <div style={styles.propertyCard}>
            <div style={styles.mainContent}>
                <div style={styles.detailsContainer}>
                    <h3 style={styles.sectionTitle}>Property Details</h3>
                    <div style={styles.detailsGrid}>
                        {[
                            { label: 'Property ID', value: Number(land.propertyPID) },
                            { label: 'Location', value: land.location },
                            { label: 'Area', value: `${land.area.toLocaleString()} sq ft` },
                            { label: 'Survey Number', value: land.surveyNumber },
                            { label: 'Coordinates', value: land.coordinates }
                        ].map(({ label, value }) => (
                            <div key={label} style={styles.detailItem}>
                                <span style={styles.label}>{label}</span>
                                <span style={styles.value}>{value}</span>
                            </div>
                        ))}
                    </div>

                    <div style={styles.documentSection}>
                        <h3 style={styles.sectionTitle}>Documents</h3>
                        <div style={styles.documentGrid}>
                            {land.documentHash && (
                                <div style={styles.documentCard}>
                                    <a href={getIpfsUrl(land.documentHash)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.documentLink}>
                                        <span>📄</span>
                                        Property Documents
                                    </a>
                                </div>
                            )}
                            {metadataDocuments?.documents?.map((hash, index) => (
                                <div key={index} style={styles.documentCard}>
                                    <a href={getIpfsUrl(hash)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.documentLink}>
                                        <span>📄</span>
                                        {metadataDocuments.descriptions[index]}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={styles.priceSection}>
                    <div style={styles.priceTag}>
                        <span>💰</span>
                        {formatLandPrice(land.price)} ETH
                    </div>

                    <div style={styles.statusBadge}>
                        {currentStatus === 'available' ? '🏠 Available' : statusConfig[currentStatus].text}
                    </div>

                    {currentStatus === 'available' && (
                        <button
                            onClick={handlePurchaseRequest}
                            disabled={requestStatus.processing}
                            style={styles.actionButton}>
                            {requestStatus.processing ? '⌛ Processing...' : '🤝 Request to Purchase'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const LandMarket = ({ preview = false, limit = null }) => {
    const navigate = useNavigate(); // This will now work correctly
    const { authState: { currentUser, isReady, contractsInitialized }, handleContractCall } = useAuth(); // Add handleContractCall to destructuring
    const { getLandsForSale, createPurchaseRequest, fetchUserStats } = useUser(); // Add fetchUserStats

    // Enhanced filters
    const [filters, setFilters] = useState({
        minPrice: '0',
        maxPrice: '1000',
        location: '',
        minArea: '',
        maxArea: '',
        sortBy: 'price',
        sortDirection: 'asc',
        verifiedOnly: true
    });

    const [locations, setLocations] = useState([]);
    const [landsForSale, setLandsForSale] = useState([]);
    const [loading, setLoading] = useState(false);

    // Add state to track requested lands
    const [requestedLands, setRequestedLands] = useState(new Set());

    // Add new function to fetch user's requests
    const fetchUserRequests = useCallback(async () => {
        if (!currentUser?.address || !handleContractCall) return [];

        try {
            const requests = await handleContractCall(
                'transactionRegistry',
                'getUserPurchaseRequests',
                [currentUser.address],
                { isView: true }
            );

            // Create set of requested land IDs
            const requestedIds = new Set(
                requests
                    .filter(req =>
                        req.status === REQUEST_STATUS.PENDING ||
                        req.status === REQUEST_STATUS.ACCEPTED ||
                        req.status === REQUEST_STATUS.PAYMENT_DONE)
                    .map(req => Number(req.landId))
            );

            setRequestedLands(requestedIds);
            return requests;
        } catch (error) {
            logger.error('Failed to fetch user requests:', error);
            return [];
        }
    }, [currentUser?.address, handleContractCall]);

    // Load available locations
    useEffect(() => {
        const loadLocations = async () => {
            try {
                const lands = await handleContractCall(
                    'landRegistry',
                    'getLandsByPage',
                    [0, 1000],
                    { isView: true }
                );

                const uniqueLocations = [...new Set(lands.result.map(land => land.location))];
                setLocations(uniqueLocations.sort());
            } catch (error) {
                logger.error('Failed to load locations:', error);
            }
        };

        if (contractsInitialized) {
            loadLocations();
        }
    }, [contractsInitialized, handleContractCall]);

    // 1. Memoize filter values to prevent unnecessary re-renders
    const filterValues = useMemo(() => ({
        minPriceWei: ethers.parseEther(filters.minPrice || '0'),
        maxPriceWei: ethers.parseEther(filters.maxPrice || '1000'),
        location: filters.location
    }), [filters.minPrice, filters.maxPrice, filters.location]);

    // 2. Create a single function to load all necessary data
    const loadMarketData = useCallback(async () => {
        if (!contractsInitialized || !currentUser?.address) return;

        setLoading(true);
        try {
            // Load data in parallel
            const [landsResult, userRequestsResult] = await Promise.all([
                handleContractCall('landRegistry', 'getLandsForSale', [
                    filterValues.minPriceWei,
                    filterValues.maxPriceWei,
                    filterValues.location
                ], { isView: true }),
                handleContractCall('transactionRegistry', 'getUserPurchaseRequests',
                    [currentUser.address], { isView: true })
            ]);

            // Process lands data
            const requestedIds = new Set(
                userRequestsResult
                    ?.filter(req =>
                        req.status === REQUEST_STATUS.PENDING ||
                        req.status === REQUEST_STATUS.ACCEPTED)
                    ?.map(req => Number(req.landId)) || []
            );

            // Filter and sort lands
            const filteredLands = (landsResult || [])
                .filter(land => {
                    const notRequested = !requestedIds.has(Number(land.id));
                    const notOwnLand = land.owner.toLowerCase() !== currentUser.address.toLowerCase();
                    const meetsAreaFilter = (!filters.minArea || land.area >= Number(filters.minArea)) &&
                        (!filters.maxArea || land.area <= Number(filters.maxArea));
                    return notRequested && notOwnLand && meetsAreaFilter;
                })
                .sort((a, b) => {
                    const aValue = filters.sortBy === 'price' ? Number(a.price) : Number(a.area);
                    const bValue = filters.sortBy === 'price' ? Number(b.price) : Number(b.area);
                    return filters.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                });

            setLandsForSale(preview ? filteredLands.slice(0, limit) : filteredLands);
            setRequestedLands(requestedIds);

        } catch (error) {
            logger.error('Failed to load market data:', error);
            showToast.error('Failed to load properties');
            setLandsForSale([]);
        } finally {
            setLoading(false);
        }
    }, [
        contractsInitialized,
        currentUser?.address,
        filterValues,
        filters.minArea,
        filters.maxArea,
        filters.sortBy,
        filters.sortDirection,
        preview,
        limit,
        handleContractCall
    ]);

    // 3. Use debounced effect for filters
    useEffect(() => {
        const timer = setTimeout(() => {
            loadMarketData();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadMarketData]);

    // 4. Add event listeners for contract events
    useEffect(() => {
        const events = [
            'LandPurchaseRequested',
            'PurchaseRequestStatusChanged',
            'PurchaseRequestCancelled',
            'LandUpdated'
        ];

        const handleEvent = () => {
            loadMarketData();
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [loadMarketData]);

    const handlePurchaseRequest = async (landId) => {
        const correlationId = Date.now();
        logger.info(`[${correlationId}] Starting purchase request flow`, { landId });

        try {
            const landDetails = await handleContractCall(
                'landRegistry',
                'getLandDetails',
                [landId],
                { isView: true }
            );

            const result = await handleContractCall(
                'transactionRegistry',
                'createPurchaseRequest',
                [landId]
            );

            if (!result) {
                throw new Error('Request creation failed');
            }

            await Promise.all([
                fetchUserStats(), // Ensure stats are updated after creating a purchase request
                loadMarketData() // Changed from loadLandsForSale to loadMarketData
            ]);

            navigate('/transactions/requests?type=outgoing');
            showToast.success('Purchase request sent successfully');
        } catch (error) {
            logger.error(`[${correlationId}] Purchase request failed:`, error);
            showToast.error(error.message || 'Failed to create request');
        }
    };

    // Update event listener for purchase request events
    useEffect(() => {
        const events = ['LandPurchaseRequested', 'PurchaseRequestStatusChanged'];

        const handleEvent = () => {
            loadMarketData(); // Changed from loadLandsForSale to loadMarketData
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [loadMarketData]); // Updated dependency

    // Update effect to refresh on purchase request events
    useEffect(() => {
        const events = [
            'LandPurchaseRequested',
            'PurchaseRequestStatusChanged',
            'PurchaseRequestCancelled'
        ];

        const handleEvent = async () => {
            await fetchUserRequests(); // Update requested lands
            await loadMarketData(); // Changed from loadLandsForSale to loadMarketData
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [loadMarketData, fetchUserRequests]); // Updated dependencies

    // Add initial load of user requests
    useEffect(() => {
        if (contractsInitialized && currentUser?.address) {
            fetchUserRequests();
        }
    }, [contractsInitialized, currentUser?.address]);

    if (!isReady || loading) {
        return <LoadingSpinner message="Loading marketplace..." />;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Property Marketplace</h1>
            </div>

            <div style={styles.filters}>
                <div style={styles.filterSection}>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Price (ETH)</label>
                        <div style={styles.filterRow}>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    minPrice: e.target.value
                                }))}
                                style={styles.input}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    maxPrice: e.target.value
                                }))}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Area (sq ft)</label>
                        <div style={styles.filterRow}>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minArea}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    minArea: e.target.value
                                }))}
                                style={styles.input}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxArea}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    maxArea: e.target.value
                                }))}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Location</label>
                        <select
                            value={filters.location}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                location: e.target.value
                            }))}
                            style={styles.select}
                        >
                            <option value="">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Sort By</label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                sortBy: e.target.value
                            }))}
                            style={styles.select}
                        >
                            <option value="price">Price</option>
                            <option value="area">Area</option>
                        </select>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Order</label>
                        <select
                            value={filters.sortDirection}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                sortDirection: e.target.value
                            }))}
                            style={styles.select}
                        >
                            <option value="asc">Low to High</option>
                            <option value="desc">High to Low</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={styles.propertyGrid}>
                {landsForSale.length > 0 ? (
                    landsForSale.map(land => (
                        <LandCard
                            key={land.id}
                            land={land}
                            onPurchaseRequest={handlePurchaseRequest}
                        />
                    ))
                ) : (
                    <div style={styles.noResults}>
                        <span style={{ fontSize: '3rem' }}>🏠</span>
                        <h3>No properties available</h3>
                        <p>There are currently no properties listed for sale</p>
                    </div>
                )}
            </div>
        </div>
    );

};

export default React.memo(LandMarket); // Add memo to prevent unnecessary re-renders
