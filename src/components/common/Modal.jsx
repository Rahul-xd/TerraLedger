import React, { useEffect } from 'react';
import { sharedStyles, colors } from '../../styles/sharedPage';
import '../../styles/scrollbar.css';

const Modal = ({ children, title, onClose, isOpen }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!isOpen) return null;

    const modalStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(26, 38, 57, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
    };

    const contentStyle = {
        background: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        zIndex: 1001,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    };

    return (
        <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={contentStyle} className="custom-scrollbar" onClick={e => e.stopPropagation()}>
                {title && (
                    <div style={sharedStyles.modalHeader}>
                        <h3 style={sharedStyles.title}>{title}</h3>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                color: colors.text.secondary
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};

export default Modal;
