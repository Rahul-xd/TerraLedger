import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAuth } from '../../../core/context/AuthContext';
import { showToast } from '../../../utils/toast';
import createLogger from '../../../utils/logger';
import { sharedStyles, colors } from '../../../styles/sharedPage';
import LoadingSpinner from '../../common/LoadingSpinner';
import { REQUEST_STATUS } from '../../../core/config'; // Add this import at the top

const logger = createLogger('WithdrawFunds');

const withdrawStyles = {
    container: {
        ...sharedStyles.mainWrapper,
        maxWidth: '600px',
        margin: '2rem auto',
        padding: '2rem',
    },
    card: {
        background: colors.background.paper,
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    balance: {
        fontSize: '2rem',
        fontWeight: '600',
        color: colors.primary.main,
        textAlign: 'center',
        margin: '1rem 0',
    },
    button: {
        ...sharedStyles.button,
        width: '100%',
        marginTop: '1rem',
        padding: '1rem',
        fontSize: '1.1rem',
    },
    withdrawalHistory: {
        marginTop: '2rem',
        padding: '1rem',
        background: colors.background.light,
        borderRadius: '8px',
    },
    historyItem: {
        padding: '1rem',
        borderBottom: `1px solid ${colors.border.light}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
};

const WithdrawFunds = () => {
    const { handleContractCall, authState: { currentUser } } = useAuth();
    const [pendingAmount, setPendingAmount] = useState('0');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [withdrawalHistory, setWithdrawalHistory] = useState([]);

    const checkPendingWithdrawal = async () => {
        try {
            // 1. Get all requests
            const requests = await handleContractCall(
                'transactionRegistry',
                'getUserPurchaseRequests',
                [currentUser.address],
                { isView: true }
            );

            // 2. Filter COMPLETED sales where current user was seller
            const completedSales = requests.filter(req =>
                req.seller?.toLowerCase() === currentUser.address?.toLowerCase() &&
                Number(req.status) === REQUEST_STATUS.COMPLETED // Convert BigInt status to number
            );

            logger.debug('Found completed sales:', completedSales);

            // 3. Get land details for completed sales
            const enhancedSales = await Promise.all(
                completedSales.map(async (sale) => {
                    const landDetails = await handleContractCall(
                        'landRegistry',
                        'getLandDetails',
                        [sale.landId],
                        { isView: true }
                    );

                    return {
                        requestId: sale.requestId,
                        landId: sale.landId,
                        price: landDetails.price,
                        timestamp: Date.now(),
                        location: landDetails.location,
                        buyer: sale.buyer
                    };
                })
            );

            // 4. Get pending withdrawals
            const pendingAmount = await handleContractCall(
                'transactionRegistry',
                'pendingWithdrawals',
                [currentUser.address],
                { isView: true }
            );

            logger.debug('Withdrawal state:', {
                completedSales: enhancedSales,
                pendingAmount: ethers.formatEther(pendingAmount)
            });

            setPendingAmount(pendingAmount.toString());
            setWithdrawalHistory(enhancedSales);

        } catch (error) {
            logger.error('Failed to check withdrawal:', error);
            showToast.error('Failed to load withdrawal info');
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (currentUser?.address) {
            checkPendingWithdrawal();
        }
    }, [currentUser]);

    const handleWithdraw = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const tx = await handleContractCall(
                'transactionRegistry',
                'withdraw',
                []
            );
            await tx.wait();

            showToast.success('Funds withdrawn successfully!');
            await checkPendingWithdrawal();
        } catch (error) {
            logger.error('Withdrawal failed:', error);
            showToast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const events = [
            'PaymentReceived',
            'WithdrawalCompleted',
            'LandOwnershipTransferred'
        ];

        const handleEvent = () => {
            checkPendingWithdrawal();
        };

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, []);

    if (checking) {
        return <LoadingSpinner message="Checking available funds..." />;
    }

    return (
        <div style={withdrawStyles.container}>
            <div style={withdrawStyles.card}>
                <h2 style={sharedStyles.title}>Available Funds</h2>

                <div style={withdrawStyles.balance}>
                    {ethers.formatEther(pendingAmount)} ETH
                </div>

                {pendingAmount !== '0' && (
                    <button
                        onClick={handleWithdraw}
                        disabled={loading}
                        style={{
                            ...withdrawStyles.button,
                            opacity: loading ? 0.7 : 1,
                            background: colors.success.gradient,
                        }}>
                        {loading ? '⌛ Withdrawing...' : '💰 Withdraw Funds'}
                    </button>
                )}

                {pendingAmount === '0' && (
                    <p style={{
                        textAlign: 'center',
                        color: colors.text.secondary,
                        marginTop: '1rem'
                    }}>
                        No funds available for withdrawal
                    </p>
                )}
            </div>

            <div style={withdrawStyles.withdrawalHistory}>
                <h3 style={sharedStyles.subtitle}>Completed Sales</h3>
                {withdrawalHistory.length > 0 ? (
                    withdrawalHistory.map((sale) => (
                        <div key={sale.requestId} style={withdrawStyles.historyItem}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span>Land #{sale.landId} - {sale.location}</span>
                                <span style={{ fontSize: '0.9rem', color: colors.text.secondary }}>
                                    Buyer: {sale.buyer}
                                </span>
                            </div>
                            <span style={{ fontWeight: 'bold', color: colors.success.main }}>
                                {ethers.formatEther(sale.price)} ETH
                            </span>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', padding: '1rem' }}>
                        No completed sales yet
                    </p>
                )}
            </div>
        </div>
    );
};

export default WithdrawFunds;
