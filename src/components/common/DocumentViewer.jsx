import React from 'react';
import { getIpfsUrl } from '../../utils/ipfsUtils';
import { theme } from '../../styles/theme';

const DocumentViewer = ({ documentHash, description, type = 'link' }) => {
    const documentUrl = getIpfsUrl(documentHash);

    if (type === 'link') {
        return (
            <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.documentLink}
            >
                <span style={styles.icon}>📋</span>
                <span style={styles.text}>
                    {description || 'View Document'}
                </span>
                <span style={styles.arrow}>→</span>
            </a>
        );
    }

    // For embedded view (not recommended for large documents)
    return (
        <iframe
            src={documentUrl}
            style={styles.iframe}
            title="Document Viewer"
        />
    );
};

const styles = {
    documentLink: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '0.875rem 1rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        color: theme.colors.primary.main,
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: '500',
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': {
            background: theme.colors.primary.light,
            borderColor: theme.colors.primary.main,
            transform: 'translateY(-1px)'
        }
    },
    icon: {
        fontSize: '1.25rem',
        marginRight: '0.75rem'
    },
    text: {
        color: theme.colors.text.dark,
        flex: 1
    },
    arrow: {
        fontSize: '1.25rem',
        color: theme.colors.primary.main
    },
    iframe: {
        width: '100%',
        height: '400px',
        border: 'none',
        borderRadius: '6px'
    }
};

export default DocumentViewer;
