import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import createLogger from '../../utils/logger';
import { theme } from '../../styles/theme';
import { showToast } from '../../utils/toast';
import { getIpfsUrl } from '../../utils/ipfsUtils';
import { sharedStyles } from '../../styles/sharedPage';

const logger = createLogger('PendingVerification');

// Simplified styles - only keep what's needed
const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
    },
    statusCard: {
        background: '#e6f3ff', // Default background
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: `1px solid ${theme.colors.primary.main}`,
        transition: 'all 0.3s ease'
    },
    statusCardRejected: {
        background: '#fee2e2',
        border: `1px solid ${theme.colors.error}`,
    },
    detailsSection: {
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginTop: '2rem'
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem',
        margin: '2rem 0'
    },
    detailItem: {
        background: theme.colors.background.light,
        padding: '1.25rem',
        borderRadius: '8px',
        border: `1px solid ${theme.colors.border.light}`
    },
    label: {
        fontSize: '0.875rem',
        color: theme.colors.text.secondary,
        marginBottom: '0.5rem',
        fontWeight: '500'
    },
    value: {
        fontSize: '1rem',
        color: theme.colors.text.primary,
        fontWeight: '600'
    },
    documentButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '1rem',
        background: theme.colors.primary.light,
        color: theme.colors.primary.main,
        border: `1px solid ${theme.colors.primary.main}20`,
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '1rem',
        fontWeight: '500',
        marginTop: '1rem',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: theme.colors.primary.main,
            color: 'white'
        }
    },
    rejectionDetails: {
        marginTop: '1.5rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        border: `1px solid ${theme.colors.error}40`
    },
    rejectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: theme.colors.error,
        marginBottom: '0.75rem'
    },
    rejectionText: {
        fontSize: '1rem',
        color: theme.colors.error,
        lineHeight: '1.5'
    },
    cooldownText: {
        marginTop: '1rem',
        fontSize: '0.9rem',
        color: theme.colors.text.secondary,
        fontStyle: 'italic'
    }
};

// Update the DetailItem component
const DetailItem = ({ label, value }) => (
    <div style={styles.detailItem}>
        <div style={styles.label}>{label}</div>
        <div style={styles.value}>
            {value && value !== '0' && value !== ''
                ? label.toLowerCase().includes('aadhar')
                    ? value.replace(/(\d{4})/g, '$1 ').trim()
                    : label.toLowerCase().includes('age')
                        ? `${value} years`
                        : value
                : 'Not provided'}
        </div>
    </div>
);

