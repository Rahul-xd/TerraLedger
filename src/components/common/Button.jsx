import React from 'react';
import { theme } from '../../styles/theme';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    onClick,
    style,
    ...props
}) => {
    const baseStyles = {
        padding: size === 'small' ? '0.5rem 1rem' : size === 'large' ? '1rem 2rem' : '0.75rem 1.5rem',
        fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
        borderRadius: '6px',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s ease',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        minWidth: size === 'small' ? '80px' : size === 'large' ? '140px' : '120px',
        ...getVariantStyles(variant),
        '&:hover': {
            opacity: disabled || loading ? 0.6 : 0.9
        },
        '&:active': {
            transform: disabled || loading ? 'none' : 'translateY(1px)'
        },
        ...style
    };

    return (
        <button
            style={baseStyles}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
};

const getVariantStyles = (variant) => {
    const variants = {
        primary: {
            backgroundColor: theme.colors.primary.main,
            color: 'white',
        },
        secondary: {
            backgroundColor: theme.colors.secondary,
            color: 'white',
        },
        error: {
            backgroundColor: theme.colors.error,
            color: 'white',
        },
        outline: {
            backgroundColor: 'transparent',
            border: `1px solid ${theme.colors.primary}`,
            color: theme.colors.primary.main,
        },
        text: {
            backgroundColor: 'transparent',
            color: theme.colors.primary.main,
            minWidth: 'auto',
            padding: '0.25rem 0.5rem',
        }
    };

    return variants[variant] || variants.primary;
};

export default Button;
