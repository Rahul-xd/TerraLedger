import React, { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import { motion } from 'framer-motion';
import { FaWallet, FaShieldAlt, FaFileContract, FaUserCheck, FaBalanceScale } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';
import { getRedirectRoute } from '../../core/hooks/useRoles';
import createLogger from '../../utils/logger';
import { showToast } from '../../utils/toast';
import { ethers } from 'ethers';
import { ROUTES } from '../../core/config'; // Add this import

const logger = createLogger('Home');

// Modern color palette
const colors = {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    primaryLight: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    backgroundDark: '#f1f5f9',
    text: '#1e293b',
    textLight: '#64748b',
    error: '#ef4444',
    success: '#22c55e',
    border: '#e2e8f0',
    white: '#ffffff'
};

// Updated modern color palette with gradients
const styles = {
    container: {
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column'
    },

    heroSection: {
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '6rem 2rem',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 150%, #3b82f6 0%, transparent 50%)',
            opacity: 0.4
        }
    },

    heroContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
    },

    title: {
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        fontWeight: '800',
        marginBottom: '1.5rem',
        lineHeight: '1.1',
        background: 'linear-gradient(to right, #60a5fa, #e879f9)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },

    subtitle: {
        fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        color: '#cbd5e1',
        maxWidth: '800px',
        margin: '0 auto 2rem',
        lineHeight: '1.6'
    },

    mainContent: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        flex: 1,
        width: '100%'
    },

    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        margin: '4rem 0',
        width: '100%'
    },

    featureCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
        }
    },

    featureIcon: {
        fontSize: '2rem',
        color: '#3b82f6',
        background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
        padding: '1rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        display: 'inline-block'
    },

    featureTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '1rem'
    },

    featureDescription: {
        color: '#64748b',
        lineHeight: '1.6'
    },

    welcomeCard: {
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '3rem',
        width: '100%',
        margin: '2rem auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
    },

    button: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: '12px',
        border: 'none',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
        },
        '&:disabled': {
            opacity: 0.7,
            cursor: 'not-allowed'
        }
    },

    connectionCard: {
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '3rem',
        width: '100%',
        margin: '2rem auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid rgba(148, 163, 184, 0.1)'
    },

    steps: {
        background: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '12px',
        marginTop: '1.5rem'
    },

    stepsList: {
        listStyle: 'none',
        padding: 0,
        margin: '1.5rem 0',
    },

    step: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
    },

    lastStep: {
        borderBottom: 'none',
    },

    error: {
        color: '#ef4444',
        background: '#fef2f2',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '1rem',
        border: '1px solid #fee2e2'
    }
};

// Updated features with more detailed descriptions
const features = [
    {
        icon: <FaShieldAlt />,
        title: 'Blockchain Security',
        description: 'Immutable property records secured by military-grade cryptography.'
    },
    {
        icon: <FaFileContract />,
        title: 'Smart Contracts',
        description: 'Automated property transactions with built-in verification and instant settlement through smart contracts.'
    },
    {
        icon: <FaUserCheck />,
        title: 'Verified Identity',
        description: 'Multi-level KYC verification ensuring all participants are thoroughly vetted and authenticated.'
    },
    {
        icon: <FaBalanceScale />,
        title: 'Dispute Resolution',
        description: 'Transparent and efficient dispute resolution system with immutable audit trails and expert arbitration.'
    }
];

