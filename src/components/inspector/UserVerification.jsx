import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useInspector } from '../../core/hooks/useInspector';
import { useAuth } from '../../core/context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import createLogger from '../../utils/logger';
import { showToast, dismissToasts } from '../../utils/toast';
import { getIpfsUrl } from '../../utils/ipfsUtils';
import { motion } from 'framer-motion';

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: '100vh'
    },
    header: {
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: '2rem',
        fontWeight: '600'
    },
    userCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem',
        marginBottom: '1.5rem'
    },
    section: {
        background: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    sectionTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '1rem'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem'
    },
    infoItem: {
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    label: {
        color: '#4B5563', // Slightly darker gray for better contrast
        fontSize: '0.875rem',
        marginBottom: '0.5rem',
        marginRight: '0.5rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
    },
    value: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#111827', // Near black for better readability
        display: 'block', // Make value appear on new line
        marginTop: '0.25rem',
        lineHeight: '1.5'
    },
    address: {
        background: '#f3f4f6',
        padding: '0.75rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontFamily: 'monospace',
        marginTop: '1rem',
        wordBreak: 'break-all'
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem',
        justifyContent: 'flex-end'
    },
    button: {
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    verifyButton: {
        background: '#059669',
        color: 'white',
        '&:hover': { background: '#047857' }
    },
    rejectButton: {
        background: '#dc2626',
        color: 'white',
        '&:hover': { background: '#b91c1c' }
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
    },
    modalContent: {
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px'
    },
    textarea: {
        width: '100%',
        minHeight: '120px',
        padding: '0.75rem',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        marginTop: '1rem',
        fontSize: '0.875rem'
    },
    documentButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        marginTop: '1rem',
        color: '#374151',
        '&:hover': { background: '#e5e7eb' }
    },
    error: {
        padding: '1rem',
        margin: '1rem 0',
        borderRadius: '8px',
        background: '#fee2e2',
        color: '#dc2626'
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        marginBottom: '1rem'
    },
    modalDescription: {
        color: '#6b7280',
        marginBottom: '1.5rem'
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '1.5rem'
    }
};

const colors = {
    primary: {
        main: '#0F4C81',
        dark: '#093660',
        gradient: 'linear-gradient(135deg, #0F4C81, #093660)'
    },
    secondary: {
        main: '#2C3E50',
        dark: '#1A2639',
        gradient: 'linear-gradient(135deg, #2C3E50, #1A2639)'
    },
    success: {
        main: '#059669',
        dark: '#047857',
        gradient: 'linear-gradient(135deg, #059669, #047857)'
    },
    error: {
        main: '#dc2626',
        dark: '#b91c1c',
        gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)'
    },
    text: {
        inverse: '#FFFFFF'
    }
};

const getButtonStyle = (variant) => ({
    ...styles.button,
    background: variant === 'error' ? colors.error.main : colors.secondary.main,
    color: '#FFFFFF',
    '&:hover': {
        background: variant === 'error' ? colors.error.dark : colors.secondary.dark
    }
});

const LoadingAnimation = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.loadingWrapper}
    >
        <LoadingSpinner message="Processing verification..." />
    </motion.div>
);

