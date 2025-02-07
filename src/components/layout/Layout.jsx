import React, { memo, useEffect, useRef, Suspense } from 'react';
import Navbar from './Navbar';
import { sharedStyles, mixins } from '../../styles/sharedPage';
import { useAuth } from '../../core/context/AuthContext';
import createLogger from '../../utils/logger';

const Layout = ({ children }) => {
    const { authState } = useAuth();
    const { isReady, isConnecting } = authState;
    const logger = createLogger('Layout');
    const mountedRef = useRef(false);

    const LoadingSpinner = React.lazy(() => import('../common/LoadingSpinner'));

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            logger.info('Layout mounted', { isReady });
        }
    }, [isReady, logger]);

    const showLoading = isConnecting || !isReady;

    return (
        <div style={sharedStyles.pageWrapper}>
            <Navbar />
            <main style={{
                marginTop: '80px', // Match navbar height exactly
            }}>
                <Suspense fallback={null}>
                    {showLoading ? (
                        <div style={{
                            ...mixins.flexCenter,
                            minHeight: 'calc(100vh - 70px)'
                        }}>
                            <LoadingSpinner
                                message={isConnecting ? "Connecting..." : "Loading..."}
                            />
                        </div>
                    ) : (
                        children
                    )}
                </Suspense>
            </main>
        </div>
    );
};

Layout.displayName = 'Layout';
export default memo(Layout);
