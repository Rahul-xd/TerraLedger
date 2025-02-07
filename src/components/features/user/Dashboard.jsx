import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useUser } from '../../../core/hooks/useUser';
import { useAuth } from '../../../core/context/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorBoundary from '../../common/ErrorBoundary';
import { getRoleName } from '../../../core/hooks/useRoles';
import MyLands from '../lands/MyLands';
import LandRequests from '../transactions/LandRequests';
import createLogger from '../../../utils/logger';
import { showToast } from '../../../utils/toast';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const logger = createLogger('Dashboard');

// Modern, clean styles with better visual hierarchy
const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        background: '#f8fafc',
        minHeight: '100vh'
    },
    header: {
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        borderRadius: '24px',
        padding: '3rem',
        marginBottom: '2rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)'
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
        zIndex: 1
    },
    headerContent: {
        position: 'relative',
        zIndex: 2
    },
    welcomeText: {
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        fontWeight: '800',
        marginBottom: '1rem',
        lineHeight: 1.2,
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    roleBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.5rem 1.25rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '9999px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        fontSize: '0.875rem',
        color: 'white',
        fontWeight: '500'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    },
    statsCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s ease',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)'
        }
    },
    statHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statTitle: {
        fontSize: '0.875rem',
        color: '#64748b',
        fontWeight: '500'
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#1e293b',
        lineHeight: 1
    },
    activitySection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
    },
    activityCard: {
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column'
    },
    activityHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(to right, #2563eb, #3b82f6)',
        color: 'white'
    },
    activityTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    activityContent: {
        padding: '1.5rem',
        flex: 1,
        minHeight: '300px',
        maxHeight: '400px',
        overflowY: 'auto'
    },
    activityFooter: {
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc'
    },
    viewAllButton: {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: '1px solid #2563eb',
        color: '#2563eb',
        background: 'white',
        fontSize: '0.875rem',
        fontWeight: '500',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
        '&:hover': {
            background: '#f8fafc',
            transform: 'translateY(-1px)'
        }
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: '#6b7280',
        gap: '1rem'
    },
    emptyStateIcon: {
        fontSize: '3rem',
        color: '#9ca3af'
    },
    emptyStateText: {
        fontSize: '0.875rem',
        maxWidth: '250px',
        lineHeight: '1.5'
    },
    metricsSection: {
        marginBottom: '2rem',
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0'
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
    },
    metricItem: {
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '12px',
        textAlign: 'center'
    },
    metricValue: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '0.5rem'
    },
    metricLabel: {
        fontSize: '0.875rem',
        color: '#64748b'
    },
    quickActions: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
    },
    actionButton: {
        padding: '1rem',
        borderRadius: '12px',
        border: 'none',
        background: '#2563eb',
        color: 'white',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: '#1d4ed8',
            transform: 'translateY(-2px)'
        }
    },
    verificationStatus: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500'
    }
};

// Add hover styles to interactive elements
const interactiveStyles = {
    statsCard: {
        ...styles.statsCard,
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
            background: '#f8fafc'
        }
    }
};

const StatsCard = ({ title, value, icon, to }) => (
    <Link to={to} style={{ ...interactiveStyles.statsCard, textDecoration: 'none' }}>
        <div style={styles.statHeader}>
            <span style={styles.statTitle}>{title}</span>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        </div>
        <span style={styles.statValue}>
            {value ?? 0}
        </span>
    </Link>
);

const MarketMetrics = ({ metrics }) => (
    <div style={styles.metricsSection}>
        <h3 style={styles.sectionTitle}>Market Overview</h3>
        <div style={styles.metricsGrid}>
            <div style={styles.metricItem}>
                <div style={styles.metricValue}>{metrics.averagePrice} ETH</div>
                <div style={styles.metricLabel}>Average Property Price</div>
            </div>
            <div style={styles.metricItem}>
                <div style={styles.metricValue}>{metrics.totalVolume} ETH</div>
                <div style={styles.metricLabel}>Total Transaction Volume</div>
            </div>
            <div style={styles.metricItem}>
                <div style={styles.metricValue}>{metrics.totalTransactions}</div>
                <div style={styles.metricLabel}>Total Requests</div>
            </div>
        </div>
    </div>
);