const UserCard = React.memo(({ user, onVerify, onReject, isVerifying }) => {
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const documentUrl = useMemo(() => getIpfsUrl(user.documentHash), [user.documentHash]);
    const [isDocumentLoading, setIsDocumentLoading] = useState(false);

    const handleDocumentView = useCallback(async () => {
        setIsDocumentLoading(true);
        try {
            window.open(documentUrl, '_blank');
        } catch (error) {
            showToast.error('Failed to load document');
        } finally {
            setIsDocumentLoading(false);
        }
    }, [documentUrl]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.userCard}
        >
            <div style={styles.grid}>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Personal Information</h3>
                    <div style={styles.infoGrid}>
                        {[
                            ['Name', user.name],
                            ['Age', user.age.toString()],
                            ['City', user.city],
                            ['Email', user.email]
                        ].map(([label, value]) => (
                            <div key={label} style={styles.infoItem}>
                                <span style={styles.label}>{label}</span>
                                <span style={styles.value}>{value}</span>
                            </div>
                        ))}
                    </div>
                    <div style={styles.address}>{user.id}</div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Identity Documents</h3>
                    <div style={styles.infoGrid}>
                        {[
                            ['Aadhar', user.aadharNumber],
                            ['PAN', user.panNumber]
                        ].map(([label, value]) => (
                            <div key={label} style={styles.infoItem}>
                                <span style={styles.label}>{label}</span>
                                <span style={styles.value}>{value}</span>
                            </div>
                        ))}
                    </div>
                    {documentUrl && (
                        <button
                            onClick={handleDocumentView}
                            disabled={isDocumentLoading || isVerifying}
                            style={styles.documentButton}
                        >
                            {isDocumentLoading ? '⌛ Loading...' : '📄 View Documents'}
                        </button>
                    )}
                </div>
            </div>

            <div style={styles.actions}>
                <button
                    onClick={() => onVerify(user.id)}
                    disabled={isVerifying}
                    style={{ ...styles.button, ...styles.verifyButton }}>
                    {isVerifying ? '⌛ Verifying...' : '✓ Verify User'}
                </button>
                <button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isVerifying}
                    style={{ ...styles.button, ...styles.rejectButton }}>
                    ✕ Reject User
                </button>
            </div>

            {showRejectDialog && (
                <RejectDialog
                    onConfirm={(reason) => {
                        onReject(user.id, reason);
                        setShowRejectDialog(false);
                    }}
                    onCancel={() => setShowRejectDialog(false)}
                />
            )}

            {isVerifying && <LoadingAnimation />}
        </motion.div>
    );
});

const RejectDialog = React.memo(({ onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef(null);

    const handleConfirm = async () => {
        const trimmedReason = reason.trim();
        if (!trimmedReason || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onConfirm(trimmedReason); // Correctly passes trimmed reason up
        } catch (error) {
            showToast.error('Failed to reject user');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        textareaRef.current?.focus();

        const handleEscape = (e) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter' && e.ctrlKey) handleConfirm();
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onCancel]);

    return (
        <div style={styles.modal} onClick={onCancel}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h3 style={styles.modalTitle}>Reject User Verification</h3>
                <p style={styles.modalDescription}>
                    Please provide a detailed reason for rejection.
                    This will be visible to the user.
                </p>

                <textarea
                    ref={textareaRef}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    style={styles.textarea}
                    disabled={isSubmitting}
                />

                <div style={styles.modalActions}>
                    <button
                        onClick={onCancel}
                        style={getButtonStyle('secondary')}
                        disabled={isSubmitting}>
                        Cancel (Esc)
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isSubmitting}
                        style={getButtonStyle('error')}>
                        {isSubmitting ? 'Rejecting...' : 'Confirm Rejection (Ctrl+Enter)'}
                    </button>
                </div>
            </div>
        </div>
    );
});

