import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { uploadFileAndConvertHash } from '../../../utils/ipfsUtils';
import { showToast } from '../../../utils/toast';
import createLogger from '../../../utils/logger';
import { sharedStyles, colors, mixins } from '../../../styles/sharedPage';
import '../../../styles/scrollbar.css';
import { useAuth } from '../../../core/context/AuthContext';

const logger = createLogger('AddLandModal');

const getButtonStyle = (variant) => ({
    ...sharedStyles.button,
    background: colors[variant].gradient,
    color: colors.text.inverse,
    '&:hover': {
        background: `linear-gradient(135deg, ${colors[variant].dark} 0%, ${colors[variant].main} 100%)`,
    }
});

const formStyles = {
    form: {
        ...mixins.flexColumn,
        gap: '1.5rem',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
    },
    formSection: {
        ...mixins.glass,
        padding: '1.5rem',
        borderRadius: '12px',
        border: `1px solid ${colors.border.light}`,
        background: colors.background.light,
    },
    fileInput: {
        ...sharedStyles.input,
        padding: '1rem',
        background: colors.background.paper,
        cursor: 'pointer',
        '&:hover': {
            borderColor: colors.primary.main,
        }
    }
};

const AddLandModal = ({ onSubmit, onClose }) => {
    const [uploading, setUploading] = useState(false);
    const { handleContractCall } = useAuth(); // Add this

    const checkAvailability = async (propertyPID, surveyNumber) => {
        try {
            const result = await handleContractCall(
                'landRegistry',
                'isLandIdentifierAvailable',
                [propertyPID, surveyNumber],
                { isView: true }
            );
            return result;
        } catch (error) {
            logger.error('Failed to check availability:', error);
            throw new Error('Failed to verify property details');
        }
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        setUploading(true);
        try {
            // Check availability first
            const [pidAvailable, surveyAvailable] = await checkAvailability(
                values.propertyPID,
                values.surveyNumber
            );

            if (!pidAvailable) {
                throw new Error('Property ID already exists');
            }
            if (!surveyAvailable) {
                throw new Error('Survey number already exists');
            }

            const { bytes32Hash } = await uploadFileAndConvertHash(values.documentFile);
            if (!bytes32Hash) throw new Error('Document processing failed');

            // Format price as string with proper decimal places
            const price = parseFloat(values.price);
            if (isNaN(price) || price <= 0) {
                throw new Error('Invalid price value');
            }
            if (price > 1000000) {
                throw new Error('Price cannot exceed 1,000,000 ETH');
            }

            // Format price with exact 18 decimal places
            const priceString = price.toLocaleString('fullwide', {
                useGrouping: false,
                minimumFractionDigits: 0,
                maximumFractionDigits: 18
            });

            // Log the price conversion
            logger.debug('Price conversion:', {
                input: values.price,
                formatted: priceString
            });

            const formattedData = {
                area: BigInt(Math.floor(Number(values.area))),
                location: values.location.trim(),
                price: priceString, // Send the properly formatted string
                coordinates: values.coordinates.trim(),
                propertyPID: BigInt(Math.floor(Number(values.propertyPID))),
                surveyNumber: values.surveyNumber.trim(),
                documentHash: bytes32Hash
            };

            await onSubmit(formattedData);
            resetForm();
        } catch (error) {
            logger.error('Form submission failed:', error);
            showToast.error(error.message || 'Failed to add land');
        } finally {
            setUploading(false);
            setSubmitting(false);
        }
    };

    // Update validation schema
    const validationSchema = Yup.object({
        area: Yup.number()
            .required('Area is required')
            .min(1, 'Area must be greater than 0')
            .max(1000000, 'Area too large'),
        location: Yup.string()
            .required('Location is required')
            .trim()
            .min(3, 'Location too short')
            .max(200, 'Location too long'),
        price: Yup.number()
            .required('Price is required')
            .positive('Price must be positive')
            .max(1000000, 'Maximum price is 1,000,000 ETH')
            .test('valid-eth', 'Invalid ETH amount', value => {
                if (!value) return false;
                try {
                    const num = Number(value);
                    if (isNaN(num) || num <= 0) return false;
                    // Try formatting to catch potential overflow
                    const formatted = num.toFixed(18);
                    ethers.parseUnits(formatted, 'ether');
                    return true;
                } catch {
                    return false;
                }
            }),
        coordinates: Yup.string()
            .required('Coordinates are required')
            .trim()
            .matches(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/, 'Invalid coordinates format'),
        propertyPID: Yup.number()
            .required('Property ID is required')
            .min(1, 'Property ID must be greater than 0')
            .integer('Property ID must be an integer'),
        surveyNumber: Yup.string()
            .required('Survey number is required')
            .trim()
            .matches(/^[A-Za-z0-9-/]+$/, 'Invalid survey number format'),
        documentFile: Yup.mixed()
            .required('Document required')
            .test('fileSize', 'File too large (max 5MB)',
                file => !file || file.size <= 5 * 1024 * 1024)
            .test('fileType', 'Invalid file type',
                file => !file || ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))
    });

    const formik = useFormik({
        initialValues: {
            area: '',
            location: '',
            price: '',
            coordinates: '',
            propertyPID: '',
            surveyNumber: '',
            documentFile: null
        },
        validationSchema: validationSchema,
        onSubmit: handleSubmit
    });

    return (
        <div style={{ padding: '1rem' }}>
            <form id="addLandForm" onSubmit={formik.handleSubmit} style={formStyles.form}>
                <div style={formStyles.formGrid}>
                    {[
                        { name: 'area', label: 'Area (sq ft)', type: 'number' },
                        {
                            name: 'price',
                            label: 'Price (ETH)',
                            type: 'number',
                            step: '0.000000000000000001', // Allow 18 decimals
                            min: '0.000000000000000001',
                            max: '1000000',
                            placeholder: 'Enter price in ETH'
                        },
                        { name: 'propertyPID', label: 'Property ID', type: 'number' },
                        { name: 'surveyNumber', label: 'Survey Number', type: 'text' }
                    ].map(field => (
                        <div key={field.name} style={formStyles.formSection}>
                            <label style={sharedStyles.label}>{field.label}</label>
                            <input
                                {...field}
                                value={formik.values[field.name]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                style={sharedStyles.input}
                            />
                            {formik.touched[field.name] && formik.errors[field.name] && (
                                <div style={sharedStyles.error}>{formik.errors[field.name]}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Full width inputs */}
                <div style={formStyles.formSection}>
                    <label style={sharedStyles.label}>Location</label>
                    <textarea
                        name="location"
                        value={formik.values.location}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        style={{ ...sharedStyles.input, minHeight: '80px' }}
                    />
                    {formik.touched.location && formik.errors.location && (
                        <div style={sharedStyles.error}>{formik.errors.location}</div>
                    )}
                </div>

                <div style={formStyles.formSection}>
                    <label style={sharedStyles.label}>Coordinates</label>
                    <input
                        name="coordinates"
                        value={formik.values.coordinates}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="e.g., 12.9716,77.5946"
                        style={sharedStyles.input}
                    />
                    {formik.touched.coordinates && formik.errors.coordinates && (
                        <div style={sharedStyles.error}>{formik.errors.coordinates}</div>
                    )}
                </div>

                <div style={formStyles.formSection}>
                    <label style={sharedStyles.label}>Property Documents</label>
                    <input
                        type="file"
                        onChange={(e) => formik.setFieldValue("documentFile", e.currentTarget.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={formStyles.fileInput}
                    />
                    <small style={sharedStyles.helper}>Supported: PDF, JPG, PNG (Max 5MB)</small>
                    {formik.touched.documentFile && formik.errors.documentFile && (
                        <div style={sharedStyles.error}>{formik.errors.documentFile}</div>
                    )}
                </div>
            </form>
            <div style={sharedStyles.modalFooter}>
                <button
                    type="button"
                    onClick={onClose}
                    style={getButtonStyle('secondary')}
                    disabled={uploading}>
                    Cancel
                </button>
                <button
                    type="submit"
                    form="addLandForm"
                    disabled={uploading || !formik.isValid || !formik.dirty}
                    style={getButtonStyle('primary')}>
                    {uploading ? '⌛ Processing...' : '✓ Add Property'}
                </button>
            </div>
        </div>
    );
};

export default AddLandModal;