// Simplified WelcomeSection
const WelcomeSection = memo(({ user, onNavigate, isInitialized }) => (
    <div style={styles.welcomeCard}>
        <div style={{ textAlign: 'center' }}>
            <h2 style={{
                color: colors.primaryDark,
                fontSize: '2.5rem',
                marginBottom: '1rem',
                background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Welcome to TerraLedger
            </h2>
            <p style={{ color: colors.secondary, fontSize: '1.1rem' }}>
                Your decentralized land registry platform
            </p>
        </div>

        {!isInitialized ? (
            <LoadingSpinner message="Initializing contracts..." />
        ) : (
            <>
                <div style={{
                    padding: '2rem',
                    background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '16px',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        fontWeight: 700,
                        color: colors.primary,
                        marginBottom: '1rem',
                        fontSize: '1.25rem'
                    }}>
                        {user.isOwner ? 'System Administrator' :
                            user.isInspector ? 'Land Inspector' :
                                user.isVerified ? 'Verified User' :
                                    user.isRegistered ? 'Pending Verification' :
                                        user.isRejected ? 'Registration Rejected' : 'Unregistered'}
                    </div>
                    <div style={{
                        color: colors.secondary,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <FaWallet />
                        <span style={{ fontWeight: 500 }}>Connected Wallet:</span>
                        {user.address.substring(0, 6)}...{user.address.substring(38)}
                    </div>
                </div>

                <button
                    style={{
                        ...styles.button,
                        padding: '1.25rem 3rem',
                        fontSize: '1.1rem',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}
                    onClick={() => onNavigate(getRedirectRoute(user))}
                    disabled={!isInitialized}
                >
                    Access Dashboard
                </button>
            </>
        )}
    </div>
));

// Simplified FeatureCard
const FeatureCard = memo(({ icon, title, description }) => (
    <motion.div
        style={styles.featureCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
        <div style={styles.featureIcon}>{icon}</div>
        <h3 style={styles.featureTitle}>{title}</h3>
        <p style={styles.featureDescription}>{description}</p>
    </motion.div>
));

// Simplified ConnectWalletSection
const ConnectWalletSection = memo(({ onConnect, isConnecting, error }) => (
    <div style={styles.connectionCard}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{
                color: colors.primaryDark,
                fontSize: '2.5rem',
                marginBottom: '1rem',
                background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Join TerraLedger Today
            </h2>
            <p style={{
                color: colors.secondary,
                fontSize: '1.1rem',
                maxWidth: '600px',
                margin: '0 auto'
            }}>
                Start your journey towards secure and transparent property transactions
            </p>
        </div>

        <div style={{
            background: colors.backgroundDark,
            padding: '1.5rem',
            borderRadius: '16px',
            margin: '1rem 0'
        }}>
            <div style={{ marginBottom: '1rem', fontWeight: 500, color: colors.text }}>
                Quick Start Guide:
            </div>
            <ul style={{ ...styles.stepsList, margin: '0' }}>
                {[
                    'Install MetaMask browser extension',
                    'Create or import your wallet',
                    'Connect to start using TerraLedger'
                ].map((step, index, array) => (
                    <li
                        key={index}
                        style={{
                            ...styles.step,
                            ...(index === array.length - 1 ? styles.lastStep : {})
                        }}
                    >
                        <div style={styles.stepNumber}>{index + 1}</div>
                        <div>{step}</div>
                    </li>
                ))}
            </ul>
        </div>

        <button
            style={{ ...styles.button, width: '100%' }}
            onClick={onConnect}
            disabled={isConnecting}
        >
            {isConnecting ? (
                <LoadingSpinner size="small" color="white" />
            ) : (
                <>
                    <FaWallet />
                    Connect MetaMask
                </>
            )}
        </button>

        {error && <div style={styles.error}>{error}</div>}
    </div>
));

// Add HeroSection component
const HeroSection = () => (
    <section style={styles.heroSection}>
        <div style={styles.heroContent}>
            <h1 style={styles.title}>
                Revolutionary Land Registry on Blockchain
            </h1>
            <p style={styles.subtitle}>
                Experience the future of property management with our secure, transparent,
                and efficient blockchain-based land registration system. Streamline your
                property transactions with military-grade security and instant verification.
            </p>
        </div>
    </section>
);

// Simplified Home component
const Home = () => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { connectWallet, authState: { isConnecting, currentUser, isReady, contractsInitialized } } = useAuth();

    const handleConnect = useCallback(async () => {
        const correlationId = Date.now();
        logger.info(`[${correlationId}] Starting connection process`);

        try {
            setError(null);

            // Add network check
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();

            // Check for Hardhat network (chainId 31337)
            if (network.chainId !== 31337n) {
                throw new Error('Please connect to Hardhat network (chainId: 31337)');
            }

            // Connect wallet
            const result = await connectWallet();
            logger.debug(`[${correlationId}] Connection result:`, result);

            if (!result?.success || !result?.user) {
                throw new Error('Connection failed');
            }

            // Get route based on user role, using imported ROUTES
            const route = getRedirectRoute(result.user);
            logger.info(`[${correlationId}] Redirecting to ${route}`, {
                userRole: result.user.isOwner ? 'admin' :
                    result.user.isInspector ? 'inspector' :
                        result.user.isVerified ? 'verified' : 'unregistered'
            });

            // Immediate redirect after successful connection
            navigate(route, { replace: true });

        } catch (error) {
            logger.error(`[${correlationId}] Connection failed:`, {
                error: error.message,
                stack: error.stack
            });

            const errorMessage = error.message.includes('network') ? 'Please connect to Hardhat network' :
                error.message.includes('initialization') ? 'Please wait while we connect...' :
                    'Connection failed. Please try again.';

            setError(errorMessage);
            showToast.error(errorMessage);
        }
    }, [connectWallet, navigate]);

    // Remove useEffect for redirection
    // Just show loading state
    if (isConnecting || !isReady) {
        const state = isConnecting ? "connecting" : "initializing";
        logger.info(`Home state: ${state}`);
        return <LoadingSpinner message={`${state}...`} />;
    }

    return (
        <ErrorBoundary>
            <div style={styles.container}>
                <HeroSection />
                <main style={styles.mainContent}>
                    {currentUser ? (
                        <WelcomeSection
                            user={currentUser}
                            onNavigate={navigate}
                            isInitialized={contractsInitialized}
                        />
                    ) : (
                        <ConnectWalletSection
                            onConnect={handleConnect}
                            isConnecting={isConnecting}
                            error={error}
                        />
                    )}
                    <section style={styles.featuresGrid}>
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </section>
                </main>
            </div>
        </ErrorBoundary>
    );
};

export default memo(Home);
