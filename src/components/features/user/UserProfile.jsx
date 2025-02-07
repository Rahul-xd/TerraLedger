import React, { useState, useEffect } from 'react';
import { getContracts } from '../../../services/contractService';
import useWeb3 from '../../../core/hooks/useWeb3';

const UserProfile = () => {
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { account } = useWeb3();

    useEffect(() => {
        if (account) {
            loadUserDetails();
        }
    }, [account]);

    const loadUserDetails = async () => {
        try {
            const { userRegistry } = await getContracts();
            const [user, status] = await Promise.all([
                userRegistry.users(account),
                userRegistry.getVerificationStatus(account)
            ]);
            setUserDetails({ ...user, verificationStatus: status });
        } catch (error) {
            console.error('Error loading user details:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading profile...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!userDetails) return <div>No profile found</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>User Profile</h2>

            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ fontWeight: 'bold' }}>Name:</label>
                        <p>{userDetails.name}</p>
                    </div>
                    <div>
                        <label style={{ fontWeight: 'bold' }}>Age:</label>
                        <p>{userDetails.age.toString()}</p>
                    </div>
                    <div>
                        <label style={{ fontWeight: 'bold' }}>City:</label>
                        <p>{userDetails.city}</p>
                    </div>
                    <div>
                        <label style={{ fontWeight: 'bold' }}>Email:</label>
                        <p>{userDetails.email}</p>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Verification Status</h3>
                    <div style={{
                        display: 'inline-block',
                        padding: '5px 10px',
                        borderRadius: '15px',
                        backgroundColor: userDetails.verificationStatus?.isVerified ? '#e6ffe6' : '#fff3e6',
                        color: userDetails.verificationStatus?.isVerified ? '#006600' : '#cc7700'
                    }}>
                        {userDetails.verificationStatus?.isVerified ? 'Verified' : 'Pending'}
                    </div>

                    {userDetails.verificationStatus?.isVerified && (
                        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                            Verified on: {new Date(userDetails.verificationStatus.verificationTimestamp * 1000).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
