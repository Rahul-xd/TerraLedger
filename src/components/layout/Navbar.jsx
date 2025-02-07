import React, { useMemo, useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import { getRoleFromUser, ROLES, ROLE_ICONS } from '../../core/hooks/useRoles';
import {
    FaHome, FaUser, FaBuilding, FaStore, FaGavel,
    FaExchangeAlt, FaUserCheck, FaClipboard, FaSignOutAlt, FaMoneyBill
} from 'react-icons/fa';
import { BiSolidLandmark } from 'react-icons/bi'; // Add this import for new logo
import createLogger from '../../utils/logger';

const logger = createLogger('Navbar');

const navStyles = {
    navbar: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(231, 235, 240, 0.9)',
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 3px',
        zIndex: 1000,
    },
    container: {
        maxWidth: '1400px',
        height: '100%',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brandSection: {
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        padding: '0.5rem 0.75rem',
        borderRadius: '12px',
        transition: 'transform 0.2s ease',
        '&:hover': {
            transform: 'translateY(-1px)',
        }
    },
    brandIcon: {
        fontSize: '2rem',
        color: '#2563eb',
        marginRight: '0.75rem',
    },
    brandContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1rem',
    },
    brandTitle: {
        fontSize: '1.35rem',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: '1.2',
    },
    brandSubtitle: {
        fontSize: '0.8rem',
        color: '#64748B',
        fontWeight: '500',
        letterSpacing: '0.01em',
    },
    navigationSection: {
        flex: '1 1 auto',
        display: 'flex',
        justifyContent: 'center',
        margin: '0 2rem',
    },
    navContainer: {
        display: 'flex',
        gap: '0.25rem',
        padding: '0.35rem',
        background: 'rgba(243, 244, 246, 0.8)',
        borderRadius: '12px',
        border: '1px solid rgba(229, 231, 235, 0.8)',
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1rem',
        borderRadius: '8px',
        color: '#4B5563',
        fontSize: '0.9rem',
        fontWeight: '500',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
            color: '#2563eb',
            background: 'rgba(37, 99, 235, 0.05)',
        }
    },
    activeNavLink: {
        color: '#2563eb',
        background: 'rgba(37, 99, 235, 0.08)',
        fontWeight: '600',
    },
    accountSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    addressChip: {
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        color: '#374151',
        background: '#F3F4F6',
        border: '1px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: '#E5E7EB',
        }
    },
    roleChip: {
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#2563eb',
        background: 'rgba(37, 99, 235, 0.08)',
        border: '1px solid rgba(37, 99, 235, 0.1)',
    },
    logoutButton: {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
        color: 'white',
        fontSize: '0.9rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
        }
    },
    publicLinksSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem',
        background: 'rgba(243, 244, 246, 0.8)',
        borderRadius: '12px',
        border: '1px solid rgba(229, 231, 235, 0.8)',
        marginLeft: 'auto',
    },
    publicLink: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.6rem 1.25rem',
        borderRadius: '8px',
        color: '#4B5563',
        fontSize: '0.95rem',
        fontWeight: '500',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
            color: '#2563eb',
            background: 'rgba(37, 99, 235, 0.05)',
            transform: 'translateY(-1px)',
        }
    },
    activePublicLink: {
        color: '#2563eb',
        background: 'rgba(37, 99, 235, 0.08)',
        fontWeight: '600',
    },
    '@media (max-width: 1024px)': {
        navigationSection: {
            margin: '0 1rem',
        },
        navLink: {
            padding: '0.5rem 0.75rem',
        },
        addressChip: {
            display: 'none',
        }
    },
    '@media (max-width: 768px)': {
        container: {
            padding: '0 1rem',
        },
        navigationSection: {
            display: 'none',
        },
        brandTitle: {
            fontSize: '1.25rem',
        },
        publicLinksSection: {
            background: 'transparent',
            border: 'none',
            padding: 0,
        },
        publicLink: {
            padding: '0.5rem 0.75rem',
            fontSize: '0.9rem',
        },
        brandSubtitle: {
            display: 'none', // Hide subtitle on mobile
        }
    },
    '@media (max-width: 480px)': {
        publicLinksSection: {
            display: 'none',
        }
    }
};

