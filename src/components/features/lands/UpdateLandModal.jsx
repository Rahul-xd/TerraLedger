import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../../core/hooks/useUser';
import { useAuth } from '../../../core/context/AuthContext';
import { showToast } from '../../../utils/toast';
import { uploadFileAndConvertHash } from '../../../utils/ipfsUtils';
import { getIpfsUrl } from '../../../utils/ipfsUtils';
import createLogger from '../../../utils/logger';
import { ethers } from 'ethers';
const logger = createLogger('UpdateLandModal');

// Clean, self-contained styles
const styles = {
    container: {
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
    },
    tabs: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        padding: '0.5rem',
    },
    tab: {
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500',
        background: 'transparent',
        color: '#6b7280',
        transition: 'all 0.2s',
    },
    activeTab: {
        background: '#f3f4f6',
        color: '#2563eb',
        fontWeight: '600',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    formSection: {
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
    },
    inputGroup: {
        marginBottom: '1rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: '#374151',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '0.875rem',
    },
    textarea: {
        width: '100%',
        minHeight: '100px',
        padding: '0.75rem',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '0.875rem',
        resize: 'vertical',
    },
    fileInput: {
        width: '100%',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '6px',
        border: '1px dashed #d1d5db',
        cursor: 'pointer',
    },
    button: {
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        border: 'none',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    primaryButton: {
        background: '#2563eb',
        color: 'white',
        '&:hover': { background: '#1d4ed8' },
    },
    resubmitButton: {
        background: '#dc2626',
        color: 'white',
        '&:hover': { background: '#b91c1c' },
    },
    rejectionNotice: {
        padding: '1rem',
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        color: '#dc2626',
    },
    documentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    documentCard: {
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
    },
    documentLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#2563eb',
        textDecoration: 'none',
        padding: '0.75rem',
        borderRadius: '6px',
        background: '#f3f4f6',
        '&:hover': { background: '#e5e7eb' },
    },
    error: {
        color: '#dc2626',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
    }
};

const formatTimestamp = (timestamp) => {
    // Handle BigInt timestamp by converting to string first
    try {
        const timestampNum = typeof timestamp === 'bigint' ?
            Number(timestamp.toString()) :
            Number(timestamp);
        return new Date(timestampNum * 1000).toLocaleDateString();
    } catch (error) {
        logger.error('Error formatting timestamp:', error);
        return 'Unknown date';
    }
};