const QuickActions = ({ onAction }) => (
    <div style={styles.quickActions}>
        <button
            onClick={() => onAction('addProperty')}
            style={styles.actionButton}
        >
            <span>➕</span> Add Property
        </button>
        <button
            onClick={() => onAction('viewMarket')}
            style={styles.actionButton}
        >
            <span>🏠</span> View Market
        </button>
        <button
            onClick={() => onAction('checkRequests')}
            style={styles.actionButton}
        >
            <span>📋</span> Check Requests
        </button>
    </div>
);

const Dashboard = () => {
    const {
        authState: { currentUser, isReady, contractsInitialized },
        handleContractCall // Add this
    } = useAuth();

    const {
        stats,
        fetchUserStats,
        lands,
        fetchLands,
        loading,
        setLoading
    } = useUser();

    const navigate = useNavigate();

    const [marketMetrics, setMarketMetrics] = useState({
        averagePrice: 0,
        totalVolume: 0,
        totalTransactions: 0
    });

    // Update loadMarketMetrics with correct method names and error handling
    const loadMarketMetrics = useCallback(async () => {
        try {
            const currentYear = Math.floor(Date.now() / (365 * 24 * 60 * 60 * 1000));

            // Use the correct method names from your contract
            const [avgPrice, volume, txCount] = await Promise.all([
                handleContractCall('transactionRegistry', 'calculateAveragePrice', [], { isView: true }),
                handleContractCall('transactionRegistry', 'getTotalVolume', [currentYear], { isView: true }),
                handleContractCall('transactionRegistry', 'getTransactionCount', [], { isView: true })
            ]);

            setMarketMetrics({
                averagePrice: ethers.formatEther(avgPrice || '0'),
                totalVolume: ethers.formatEther(volume || '0'),
                totalTransactions: txCount?.toString() || '0'
            });
        } catch (error) {
            logger.error('Failed to load market metrics:', error);
            setMarketMetrics({
                averagePrice: '0',
                totalVolume: '0',
                totalTransactions: '0'
            });
        }
    }, [handleContractCall]);

    // Unified data loading with loading state
    const loadDashboardData = useCallback(async () => {
        if (!contractsInitialized) return;

        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Loading dashboard data`);

        try {
            setLoading(true);
            const [statsResult, landsResult] = await Promise.all([
                fetchUserStats(),
                fetchLands(0, 3),
                loadMarketMetrics()
            ]);

            logger.debug(`[${correlationId}] Dashboard data loaded:`, {
                stats: statsResult,
                lands: landsResult?.lands?.length
            });

            if (!statsResult || !landsResult) {
                throw new Error('Failed to fetch dashboard data');
            }
        } catch (error) {
            logger.error(`[${correlationId}] Dashboard load failed:`, error);
            showToast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [contractsInitialized, fetchUserStats, fetchLands, setLoading, loadMarketMetrics]);

    // Initial load
    useEffect(() => {
        if (isReady && contractsInitialized && currentUser) {
            loadDashboardData();
        }
    }, [isReady, contractsInitialized, currentUser?.address]);

    // Event listeners
    useEffect(() => {
        const CONTRACT_EVENTS = [
            'PurchaseRequestCreated',
            'PurchaseRequestStatusChanged',
            'LandOwnershipTransferred',
            'LandUpdated'
        ];

        const handleEvent = (event) => {
            logger.debug(`Contract event received: ${event.type}`);
            loadDashboardData();
        };

        CONTRACT_EVENTS.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            CONTRACT_EVENTS.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [loadDashboardData]);

    // Add detailed stats
    const enhancedStats = useMemo(() => ({
        ...stats,
        totalLands: stats.totalLands || 0,
        incomingRequests: stats.incomingRequests || 0,
        outgoingRequests: stats.outgoingRequests || 0
    }), [stats]);

    // Add debug logging for stats
    useEffect(() => {
        logger.debug('Dashboard stats updated:', {
            stats,
            enhanced: enhancedStats
        });
    }, [stats, enhancedStats]);

    // Add stats debug effect
    useEffect(() => {
        logger.debug('Dashboard stats update:', {
            raw: stats,
            enhanced: enhancedStats,
            timestamp: Date.now()
        });

        // Verify stats are valid numbers
        Object.entries(enhancedStats).forEach(([key, value]) => {
            if (key !== 'lastRefresh' && (typeof value !== 'number' || isNaN(value))) {
                logger.warn(`Invalid stat value for ${key}:`, value);
            }
        });
    }, [stats, enhancedStats]);

    // Add debug logging for stats
    useEffect(() => {
        logger.debug('Dashboard stats detail:', {
            total: stats.totalLands,
            pending: stats.pendingRequests,
            incoming: stats.incomingRequests,
            outgoing: stats.outgoingRequests,
            rawStats: stats
        });
    }, [stats]);

    // Update handleQuickAction with correct routes
    const handleQuickAction = useCallback((action) => {
        switch (action) {
            case 'addProperty':
                navigate('/lands/my-lands'); // Update to match your route
                break;
            case 'viewMarket':
                navigate('/lands/market'); // Update to match your route
                break;
            case 'checkRequests':
                navigate('/transactions/requests');
                break;
            default:
                break;
        }
    }, [navigate]);

    if (!isReady || !contractsInitialized || loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    const statsCards = [
        {
            title: "Your Properties",
            value: enhancedStats.totalLands,
            icon: "🏠",
            to: "/lands/my-lands"
        },
        {
            title: "Requests Received",
            value: enhancedStats.incomingRequests,
            icon: "📥",
            to: "/transactions/requests?type=incoming"
        },
        {
            title: "Requests Sent",
            value: enhancedStats.outgoingRequests,
            icon: "📤",
            to: "/transactions/requests?type=outgoing"
        }
    ];

    return (
        <div style={styles.container}>
            <ErrorBoundary>
                <div style={styles.header}>
                    <div style={styles.headerBackground} />
                    <div style={styles.headerContent}>
                        <h1 style={styles.welcomeText}>
                            Welcome back, {currentUser.name}
                        </h1>
                        <span style={styles.roleBadge}>
                            {getRoleName(currentUser)}
                        </span>
                    </div>
                </div>

                <QuickActions onAction={handleQuickAction} />

                <MarketMetrics metrics={marketMetrics} />

                <div style={styles.statsGrid}>
                    {statsCards.map(card => (
                        <StatsCard
                            key={card.title}
                            {...card}
                        />
                    ))}
                </div>

                <div style={styles.activitySection}>
                    <div style={styles.activityCard}>
                        <div style={styles.activityHeader}>
                            <h3 style={styles.activityTitle}>
                                <span>🏡</span> Recent Properties
                            </h3>
                        </div>
                        <div style={styles.activityContent}>
                            <MyLands preview={true} limit={3} />
                        </div>
                        <div style={styles.activityFooter}>
                            <Link to="/lands/my-lands" style={styles.viewAllButton}>
                                <span>View All Properties</span>
                                <span>→</span>
                            </Link>
                        </div>
                    </div>

                    <div style={styles.activityCard}>
                        <div style={styles.activityHeader}>
                            <h3 style={styles.activityTitle}>
                                <span>📋</span> Recent Requests
                            </h3>
                        </div>
                        <div style={styles.activityContent}>
                            {stats.pendingRequests > 0 ? (
                                <LandRequests preview={true} limit={3} />
                            ) : (
                                <div style={styles.emptyState}>
                                    <span style={styles.emptyStateIcon}>📭</span>
                                    <div>
                                        <p style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                            No Recent Requests
                                        </p>
                                        <p style={styles.emptyStateText}>
                                            When you make or receive purchase requests, they will appear here
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={styles.activityFooter}>
                            <Link to="/transactions/requests" style={styles.viewAllButton}>
                                <span>View All Requests</span>
                                <span>→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </div>
    );
};

export default Dashboard;
