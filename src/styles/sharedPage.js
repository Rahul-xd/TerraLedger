import { theme } from './theme';

const colors = {
    primary: {
        main: '#0F4C81',     // Deep professional blue
        light: '#E6F3FF',
        dark: '#093660',
        gradient: 'linear-gradient(135deg, #0F4C81, #093660)'
    },
    secondary: {
        main: '#2C3E50',     // Rich slate blue
        light: '#F8FAFC',
        dark: '#1A2639',
        gradient: 'linear-gradient(135deg, #2C3E50, #1A2639)'
    },
    success: {
        main: '#2D6A4F',     // Professional forest green
        light: '#ECFDF5',
        dark: '#1B4332',
        gradient: 'linear-gradient(135deg, #2D6A4F, #1B4332)'
    },
    error: {
        main: '#C53030',     // Professional red
        light: '#FFF5F5',
        dark: '#9B2C2C',
        gradient: 'linear-gradient(135deg, #C53030, #9B2C2C)'
    },
    info: {
        main: '#2B6CB0',     // Professional blue
        light: '#EBF8FF',
        dark: '#2C5282',
        gradient: 'linear-gradient(135deg, #2B6CB0, #2C5282)'
    },
    warning: {
        main: '#C05621',     // Professional orange
        light: '#FFFAF0',
        dark: '#9C4221',
        gradient: 'linear-gradient(135deg, #C05621, #9C4221)'
    },
    background: {
        default: '#FFFFFF',
        paper: '#FFFFFF',
        light: '#F8FAFC',
        dark: '#1A2639',
        gradient: 'linear-gradient(145deg, #FFFFFF, #F8FAFC)'
    },
    text: {
        primary: '#1A2639',
        secondary: '#4A5568',
        light: '#718096',
        inverse: '#FFFFFF'
    },
    border: {
        light: '#E2E8F0',
        main: '#CBD5E0',
        dark: '#A0AEC0'
    },
    backdrop: {
        default: 'rgba(26, 38, 57, 0.75)',
        light: 'rgba(255, 255, 255, 0.9)'
    }
};

const mixins = {
    flex: {
        display: 'flex',
        alignItems: 'center',
    },
    flexCenter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexColumn: {
        display: 'flex',
        flexDirection: 'column',
    },
    fullWidth: {
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
    },
    pageContainer: {
        minHeight: '100vh',
        width: '100%',  // Changed from 100vw to prevent horizontal scroll
        margin: 0,
        padding: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',  // Prevent any unwanted scrollbars
        background: colors.background.light,
    },
    glass: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${colors.border.light}`,
        boxShadow: '0 4px 6px -1px rgba(26, 38, 57, 0.05), 0 2px 4px -2px rgba(26, 38, 57, 0.025)'
    },
    rounded: {
        borderRadius: '12px',
    },
    elevation: {
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.05)'
    },
    hoverEffect: {
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 12px -3px rgba(15, 23, 42, 0.15)'
        }
    },
    navbar: {
        height: '70px',
        backgroundColor: colors.background.paper,
        borderBottom: `1px solid ${colors.border.light}`,
        padding: '0 2rem',
    },
    navContainer: {
        maxWidth: '1400px',
        margin: '0 auto',
        height: '100%',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
    },
    navLink: {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        color: colors.text.secondary,
        fontSize: '0.875rem',
        fontWeight: '500',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
            color: colors.primary.main,
            backgroundColor: colors.primary.light,
        }
    },
    navSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    mainContent: {
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        flex: 1,
        minHeight: 'calc(100vh - 70px)', // Account for navbar height
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: colors.background.gradient,
        overflow: 'auto',  // Add this to handle content overflow
    },
    smoothScroll: {
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.border.main} ${colors.background.light}`,
        // Remove the pseudo-element selectors as they're not supported in React inline styles
        // Instead, we'll handle scrollbar styling through CSS classes or a separate stylesheet
    },
    cardContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2.5rem', // Increased gap
        padding: '2.5rem', // Increased padding
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        alignItems: 'start', // Changed from stretch
    },
    pageTransition: {
        transition: 'all 0.3s ease-in-out',
    }
};