const Navbar = () => {
    const location = useLocation();
    const { authState, logout, refreshUserStatus } = useAuth();
    const { currentUser } = authState;

    const navLinks = useMemo(() => {
        if (!currentUser) return [];

        const role = getRoleFromUser(currentUser);
        logger.debug('Computing nav links for role:', role);

        // Handle rejected state first
        if (currentUser.isRejected) {
            return [{
                to: '/pending-verification',
                label: 'Rejection Status',
                icon: ROLE_ICONS[ROLES.REJECTED_USER_ROLE]
            }];
        }

        // Role-based navigation config
        const roleConfig = {
            [ROLES.ADMIN_ROLE]: [
                { to: '/admin', label: 'Dashboard', icon: <FaHome /> },
                { to: '/admin/users', label: 'Users', icon: <FaUser /> }
            ],
            [ROLES.INSPECTOR_ROLE]: [
                { to: '/inspector', label: 'Dashboard', icon: <FaHome /> },
                { to: '/inspector/verify-users', label: 'Users', icon: <FaUserCheck /> },
                { to: '/inspector/verify-lands', label: 'Lands', icon: <FaBuilding /> },
                { to: '/inspector/disputes', label: 'Disputes', icon: <FaGavel /> }
            ],
            [ROLES.VERIFIED_USER_ROLE]: [
                { to: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
                { to: '/lands/my-lands', label: 'My Lands', icon: <FaBuilding /> },
                { to: '/lands/market', label: 'Market', icon: <FaStore /> },
                { to: '/transactions/requests', label: 'Land Requests', icon: <FaExchangeAlt /> },
                { to: '/transactions/withdrawals', label: 'Withdrawals', icon: <FaMoneyBill /> },
            ],
            [ROLES.USER_ROLE]: [
                { to: '/pending-verification', label: 'Verification Status', icon: <FaClipboard /> }
            ],
            [ROLES.GUEST_ROLE]: [
                { to: '/register', label: 'Register', icon: <FaUserCheck /> }
            ]
        };

        return roleConfig[role] || [];
    }, [currentUser]);

    const handleUserUpdate = useCallback(async () => {
        try {
            await refreshUserStatus();
        } catch (error) {
            logger.error('User status refresh failed', {
                error: error.message || 'Unknown error',
                address: currentUser?.address?.slice(0, 6)
            });
        }
    }, [refreshUserStatus, currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        window.addEventListener('contract:userUpdated', handleUserUpdate);
        return () => window.removeEventListener('contract:userUpdated', handleUserUpdate);
    }, [currentUser, handleUserUpdate]);

    const handleLogout = useCallback(async () => {
        try {
            if (currentUser?.address) {
                window.dispatchEvent(new CustomEvent('cleanup:contractEvents'));
            }
            await logout();
            window.location.href = '/';
        } catch (error) {
            logger.error('Logout failed', {
                error: error.message || 'Unknown error',
                address: currentUser?.address?.slice(0, 6)
            });
        }
    }, [logout, currentUser]);

    const publicLinks = [
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About' }
    ];

    return (
        <nav style={navStyles.navbar}>
            <div style={navStyles.container}>
                <Link to="/" style={navStyles.brandSection}>
                    <BiSolidLandmark style={navStyles.brandIcon} />
                    <div style={navStyles.brandContent}>
                        <span style={navStyles.brandTitle}>TerraLedger</span>
                        <span style={navStyles.brandSubtitle}>Blockchain Registry</span>
                    </div>
                </Link>

                {!currentUser && (
                    <div style={navStyles.publicLinksSection}>
                        {[
                            { to: '/', label: 'Home' },
                            { to: '/about', label: 'About' },
                            { to: '/contact', label: 'Contact' }
                        ].map(({ to, label }) => (
                            <Link
                                key={to}
                                to={to}
                                style={{
                                    ...navStyles.publicLink,
                                    ...(location.pathname === to && navStyles.activePublicLink)
                                }}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                )}

                {currentUser && (
                    <div style={navStyles.navigationSection}>
                        {navLinks.length > 0 && (
                            <div style={navStyles.navContainer}>
                                {navLinks.map(({ to, label, icon }) => {
                                    const isActive = location.pathname === to ||
                                        (to !== '/dashboard' && location.pathname.startsWith(to)) ||
                                        (to === '/dashboard' && location.pathname === '/dashboard');

                                    return (
                                        <Link
                                            key={to}
                                            to={to}
                                            style={{
                                                ...navStyles.navLink,
                                                ...(isActive && navStyles.activeNavLink)
                                            }}
                                        >
                                            <span style={{
                                                ...navStyles.navIcon,
                                                transform: isActive ? 'scale(1.1)' : 'none'
                                            }}>
                                                {icon}
                                            </span>
                                            {label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {currentUser && (
                    <div style={navStyles.accountSection}>
                        <span
                            style={navStyles.addressChip}
                            title={currentUser.address}
                            onClick={() => navigator.clipboard.writeText(currentUser.address)}
                        >
                            {`${currentUser.address.slice(0, 6)}...${currentUser.address.slice(-4)}`}
                        </span>
                        <span style={navStyles.roleChip}>
                            {getRoleFromUser(currentUser)}
                        </span>
                        <button
                            onClick={handleLogout}
                            style={navStyles.logoutButton}
                        >
                            <FaSignOutAlt style={navStyles.logoutIcon} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default React.memo(Navbar);
