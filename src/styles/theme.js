export const theme = {
    colors: {
        primary: {
            main: '#2563eb',    // Bright blue - good for primary actions
            light: '#60a5fa',   // Light blue - hover states
            dark: '#1d4ed8',    // Dark blue - active states
        },
        secondary: {
            main: '#7c3aed',    // Purple - secondary actions
            light: '#a78bfa',   // Light purple - hover states
            dark: '#5b21b6',    // Dark purple - active states
        },
        success: '#059669',     // Green - success states
        error: '#dc2626',       // Red - error states
        warning: '#d97706',     // Amber - warning states
        info: '#0891b2',        // Cyan - info states
        disabled: '#9ca3af',    // Gray - disabled states
        background: {
            light: '#f8fafc',   // Very light blue-gray
            main: '#ffffff',    // White
            dark: '#f1f5f9',    // Light blue-gray
            card: 'rgba(255, 255, 255, 0.95)', // Slightly transparent white
        },
        text: {
            dark: '#1e293b',    // Dark blue-gray - primary text
            secondary: '#64748b', // Medium blue-gray - secondary text
            light: '#94a3b8',   // Light blue-gray - tertiary text
            inverse: '#ffffff'  // White - text on dark backgrounds
        },
        border: {
            light: '#e2e8f0',   // Light gray - subtle borders
            main: '#cbd5e1',    // Medium gray - standard borders
            dark: '#94a3b8'     // Dark gray - emphasized borders
        },
        status: {
            pending: '#fbbf24',  // Yellow - pending states
            verified: '#059669', // Green - verified states
            rejected: '#dc2626'  // Red - rejected states
        },
        gradient: {
            primary: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
            card: 'linear-gradient(to right, #f8fafc, #f1f5f9)'
        }
    },
    spacing: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px'
    },
    buttons: {
        base: {
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '1rem',
            fontWeight: '500'
        },
        primary: {
            backgroundColor: '#4299E1',
            color: 'white',
            '&:hover': {
                backgroundColor: '#3182CE'
            },
            '&:disabled': {
                opacity: 0.7,
                cursor: 'not-allowed'
            }
        },
        secondary: {
            backgroundColor: '#EDF2F7',
            color: '#2D3748',
            '&:hover': {
                backgroundColor: '#E2E8F0'
            }
        }
    },
    card: {
        padding: '1.5rem',
        borderRadius: '0.5rem',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
    },
    typography: {
        h1: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            lineHeight: 1.2
        },
        h2: {
            fontSize: '2rem',
            fontWeight: '600',
            lineHeight: 1.3
        },
        h3: {
            fontSize: '1.25rem',
            fontWeight: '500',
            lineHeight: 1.4
        },
        body: {
            fontSize: '1rem',
            lineHeight: 1.5
        },
        small: {
            fontSize: '0.875rem',
            lineHeight: 1.5
        },
        text: {
            small: {
                fontSize: '0.875rem',
                lineHeight: 1.5
            }
        }
    },
    shadows: {
        small: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        medium: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        large: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    },
    layout: {
        maxWidth: '1100px',
        navbarHeight: '60px',
        containerPadding: '1rem',
    },
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
    }
};
