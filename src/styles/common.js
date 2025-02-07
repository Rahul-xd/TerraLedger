import { theme } from './theme';

export const commonStyles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: theme.spacing.md
    },
    button: {
        ...theme.buttons.base,
        ...theme.buttons.primary
    },
    secondaryButton: {
        ...theme.buttons.base,
        ...theme.buttons.secondary
    },
    card: {
        ...theme.card
    },
    input: {
        width: '100%',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${theme.colors.text.light}`,
        marginBottom: theme.spacing.sm
    },
    errorText: {
        color: theme.colors.error,
        fontSize: '0.875rem',
        marginTop: theme.spacing.xs
    },
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl
    },
    text: {
        h1: theme.typography.h1,
        h2: theme.typography.h2,
        h3: theme.typography.h3,
        body: theme.typography.body,
        small: theme.typography.small
    },
    pageContainer: {
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: theme.spacing.xl,
    }
};
