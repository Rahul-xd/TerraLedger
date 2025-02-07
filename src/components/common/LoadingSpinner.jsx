import React from 'react';
import { theme } from '../../styles/theme';

const LoadingSpinner = ({
    message = 'Loading...',
    size = 'medium',
    fullScreen = false,
    overlay = false,
    color = theme.colors.primary.dark
}) => {
    const getSize = () => {
        switch (size) {
            case 'small': return { width: '24px', height: '24px', border: '3px solid' };
            case 'large': return { width: '56px', height: '56px', border: '5px solid' };
            default: return { width: '40px', height: '40px', border: '4px solid' };
        }
    };

    const spinnerSize = getSize();

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: fullScreen ? '100vh' : '100%',
            width: '100%',
            position: overlay ? 'fixed' : 'relative',
            top: overlay ? 0 : 'auto',
            left: overlay ? 0 : 'auto',
            backgroundColor: overlay ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
            zIndex: overlay ? 1000 : 1,
        },
        spinner: {
            ...spinnerSize,
            borderColor: theme.colors.background.light,
            borderTopColor: color,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
        },
        message: {
            marginTop: '1rem',
            color: theme.colors.text.primary,
            fontSize: size === 'small' ? '0.875rem' : '1rem',
            fontWeight: 500
        },
        '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
        }
    };

    // Insert keyframes into document head
    React.useEffect(() => {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleSheet);
        return () => styleSheet.remove();
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.spinner} />
            {message && <p style={styles.message}>{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