const sharedStyles = {
    mainWrapper: {
        ...mixins.mainContent,
        ...mixins.smoothScroll,
        background: colors.background.gradient,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        height: '100%',
        padding: '2rem',
    },
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        width: '100%',
    },
    card: {
        background: colors.background.paper,
        borderRadius: '12px',
        border: `1px solid ${colors.border.light}`,
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(26, 38, 57, 0.05), 0 1px 2px rgba(26, 38, 57, 0.025)',
    },
    section: {
        marginBottom: '2rem',
        background: colors.background.paper,
        borderRadius: '12px',
        border: `1px solid ${colors.border.light}`,
        padding: '1.5rem',
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: '1.5rem',
    },
    subtitle: {
        fontSize: '1rem',
        color: colors.text.secondary,
        marginBottom: '1rem',
    },
    button: {
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontSize: '0.9375rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: colors.primary.main,
        color: colors.text.inverse,
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: `1px solid ${colors.border.main}`,
        backgroundColor: colors.background.light,
        color: colors.text.primary,
        fontSize: '0.9375rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        color: colors.text.secondary,
        fontSize: '0.875rem',
        fontWeight: '500',
    },
    error: {
        color: colors.error.main,
        fontSize: '0.875rem',
        marginTop: '0.5rem',
    },
    grid: {
        ...mixins.cardContainer,
    },
    modal: {
        position: 'fixed',
        inset: 0,
        backgroundColor: colors.backdrop.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        background: colors.background.paper,
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1001,
    },
    modalHeader: {
        padding: '1.5rem',
        borderBottom: `1px solid ${colors.border.light}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: colors.background.paper,
    },
    modalBody: {
        padding: '2rem',
        overflowY: 'auto',
        flex: 1,
        minHeight: '200px',
        maxHeight: 'calc(85vh - 150px)', // Account for header and footer
    },
    modalFooter: {
        padding: '1.5rem 2rem',
        borderTop: `1px solid ${colors.border.light}`,
        background: colors.background.paper,
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
    },
    buttonOutlined: (variant = 'primary') => ({
        ...sharedStyles.button(variant),
        background: 'transparent',
        border: `2px solid ${colors[variant].main}`,
        color: colors[variant].main,
        '&:hover': {
            background: colors[variant].light,
            transform: 'translateY(-1px)',
        }
    }),
    buttonIcon: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.5rem',
        height: '1.5rem',
        fontSize: '1.25rem',
        marginRight: '0.5rem',
    },
    helper: {
        fontSize: '0.75rem',
        color: colors.text.light,
    },
    emptyState: {
        ...mixins.flexCenter,
        flexDirection: 'column',
        gap: '1rem',
        gridColumn: '1 / -1',
        minHeight: '400px',
        background: colors.background.paper,
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    // Add new verification specific styles
    verificationCard: {
        ...mixins.glass,
        padding: '2rem',
        borderRadius: '16px',
        border: `1px solid ${colors.border.light}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        background: colors.background.paper,
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
        height: 'auto', // Allow height to grow
        minHeight: '600px', // Set minimum height
        overflow: 'visible', // Allow content to overflow
    },
    verificationGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        width: '100%',
        height: 'auto', // Allow height to grow
        minHeight: '500px',
    },
    verificationSection: {
        ...mixins.glass,
        padding: '2rem',
        borderRadius: '12px',
        border: `1px solid ${colors.border.light}`,
        height: 'auto', // Change from 100% to auto
        minHeight: '100%', // Ensure it takes up at least full height
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        background: colors.background.light,
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        flex: 1, // Add this to make it fill available space
    },
    infoItem: {
        background: colors.background.light,
        padding: '1rem',
        borderRadius: '8px',
        border: `1px solid ${colors.border.light}`,
    },
    label: {
        fontSize: '0.875rem',
        color: colors.text.secondary,
        marginBottom: '0.5rem',
        display: 'block',
    },
    value: {
        fontSize: '1rem',
        color: colors.text.primary,
        fontWeight: '500',
    },
    addressBlock: {
        background: colors.primary.light,
        color: colors.primary.main,
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontFamily: 'monospace',
        wordBreak: 'break-all',
        marginTop: 'auto',
    },
    actionBar: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        padding: '1.5rem',
        borderTop: `1px solid ${colors.border.light}`,
        marginTop: '1rem',
    },
    documentLink: {
        ...mixins.flex,
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        background: colors.background.light,
        color: colors.primary.main,
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: '500',
        border: `1px solid ${colors.border.light}`,
        transition: 'all 0.2s ease',
        marginTop: 'auto',
        '&:hover': {
            background: colors.primary.light,
            transform: 'translateY(-2px)',
        }
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        '& th': {
            textAlign: 'left',
            padding: '1rem',
            backgroundColor: colors.background.light,
            color: colors.text.secondary,
            fontWeight: '600',
            fontSize: '0.875rem',
        },
        '& td': {
            padding: '1rem',
            borderTop: `1px solid ${colors.border.light}`,
            color: colors.text.primary,
        }
    },
    contentCard: {
        ...mixins.glass,
        ...mixins.rounded,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        height: '100%', // Ensure consistent height
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 20px -8px rgba(0, 0, 0, 0.15)',
        }
    },
    pageHeader: {
        position: 'sticky',
        top: 0,  // Changed from '70px' to 0
        zIndex: 10,
        width: '100%',
        padding: '1.5rem 2.5rem',
        background: `linear-gradient(to bottom, ${colors.background.paper} 0%, ${colors.background.paper}E6 100%)`,
        borderBottom: `1px solid ${colors.border.light}`,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
        marginBottom: '2rem',
        transition: 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out',
        transform: 'translateZ(0)', // Force GPU acceleration
    },
    '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 }
    },
    '@keyframes slideUp': {
        from: {
            transform: 'translateY(20px)',
            opacity: 0
        },
        to: {
            transform: 'translateY(0)',
            opacity: 1
        }
    }
};

function getButtonVariant(variant, colors) {
    const variants = {
        primary: {
            background: colors.primary.gradient,
            color: colors.text.inverse,
            '&:hover': {
                background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
            }
        },
        secondary: {
            background: colors.secondary.gradient,
            color: colors.text.inverse,
            margin: '0 1rem',
            '&:hover': {
                background: `linear-gradient(135deg, ${colors.secondary.dark} 0%, ${colors.secondary.main} 100%)`,
            }
        },
        success: {
            background: colors.success.gradient,
            color: colors.text.inverse,
            '&:hover': {
                background: `linear-gradient(135deg, ${colors.success.dark} 0%, ${colors.success.main} 100%)`,
            }
        },
        error: {
            background: colors.error.gradient,
            color: colors.text.inverse,
            '&:hover': {
                background: `linear-gradient(135deg, ${colors.error.dark} 0%, ${colors.error.main} 100%)`,
            }
        },
        // Add more variants as needed
    };
    return variants[variant] || variants.primary;
}

export { sharedStyles, colors, mixins };
