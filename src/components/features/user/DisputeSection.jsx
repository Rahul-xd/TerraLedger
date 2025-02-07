import React from 'react';
import { useUser } from '../../../core/hooks/useUser';
import LoadingSpinner from '../../common/LoadingSpinner';
import { commonStyles } from '../../../styles/common';

const DisputeSection = () => {
    const { disputes = [], loading, error } = useUser();

    if (loading) return <LoadingSpinner message="Loading disputes..." />;
    if (error) return <div style={commonStyles.errorText}>{error}</div>;

    return (
        <div style={commonStyles.section}>
            <h3>Recent Disputes ({disputes.length})</h3>
            {disputes.length === 0 ? (
                <p>No active disputes found.</p>
            ) : (
                <ul>
                    {disputes.map(dispute => (
                        <li key={dispute.disputeId}>
                            {/* Add dispute details here */}
                            <p>Dispute ID: {dispute.disputeId}</p>
                            <p>Status: {dispute.resolved ? 'Resolved' : 'Active'}</p>
                            <p>Reason: {dispute.reason}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DisputeSection;
