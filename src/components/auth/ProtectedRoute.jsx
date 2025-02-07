import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import createLogger from '../../utils/logger';
import LoadingSpinner from '../common/LoadingSpinner';
import { getRedirectRoute, hasAccess } from '../../core/hooks/useRoles';
import { REJECTED_ALLOWED, ROUTES } from '../../core/config';

const logger = createLogger('ProtectedRoute');

const ProtectedRoute = ({ children, requiredRole }) => {
    const {
        authState: {
            currentUser,
            isReady,
            contractsInitialized,
            error
        }
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const correlationId = Date.now();

        logger.debug(`[${correlationId}] Route evaluation:`, {
            path: location.pathname,
            requiredRole,
            user: {
                address: currentUser?.address,
                isVerified: currentUser?.isVerified,
                isRejected: currentUser?.isRejected,
                roles: {
                    isOwner: currentUser?.isOwner,
                    isInspector: currentUser?.isInspector
                }
            },
            systemState: {
                isReady,
                contractsInitialized,
                hasError: !!error
            }
        });

        // System not ready
        if (!isReady || !contractsInitialized) {
            logger.info(`[${correlationId}] System not ready`, {
                isReady,
                contractsInitialized
            });
            return;
        }

        // Handle authentication
        if (!currentUser?.address) {
            logger.info(`[${correlationId}] No authenticated user, redirecting to home`);
            navigate('/', { replace: true });
            return;
        }

        // Handle rejected users
        if (currentUser.isRejected && !REJECTED_ALLOWED.includes(location.pathname)) {
            logger.info(`[${correlationId}] Rejected user accessing restricted path`, {
                currentPath: location.pathname,
                allowedPaths: REJECTED_ALLOWED
            });
            navigate(ROUTES.PENDING_VERIFICATION, { replace: true });
            return;
        }

        // Handle role-based access
        if (!hasAccess(currentUser, requiredRole)) {
            const redirectPath = getRedirectRoute(currentUser);
            logger.info(`[${correlationId}] Access denied, redirecting`, {
                requiredRole,
                userRoles: {
                    isOwner: currentUser.isOwner,
                    isInspector: currentUser.isInspector,
                    isVerified: currentUser.isVerified
                },
                redirectPath
            });
            navigate(redirectPath, { replace: true });
        }
    }, [
        isReady,
        contractsInitialized,
        currentUser,
        requiredRole,
        location.pathname,
        error
    ]);

    // Show loading state
    if (!isReady || !contractsInitialized) {
        return (
            <LoadingSpinner
                message={!isReady ? "Initializing..." : "Loading contracts..."}
            />
        );
    }

    // Show error state if any
    if (error) {
        return (
            <div className="error-container">
                <h3>Access Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    // Only render children if user has access
    return currentUser && hasAccess(currentUser, requiredRole) ? children : null;
};

export default ProtectedRoute;