const UserVerification = () => {
    const {
        isInspectorReady,
        verifyUser,
        rejectUser,
        getPendingUsers,
        getUserDocuments
    } = useInspector();

    const { handleContractCall } = useAuth();

    const [users, setUsers] = useState([]);
    const [verifyingUser, setVerifyingUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const logger = createLogger('UserVerification');

    const loadPendingUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getPendingUsers();
            setUsers(Array.isArray(result) ? result : []);
        } catch (err) {
            logger.error('Failed to load pending users:', err);
            setError('Failed to load pending users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [getPendingUsers]);

    useEffect(() => {
        loadPendingUsers();
    }, [loadPendingUsers]);

    useEffect(() => {
        const events = ['UserVerified', 'UserRejected'];
        const handleVerification = () => loadPendingUsers();

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleVerification);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleVerification);
            });
        };
    }, [loadPendingUsers]);

    const handleError = useCallback((error) => {
        logger.error('Verification error:', error);
        showToast.error(error.message || 'Verification failed');
        setError(error.message);
        setVerifyingUser(null);
    }, []);

    const [verificationState, setVerificationState] = useState({
        isProcessing: false,
        currentAction: null, // 'verify' or 'reject'
        userId: null
    });

    const handleVerifyUser = useCallback(async (userAddress) => {
        const correlationId = Date.now();
        logger.debug(`[${correlationId}] Starting verification for:`, userAddress);

        setVerificationState({
            isProcessing: true,
            currentAction: 'verify',
            userId: userAddress
        });

        try {
            // 1. First check verification status
            const status = await handleContractCall(
                'userRegistry',
                'getVerificationStatus',
                [userAddress],
                { isView: true }
            );

            if (!status.isRegistered) {
                throw new Error('User not registered');
            }

            // 2. Execute verification
            const result = await verifyUser(userAddress);
            if (!result?.success) {
                throw new Error(result?.error || 'Verification failed');
            }

            // 3. Verify the state change
            const newStatus = await handleContractCall(
                'userRegistry',
                'getVerificationStatus',
                [userAddress],
                { isView: true }
            );

            if (!newStatus.isVerified) {
                throw new Error('Verification state not updated');
            }

            showToast.success('User verified successfully');
            await loadPendingUsers(); // Refresh the list

        } catch (error) {
            logger.error(`[${correlationId}] Verification failed:`, error);
            showToast.error(error.message || 'Verification failed');
        } finally {
            setVerificationState({
                isProcessing: false,
                currentAction: null,
                userId: null
            });
        }
    }, [verifyUser, handleContractCall, loadPendingUsers]);

    const handleRejectUser = useCallback(async (userAddress, reason) => {
        const correlationId = Date.now();
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            showToast.error('Rejection reason is required');
            return;
        }

        setVerificationState({
            isProcessing: true,
            currentAction: 'reject',
            userId: userAddress
        });

        try {
            // 1. Validate current state
            const currentStatus = await handleContractCall(
                'userRegistry',
                'getVerificationStatus',
                [userAddress],
                { isView: true }
            );

            if (!currentStatus.isRegistered) {
                throw new Error('User not registered');
            }

            // 2. Execute rejection
            const result = await rejectUser(userAddress, trimmedReason);
            if (!result?.success) {
                throw new Error(result?.error || 'Rejection failed');
            }

            // 3. Verify rejection was recorded
            const newStatus = await handleContractCall(
                'userRegistry',
                'getVerificationStatus',
                [userAddress],
                { isView: true }
            );

            if (newStatus.remarks.trim() !== trimmedReason) {
                logger.warn(`[${correlationId}] Rejection reason mismatch`, {
                    sent: trimmedReason,
                    stored: newStatus.remarks
                });
            }

            showToast.success('User rejected successfully');
            await loadPendingUsers(); // Refresh the list

        } catch (error) {
            logger.error(`[${correlationId}] Rejection failed:`, error);
            showToast.error(error.message || 'Failed to reject user');
        } finally {
            setVerificationState({
                isProcessing: false,
                currentAction: null,
                userId: null
            });
        }
    }, [rejectUser, handleContractCall, loadPendingUsers]);

    useEffect(() => {
        return () => {
            dismissToasts();
            setVerifyingUser(null);
            setError(null);
        };
    }, []);

    if (!isInspectorReady) {
        return <LoadingSpinner message="Checking inspector status..." />;
    }

    if (loading) {
        return <LoadingSpinner message="Loading pending users..." />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.container}
        >
            <div style={styles.header}>
                <h1 style={styles.title}>User Verification Portal</h1>
                <button
                    onClick={loadPendingUsers}
                    style={{
                        ...styles.button,
                        background: colors.secondary.main,
                        color: '#FFFFFF'
                    }}
                    disabled={loading}>
                    {loading ? '⌛ Refreshing...' : '🔄 Refresh List'}
                </button>
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            <div style={styles.container}>
                {users.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onVerify={handleVerifyUser}
                        onReject={handleRejectUser}
                        isVerifying={verificationState.userId === user.id}
                        currentAction={verificationState.currentAction}
                    />
                ))}

                {users.length === 0 && !loading && (
                    <div style={styles.emptyState}>
                        <span style={{ fontSize: '3rem' }}>👥</span>
                        <h3>No pending verifications</h3>
                        <p>All user verifications are complete</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default React.memo(UserVerification);
