import { colors, mixins } from './sharedPage';

const dashboardStyles = {
    container: {
        ...mixins.mainContent,
        padding: '1.5rem',
        background: colors.background.gradient,
        gap: '2rem',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        fontSize: '2.5rem',
        fontWeight: '800',
        background: colors.primary.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center',
        marginBottom: '2.5rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem',
    },
    card: {
        ...mixins.glass,
        padding: '2rem',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        border: `1px solid ${colors.border.light}`,
        ...mixins.elevation,
    },
    cardTitleWrapper: {
        ...mixins.flex,
        gap: '0.75rem',
    },
    cardIcon: {
        fontSize: '1.5rem',
        color: colors.primary.main,
    },
    cardTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: colors.text.secondary,
    },
    count: (value = 0) => ({
        fontSize: '3rem',
        fontWeight: '800',
        letterSpacing: '-0.05em',
        display: 'inline-block',
        color: value === 0 ? colors.text.secondary : // Changed from text.light to text.secondary
            value > 0 ? colors.primary.main :
                colors.error.main,
        backgroundImage: value === 0 ? 'none' :
            value > 0 ? colors.primary.gradient :
                colors.error.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: value === 0 ? 'initial' : 'transparent', // Added conditional
        backgroundColor: 'transparent',
    }),
    link: {
        ...mixins.glass,
        padding: '1rem',
        borderRadius: '12px',
        textAlign: 'center',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '0.875rem',
        color: colors.primary.main,
        background: colors.primary.light,
        transition: 'all 0.2s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 12px ${colors.primary.main}20`,
        }
    },
    section: {
        ...mixins.glass,
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        ...mixins.elevation,
    },
    sectionTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: `1px solid ${colors.border.light}`,
    },
    requestsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
    },
    requestColumn: {
        background: colors.background.light,
        borderRadius: '12px',
        padding: '1.5rem',
        border: `1px solid ${colors.border.light}`,
    },
    columnTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: '1.5rem',
        paddingBottom: '0.75rem',
        borderBottom: `1px solid ${colors.border.light}`,
    },
    emptyState: {
        ...mixins.flexCenter,
        flexDirection: 'column',
        gap: '1rem',
        padding: '3rem 2rem',
        color: colors.text.secondary,
        background: colors.background.light,
        borderRadius: '12px',
        border: `1px dashed ${colors.border.main}`,
    },
    userInfo: {
        ...mixins.glass,
        marginBottom: '3rem',
        padding: '2rem',
        borderRadius: '16px',
        ...mixins.elevation,
    },
    userHeader: {
        ...mixins.flex,
        gap: '1rem',
        flexWrap: 'wrap',
    },
    userName: {
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: '800',
        background: 'linear-gradient(to right, #fff, #cbd5e1)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.5rem',
    },
    badge: {
        backgroundColor: colors.primary.light,
        padding: '0.5rem 1.25rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: colors.primary.main,
    },
    refreshButton: {
        display: 'block',
        margin: '2rem auto 0',
        padding: '0.875rem 2.5rem',
        background: colors.background.paper,
        color: colors.primary.main,
        border: `1px solid ${colors.primary.main}`,
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.875rem',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: colors.primary.light,
            transform: 'translateY(-2px)',
        }
    },
    heroCard: {
        ...mixins.glass,
        padding: '3rem',
        borderRadius: '24px',
        background: colors.secondary.gradient,
        position: 'relative',
        overflow: 'hidden',
        color: colors.text.inverse,
        marginBottom: '2rem',
    },
    userProfile: {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '800px',
    },
    roleBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontSize: '0.875rem',
        color: '#fff',
        maxWidth: 'fit-content',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
    },
    statCard: {
        ...mixins.glass,
        padding: '2rem',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'transform 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
        },
    },
    statHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statTitle: {
        color: colors.text.secondary,
        fontSize: '0.875rem',
        fontWeight: '500',
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: '700',
        background: colors.primary.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    activitySection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginTop: '2rem',
    },
    activityCard: {
        ...mixins.glass,
        padding: '1.5rem',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        minHeight: '400px',
    },
    actionsContainer: {
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    },
    quickLinks: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
    },
    quickLink: {
        padding: '1rem',
        background: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        color: colors.primary.main,
        textAlign: 'center',
        fontWeight: '500',
        border: `1px solid ${colors.border.light}`,
        transition: 'all 0.2s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
    },
    lastUpdate: {
        fontSize: '0.875rem',
        color: "white",
        marginTop: '0.5rem'
    }
};

export default dashboardStyles;
