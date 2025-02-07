import React from 'react';
import { useAuth } from '../../core/context/AuthContext';

const AdminDashboard = () => {
    const { currentUser } = useAuth();

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, Owner {currentUser?.address}</p>
            {/* Add admin functionality here:
                - Assign/Remove inspectors
                - View system statistics
                - Manage contract settings
            */}
        </div>
    );
};

export default AdminDashboard;