const UpdateLandModal = ({ land, onClose, onUpdate }) => {
    const { handleContractCall } = useAuth();
    const [tab, setTab] = useState('details');
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const isRejected = !land.isVerified && land.verificationRemark;

    const [formData, setFormData] = useState({
        location: land.location || '',
        coordinates: land.coordinates || '',
        price: land.price ? ethers.formatEther(land.price.toString()) : '0', // Convert BigInt to string first
        description: ''
    });

    // Add new state for metadata documents
    const [metadataDocuments, setMetadataDocuments] = useState([]);

    // Add loading metadata on mount
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const metadata = await handleContractCall(
                    'landRegistry',
                    'getLandMetadata',
                    [land.id],
                    { isView: true }
                );
                setMetadataDocuments(metadata);
            } catch (error) {
                logger.error('Failed to load metadata:', error);
            }
        };
        loadMetadata();
    }, [land.id]);

    // Parse rejection reason to determine which fields need updating
    const getRequiredFields = useCallback(() => {
        const reason = land.verificationRemark.toLowerCase();
        return {
            propertyPID: reason.includes('property id') || reason.includes('pid'),
            surveyNumber: reason.includes('survey'),
            documents: reason.includes('document'),
            location: reason.includes('location'),
            coordinates: reason.includes('coordinates'),
            price: reason.includes('price'),
            area: reason.includes('area')
        };
    }, [land.verificationRemark]);

    const requiredFields = isRejected ? getRequiredFields() : {};

    // Add validation
    const validateForm = () => {
        const errors = {};
        if (isRejected) {
            // Validate all fields for resubmission
            if (!formData.location) errors.location = 'Location is required';
            if (!formData.coordinates) errors.coordinates = 'Coordinates are required';
            if (!formData.area || formData.area <= 0) errors.area = 'Valid area is required';
            if (!formData.price || formData.price <= 0) errors.price = 'Valid price is required';
            if (!formData.propertyPID) errors.propertyPID = 'Property ID is required';
            if (!formData.surveyNumber) errors.surveyNumber = 'Survey number is required';
            if (!formData.documentFile) errors.documentFile = 'Document is required';
        } else {
            // Normal update validations
            if (!formData.location) errors.location = 'Location is required';
            if (!formData.coordinates) errors.coordinates = 'Coordinates are required';
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const errors = validateForm();
            if (Object.keys(errors).length > 0) {
                throw new Error('Please fill all required fields');
            }

            // Convert ETH to Wei for contract, handle string input
            const priceInWei = ethers.parseEther(formData.price.toString());

            // Update only price
            await handleContractCall(
                'landRegistry',
                'updateLandPrice',
                [land.id, priceInWei]
            );

            showToast.success('Land price updated successfully');
            onUpdate();
            onClose();
        } catch (error) {
            logger.error('Update failed:', error);
            showToast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentSubmit = async (e) => {
        e.preventDefault();
        if (!formData.documentFile) {
            showToast.error('Please select a file');
            return;
        }

        setLoading(true);
        try {
            const { bytes32Hash } = await uploadFileAndConvertHash(formData.documentFile);
            await handleContractCall(
                'landRegistry',
                'addLandDocument',
                [land.id, bytes32Hash, formData.description || 'Additional document']
            );

            showToast.success('Document added successfully');
            onUpdate();
            onClose();
        } catch (error) {
            logger.error('Document upload failed:', error);
            showToast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Add new state variables for metadata document form
    const [newDocument, setNewDocument] = useState(null);
    const [description, setDescription] = useState('');

    // Add function to handle metadata document submission
    const handleMetadataSubmit = async (e) => {
        e.preventDefault();

        if (!newDocument) {
            showToast.error('Please select a file');
            return;
        }

        if (!description) {
            showToast.error('Please provide a document description');
            return;
        }

        setLoading(true);
        try {
            const { bytes32Hash } = await uploadFileAndConvertHash(newDocument);

            await handleContractCall(
                'landRegistry',
                'addLandDocument',
                [land.id, bytes32Hash, description]
            );

            // Reset form
            setNewDocument(null);
            setDescription('');

            // Refresh metadata
            const metadata = await handleContractCall(
                'landRegistry',
                'getLandMetadata',
                [land.id],
                { isView: true }
            );
            setMetadataDocuments(metadata);

            showToast.success('Document added successfully');
            onUpdate();
            onClose();
        } catch (error) {
            logger.error('Failed to add metadata document:', error);
            showToast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.tabs}>
                <button
                    onClick={() => setTab('details')}
                    style={{
                        ...styles.tab,
                        ...(tab === 'details' ? styles.activeTab : {})
                    }}>
                    📝 Details
                </button>
                {!isRejected && (
                    <button
                        onClick={() => setTab('documents')}
                        style={{
                            ...styles.tab,
                            ...(tab === 'documents' ? styles.activeTab : {})
                        }}>
                        📄 Documents
                    </button>
                )}
                <button
                    onClick={() => setTab('metadata')}
                    style={{
                        ...styles.tab,
                        ...(tab === 'metadata' ? styles.activeTab : {})
                    }}>
                    Additional Documents
                </button>
            </div>

            {isRejected && (
                <div style={styles.rejectionNotice}>
                    <h4>Property Rejected</h4>
                    <p>Reason: {land.verificationRemark}</p>
                    <p>Please provide all property details for resubmission</p>
                </div>
            )}

            {tab === 'details' && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    {isRejected ? (
                        <div style={styles.formSection}>
                            {/* Price */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Price (ETH) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        price: Number(e.target.value)
                                    }))}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            {/* Location */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Location *</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        location: e.target.value
                                    }))}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            {/* Area */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Area (sq ft) *</label>
                                <input
                                    type="number"
                                    value={formData.area}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        area: Number(e.target.value)
                                    }))}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            {/* Survey Number */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Survey Number *</label>
                                <input
                                    type="text"
                                    value={formData.surveyNumber}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        surveyNumber: e.target.value
                                    }))}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            {/* Property ID */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Property ID *</label>
                                <input
                                    type="number"
                                    value={formData.propertyPID}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        propertyPID: e.target.value
                                    }))}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            {/* Coordinates */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Coordinates *</label>
                                <input
                                    type="text"
                                    value={formData.coordinates}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        coordinates: e.target.value
                                    }))}
                                    style={styles.input}
                                    placeholder="e.g., 12.9716,77.5946"
                                    required
                                />
                            </div>

                            {/* Documents */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Property Documents *</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        documentFile: e.target.files[0]
                                    }))}
                                    style={styles.fileInput}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={styles.formSection}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Price (ETH)</label>
                                <input
                                    type="number"
                                    step="0.000000000000000001" // Allow for 18 decimals
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        price: e.target.value
                                    }))}
                                    style={styles.input}
                                    required
                                    min="0"
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                    style={styles.textarea}
                                    placeholder="Describe the price change..."
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                ...styles.button,
                                background: '#9ca3af',
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                ...styles.button,
                                ...(isRejected ? styles.resubmitButton : styles.primaryButton)
                            }}
                            disabled={loading}
                        >
                            {loading ? '⌛ Processing...' : isRejected ? '🔄 Resubmit Land' : '✓ Update Price'}
                        </button>
                    </div>
                </form>
            )}

            {tab === 'documents' && !isRejected && (
                <div style={styles.formSection}>
                    {documents.length > 0 && (
                        <div style={styles.documentGrid}>
                            {documents.map((doc, index) => (
                                <div key={index} style={styles.documentCard}>
                                    <a
                                        href={getIpfsUrl(doc)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.documentLink}
                                    >
                                        📄 View Document {index + 1}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleDocumentSubmit}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Upload New Document</label>
                            <input
                                type="file"
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    documentFile: e.target.files[0]
                                }))}
                                style={styles.fileInput}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Document Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                style={styles.textarea}
                                placeholder="Describe this document..."
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    ...styles.button,
                                    background: '#9ca3af',
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{ ...styles.button, ...styles.primaryButton }}
                                disabled={loading || !formData.documentFile}
                            >
                                {loading ? '⌛ Uploading...' : '📤 Upload Document'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tab === 'metadata' && (
                <div style={styles.formSection}>
                    <h3>Additional Property Documents</h3>

                    {/* Display existing metadata documents */}
                    {metadataDocuments?.documents?.map((hash, index) => (
                        <div key={index} style={styles.documentCard}>
                            <a
                                href={getIpfsUrl(hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.documentLink}
                            >
                                📄 View Document
                            </a>
                            <p>{metadataDocuments.descriptions[index]}</p>
                            <span>
                                Added: {formatTimestamp(metadataDocuments.lastUpdated)}
                            </span>
                        </div>
                    ))}

                    {/* Form to add new metadata document */}
                    <form onSubmit={handleMetadataSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Upload Document</label>
                            <input
                                type="file"
                                onChange={(e) => setNewDocument(e.target.files[0])}
                                style={styles.fileInput}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Document Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={styles.textarea}
                                placeholder="Describe this document..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    ...styles.button,
                                    background: '#9ca3af',
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{ ...styles.button, ...styles.primaryButton }}
                                disabled={loading || !newDocument}
                            >
                                {loading ? '⌛ Uploading...' : '📤 Add Document'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UpdateLandModal;
