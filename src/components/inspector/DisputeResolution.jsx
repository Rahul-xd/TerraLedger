import React, { useState, useEffect } from 'react';
import { getContracts } from '../../services/contractService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { theme } from '../../styles/theme';
import { commonStyles } from '../../styles/common';
import createLogger from '../../utils/logger';
import Button from '../common/Button';
import { showToast, dismissToasts } from '../../utils/toast';

const logger = createLogger('DisputeResolution');

const DisputeResolution = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDisputesCount, setOpenDisputesCount] = useState(0);

    const styles = {
        container: {
            padding: theme.spacing.lg,
            maxWidth: '1200px',
            margin: '0 auto'
        },
        disputeCard: {
            ...commonStyles.card,
            marginBottom: theme.spacing.md
        },
        button: {
            ...commonStyles.button,
            marginRight: theme.spacing.sm
        }
    };

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        try {
            setLoading(true);
            const { disputeRegistry, landRegistry } = getContracts();

            // First get the total lands
            const totalLands = await landRegistry.getTotalLands();
            const disputes = [];

            // Get open disputes count
            const openCount = await disputeRegistry.getOpenDisputes();
            setOpenDisputesCount(Number(openCount));

            // For each land, get its disputes
            for (let landId = 1; landId <= totalLands; landId++) {
                try {
                    // Get disputes in batches of 10
                    const landDisputes = await disputeRegistry.getLandDisputes(landId, 0, 10);
                    // Filter only unresolved disputes
                    const openDisputes = landDisputes.filter(d => !d.resolved).map(d => ({
                        ...d,
                        landId
                    }));
                    disputes.push(...openDisputes);
                } catch (err) {
                    logger.warn(`Error loading disputes for land ${landId}:`, err);
                }
            }

            setDisputes(disputes);

        } catch (error) {
            logger.error('Error loading disputes:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (landId, disputeId, resolution) => {
        dismissToasts();
        const pendingToast = showToast.transaction.pending('Resolving dispute...');
        try {
            setLoading(true);
            const { disputeRegistry } = getContracts();

            // The contract expects landId, disputeId, and resolution string
            await disputeRegistry.resolveDispute(
                landId,
                disputeId,
                resolution ? "Resolved in favor of complainant" : "Dispute rejected"
            );

            await loadDisputes();
            showToast.transaction.success('Dispute resolved successfully');
        } catch (error) {
            logger.error('Error resolving dispute:', error);
            setError(error.message);
            showToast.transaction.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div style={styles.container}>
            <h1>Dispute Resolution</h1>
            <p>Total Open Disputes: {openDisputesCount}</p>

            {disputes.length === 0 ? (
                <p>No open disputes found</p>
            ) : (
                disputes.map(dispute => (
                    <div key={`${dispute.landId}-${dispute.disputeId}`} style={styles.disputeCard}>
                        <h3>Dispute ID: {dispute.disputeId.toString()}</h3>
                        <p>Land ID: {dispute.landId.toString()}</p>
                        <p>Complainant: {dispute.complainant}</p>
                        <p>Reason: {dispute.reason}</p>
                        <p>Category: {['Ownership', 'Boundary', 'Documentation', 'Other'][dispute.category]}</p>
                        <p>Filed: {new Date(Number(dispute.timestamp) * 1000).toLocaleString()}</p>
                        <Button
                            variant="primary"
                            onClick={() => handleResolve(dispute.landId, dispute.disputeId, true)}
                        >
                            Resolve in Favor
                        </Button>
                        <Button
                            variant="error"
                            onClick={() => handleResolve(dispute.landId, dispute.disputeId, false)}
                        >
                            Reject Dispute
                        </Button>
                    </div>
                ))
            )}
        </div>
    );
};

export default DisputeResolution;
