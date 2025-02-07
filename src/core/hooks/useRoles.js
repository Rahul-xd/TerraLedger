import { ROLES, ROLE_ICONS, ROUTES } from '../config'; // Add ROUTES to imports
import createLogger from '../../utils/logger';

const logger = createLogger('useRoles');

// Remove ROLES & ROLE_ICONS declarations since we import them
export { ROLES, ROLE_ICONS };

// Update getRoleName to use imported ROLES
export const getRoleName = (user) => {
    if (!user) return 'Guest';
    if (user.isOwner) return 'Admin';
    if (user.isInspector) return 'Inspector';
    if (user.isVerified) return 'Verified User';
    if (user.isRegistered) return 'Pending User';
    return 'Guest';
};

// Update getRoleFromUser
export const getRoleFromUser = (user) => {
    if (!user) return ROLES.GUEST_ROLE;

    // Check rejection first
    if (user.isRejected) return ROLES.REJECTED_USER_ROLE;

    // Then check other roles in order of precedence
    if (user.isOwner) return ROLES.ADMIN_ROLE;
    if (user.isInspector) return ROLES.INSPECTOR_ROLE;
    if (user.isVerified) return ROLES.VERIFIED_USER_ROLE;
    if (user.isRegistered) return ROLES.USER_ROLE;
    return ROLES.GUEST_ROLE;
};

// Add this function to handle route determination
export const getRedirectRoute = (user) => {
    logger.info('Calculating redirect route:', {
        user: {
            address: user?.address,
            isRejected: user?.isRejected,
            isRegistered: user?.isRegistered,
            isVerified: user?.isVerified,
            isOwner: user?.isOwner,
            isInspector: user?.isInspector
        }
    });

    if (!user) {
        logger.info('No user, redirecting to home');
        return ROUTES.HOME;
    }

    // Handle rejected users first
    if (user.isRejected) {
        logger.info('User is rejected, redirecting to pending');
        return ROUTES.PENDING;
    }

    // Then handle other cases
    if (user.isOwner) {
        logger.info('User is owner, redirecting to admin');
        return ROUTES.ADMIN;
    }
    if (user.isInspector) {
        logger.info('User is inspector, redirecting to inspector');
        return ROUTES.INSPECTOR;
    }
    if (user.isVerified) {
        logger.info('User is verified, redirecting to dashboard');
        return ROUTES.DASHBOARD;
    }
    if (user.isRegistered) {
        logger.info('User is registered but not verified, redirecting to pending');
        return ROUTES.PENDING;
    }

    logger.info('User is not registered, redirecting to register');
    return ROUTES.REGISTER;
};

// Move all role-related functions here
const roleHierarchy = {
    [ROLES.ADMIN_ROLE]: 4,
    [ROLES.INSPECTOR_ROLE]: 3,
    [ROLES.VERIFIED_USER_ROLE]: 2,
    [ROLES.USER_ROLE]: 1,
    [ROLES.GUEST_ROLE]: 0
};

// Add TypeScript-like type checking
const validateRole = (role) => {
    return Object.values(ROLES).includes(role);
};

// Add logging to hasAccess
export const hasAccess = (user, requiredRole) => {
    if (!validateRole(requiredRole)) {
        logger.error('Invalid role requested:', requiredRole);
        return false;
    }

    logger.info('Checking access:', {
        user: {
            address: user?.address,
            isRejected: user?.isRejected,
            isRegistered: user?.isRegistered,
            isVerified: user?.isVerified,
            isOwner: user?.isOwner,
            isInspector: user?.isInspector
        },
        requiredRole
    });

    if (!user || !requiredRole) {
        logger.info('Access denied: missing user or role');
        return false;
    }

    // Special handling for rejected users
    if (user.isRejected) {
        const hasAccess = requiredRole === ROLES.USER_ROLE;
        logger.info(`Rejected user access ${hasAccess ? 'granted' : 'denied'} for ${requiredRole}`);
        return hasAccess;
    }

    // Basic role checks
    const result = user.isOwner ||
        (requiredRole === ROLES.INSPECTOR_ROLE && user.isInspector) ||
        (requiredRole === ROLES.VERIFIED_USER_ROLE && user.isVerified) ||
        (requiredRole === ROLES.USER_ROLE && user.isRegistered);

    logger.info(`Access ${result ? 'granted' : 'denied'} for role ${requiredRole}`);
    return result;
};

// Move roleEvents out of hook for direct export
const roleEvents = {
    [ROLES.INSPECTOR_ROLE]: ['UserVerified', 'UserRejected', 'LandVerified', 'DisputeResolved'],
    [ROLES.ADMIN_ROLE]: ['RoleAssigned', 'RoleRevoked'],
    [ROLES.VERIFIED_USER_ROLE]: ['UserUpdated', 'LandRegistered'],
    [ROLES.USER_ROLE]: ['UserRegistered', 'UserRejected']
};

// Export getRoleEvents as a standalone function
export const getRoleEvents = (role) => roleEvents[role] || [];

// Update useRoles hook to use imported getRoleEvents
export const useRoles = () => {
    return {
        getRoleName,
        getRoleFromUser,
        getRedirectRoute,
        hasAccess,
        getRoleEvents,
        ROLES // Add ROLES to the hook return value as well
    };
};