const PendingVerification = () => {
    const { authState, refreshUserStatus, handleContractCall } = useAuth();
    const { currentUser } = authState;
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Update loadUserDetails to retry on failure
    const loadUserDetails = useCallback(async (retryCount = 3) => {
        if (!currentUser?.address) {
            setLoading(false);
            return;
        }

        try {
            const [userData, verificationStatus] = await Promise.all([
                handleContractCall('userRegistry', 'users', [currentUser.address], { isView: true }),
                handleContractCall('userRegistry', 'getVerificationStatus', [currentUser.address], { isView: true })
            ]);

            // Verify we have actual data
            if (!userData || !userData.name) {
                if (retryCount > 0) {
                    // Wait and retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return loadUserDetails(retryCount - 1);
                }
            }

            // Format user data with proper type conversion
            const formattedUserData = {
                name: userData.name || '',
                age: userData.age ? Number(userData.age).toString() : '0',
                city: userData.city || '',
                email: userData.email || '',
                aadharNumber: userData.aadharNumber || '',
                panNumber: userData.panNumber || '',
                documentHash: userData.documentHash || '',
                verificationDetails: {
                    isRegistered: verificationStatus.isRegistered,
                    isVerified: verificationStatus.isVerified,
                    remarks: verificationStatus.remarks || '',
                    timestamp: verificationStatus.verificationTimestamp?.toString()
                }
            };

            logger.debug('Formatted user data:', formattedUserData);
            setUserDetails(formattedUserData);
        } catch (error) {
            if (retryCount > 0) {
                // Wait and retry on error
                await new Promise(resolve => setTimeout(resolve, 1000));
                return loadUserDetails(retryCount - 1);
            }
            logger.error('Error loading user details:', error);
            showToast.error('Failed to load verification status');
        } finally {
            setLoading(false);
        }
    }, [currentUser, handleContractCall]);

    useEffect(() => {
        if (currentUser?.address) {
            loadUserDetails();
        } else {
            setLoading(false);
        }
    }, [currentUser, loadUserDetails]);

    // Add contract event listeners
    useEffect(() => {
        const events = ['UserVerified', 'UserRejected'];
        const handleStatusUpdate = () => refreshUserStatus();

        events.forEach(event =>
            window.addEventListener(`contract:${event}`, handleStatusUpdate)
        );

        return () => events.forEach(event =>
            window.removeEventListener(`contract:${event}`, handleStatusUpdate)
        );
    }, [refreshUserStatus]);

    // Add registration event listener
    useEffect(() => {
        const handleRegistration = async () => {
            await refreshUserStatus();
            await loadUserDetails();
        };

        window.addEventListener('contract:UserRegistered', handleRegistration);

        // Add polling for initial load
        const pollInterval = setInterval(async () => {
            if (!userDetails) {
                await loadUserDetails();
            }
        }, 2000); // Poll every 2 seconds until data is loaded

        return () => {
            window.removeEventListener('contract:UserRegistered', handleRegistration);
            clearInterval(pollInterval);
        };
    }, [refreshUserStatus, loadUserDetails, userDetails]);

    // Early return for no wallet connection
    if (!currentUser) {
        return (
            <div style={styles.container}>
                <h1 style={sharedStyles.pageTitle}>Verification Status</h1>
                <div style={styles.statusCard}>
                    <h2 style={sharedStyles.title}>Please connect your wallet</h2>
                </div>
            </div>
        );
    }

    // Show loading only when actually loading data
    if (loading && !userDetails) {
        return <LoadingSpinner message="Loading verification status..." />;
    }

    const documentUrl = userDetails?.documentHash ? getIpfsUrl(userDetails.documentHash) : null;

    // Update the details rendering
    const renderUserDetails = () => (
        <div style={styles.detailsSection}>
            <h3 style={sharedStyles.subtitle}>User Information</h3>
            <div style={styles.detailsGrid}>
                {[
                    { label: "Full Name", value: userDetails?.name?.trim() },
                    { label: "Age", value: userDetails?.age !== '0' ? userDetails?.age : '' },
                    { label: "City", value: userDetails?.city?.trim() },
                    { label: "Email", value: userDetails?.email?.trim() },
                    { label: "Aadhar Number", value: userDetails?.aadharNumber?.trim() },
                    { label: "PAN Number", value: userDetails?.panNumber?.trim() }
                ].map(({ label, value }) => (
                    <DetailItem
                        key={label}
                        label={label}
                        value={value}
                    />
                ))}
            </div>

            {userDetails?.documentHash && (
                <a href={getIpfsUrl(userDetails.documentHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.documentButton}>
                    📄 View Uploaded Documents
                </a>
            )}
        </div>
    );

    const renderRejectionDetails = () => {
        if (!currentUser.isRejected || !userDetails?.verificationDetails) return null;

        return (
            <div style={styles.rejectionDetails}>
                <h3 style={styles.rejectionTitle}>Verification Rejected</h3>
                <p style={styles.rejectionText}>
                    {userDetails.verificationDetails.remarks ? (
                        <>
                            <strong>Reason:</strong> {userDetails.verificationDetails.remarks}
                        </>
                    ) : (
                        'Verification was rejected'
                    )}
                </p>
                {Number(currentUser.cooldownTime) > 0 && (
                    <p style={styles.cooldownText}>
                        You can reapply in: {Math.ceil(Number(currentUser.cooldownTime) / 3600)} hours
                    </p>
                )}
                {userDetails.verificationDetails.timestamp && (
                    <p style={styles.timestampText}>
                        Rejected on: {new Date(Number(userDetails.verificationDetails.timestamp) * 1000).toLocaleString()}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <h1 style={sharedStyles.pageTitle}>Verification Status</h1>

            <div style={{
                ...styles.statusCard,
                ...(currentUser.isRejected ? styles.statusCardRejected : {})
            }}>
                <h2 style={{
                    ...sharedStyles.title,
                    color: currentUser.isRejected ? theme.colors.error : theme.colors.primary.main
                }}>
                    {currentUser.isRejected ? '❌ Verification Rejected' : '⏳ Pending Verification'}
                </h2>

                {/* Update rejection reason display */}
                {renderRejectionDetails()}
            </div>

            {/* Only show details for pending verification */}
            {userDetails && !currentUser.isRejected && renderUserDetails()}

            {/* Show register button only after cooldown */}
            {currentUser.isRejected && Number(currentUser.cooldownTime) === 0 && (
                <button
                    onClick={() => navigate('/register', { replace: true })}
                    style={{
                        ...sharedStyles.button,
                        marginTop: '2rem',
                        width: '100%'
                    }}>
                    Register Again
                </button>
            )}
        </div>
    );
};

export default PendingVerification;
