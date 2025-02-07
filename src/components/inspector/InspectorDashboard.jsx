import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInspector } from '../../core/hooks/useInspector';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaUserCheck, FaHome, FaGavel } from 'react-icons/fa';
import dashboardStyles from '../../styles/dashboardStyles';
import { showToast } from '../../utils/toast';
import createLogger from '../../utils/logger';

const logger = createLogger('InspectorDashboard');

const InspectorDashboard = () => {
    const { isInspectorReady, inspectorData, updateInspectorData } = useInspector();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add refresh handler with loading state and error handling
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await updateInspectorData();
            showToast.success('Dashboard updated');
        } catch (error) {
            logger.error('Dashboard refresh failed:', error);
            showToast.error('Failed to update dashboard');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Add event listeners for real-time updates
    useEffect(() => {
        const events = [
            'UserRegistered',
            'UserVerified',
            'UserRejected',
            'LandAdded',
            'LandVerified',
            'DisputeOpened',
            'DisputeClosed'
        ];

        const handleEvent = () => {
            logger.debug('Contract event received, updating dashboard');
            handleRefresh();
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => events.forEach(event => {
            window.removeEventListener(`contract:${event}`, handleEvent);
        });
    }, []);

    useEffect(() => {
        updateInspectorData();
    }, [updateInspectorData]);

    useEffect(() => {
        const interval = setInterval(updateInspectorData, 30000);
        return () => clearInterval(interval);
    }, [updateInspectorData]);

    if (!isInspectorReady) {
        return <LoadingSpinner message="Preparing inspector dashboard..." />;
    }

    const dashboardCards = [
        {
            title: 'Pending Verifications',
            count: inspectorData.pendingVerifications || 0,
            icon: <FaUserCheck />,
            link: '/inspector/verify-users',
            description: 'User verification requests awaiting approval'
        },
        {
            title: 'Property Verifications',
            count: inspectorData.pendingLands || 0,
            icon: <FaHome />,
            link: '/inspector/verify-lands',
            description: 'Land registration requests pending review'
        },
        {
            title: 'Active Disputes',
            count: inspectorData.openDisputes || 0,
            icon: <FaGavel />,
            link: '/inspector/resolve-disputes',
            description: 'Ongoing property disputes requiring resolution'
        }
    ];

    return (
        <div style={dashboardStyles.container}>
            <div style={dashboardStyles.heroCard}>
                <div style={dashboardStyles.userProfile}>
                    <h1 style={dashboardStyles.userName}>Land Inspector Portal</h1>
                    <span style={dashboardStyles.lastUpdate}>
                        Last updated: {inspectorData.lastRefresh ?
                            new Date(inspectorData.lastRefresh).toLocaleTimeString() :
                            'Never'}
                    </span>
                </div>
            </div>

            <div style={dashboardStyles.statsGrid}>
                {dashboardCards.map((card) => (
                    <Link
                        key={card.title}
                        to={card.link}
                        style={{ textDecoration: 'none' }}
                    >
                        <div style={dashboardStyles.statCard}>
                            <div style={dashboardStyles.statHeader}>
                                <span style={{
                                    ...dashboardStyles.statTitle,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {card.icon}
                                    {card.title}
                                </span>
                            </div>
                            <span style={dashboardStyles.statValue}>
                                {card.count}
                            </span>
                            <p style={dashboardStyles.statDescription}>
                                {card.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            <div style={dashboardStyles.actionsContainer}>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                        ...dashboardStyles.refreshButton,
                        opacity: isRefreshing ? 0.7 : 1
                    }}
                >
                    {isRefreshing ? '⌛ Updating...' : '🔄 Refresh Dashboard'}
                </button>

                <div style={dashboardStyles.quickLinks}>
                    <Link to="/inspector/verify-users" style={dashboardStyles.quickLink}>
                        Review User Verifications
                    </Link>
                    <Link to="/inspector/verify-lands" style={dashboardStyles.quickLink}>
                        Review Land Registrations
                    </Link>
                    <Link to="/inspector/disputes" style={dashboardStyles.quickLink}>
                        Manage Disputes
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default InspectorDashboard;