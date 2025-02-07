import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import { ROUTES } from '../../core/config';
import { getRoleFromUser, getRedirectRoute, ROLES } from '../../core/hooks/useRoles';
import { uploadFileAndConvertHash } from '../../utils/ipfsUtils';
import { theme } from '../../styles/theme';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { showToast } from '../../utils/toast';

const styles = {
    pageWrapper: {
        minHeight: 'calc(100vh - 80px)', // Account for navbar
        background: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
    },
    container: {
        width: '100%',
        maxWidth: '1400px',
        minHeight: '800px',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '0',
        background: '#ffffff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
    },
    formSection: {
        padding: '3.5rem 4rem',
        overflowY: 'auto',
        height: '100%',
    },
    formHeader: {
        marginBottom: '3rem',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: '1rem',
        lineHeight: '1.2',
    },
    subtitle: {
        fontSize: '1.125rem',
        color: '#666',
        lineHeight: '1.6',
    },
    form: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem',
        marginBottom: '2rem',
    },
    fullWidth: {
        gridColumn: '1 / -1',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    label: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        width: '100%',
        padding: '0.875rem 1rem',
        fontSize: '1rem',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
        backgroundColor: '#fff',
        '&:focus': {
            outline: 'none',
            borderColor: theme.colors.primary.main,
            boxShadow: `0 0 0 4px ${theme.colors.primary.light}25`,
        },
        '&:hover': {
            borderColor: theme.colors.primary.main,
        },
    },
    fileUploadContainer: {
        border: '2px dashed #e5e7eb',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#fafafa',
        transition: 'all 0.2s ease',
        '&:hover': {
            borderColor: theme.colors.primary.main,
        }
    },
    fileUploadText: {
        fontSize: '1rem',
        color: '#666',
        marginBottom: '0.5rem',
    },
    fileUploadSubtext: {
        fontSize: '0.875rem',
        color: '#999',
    },
    error: {
        color: theme.colors.error,
        fontSize: '0.875rem',
        fontWeight: '500',
        marginTop: '0.25rem',
    },
    submitButton: {
        gridColumn: '1 / -1',
        padding: '1rem',
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#fff',
        backgroundColor: theme.colors.primary.main,
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: theme.colors.primary.dark,
            transform: 'translateY(-1px)',
        },
        '&:disabled': {
            backgroundColor: '#9ca3af',
            cursor: 'not-allowed',
            transform: 'none',
        },
    },
    infoSection: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2.5rem',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    },
    infoCard: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    infoTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#fff',
    },
    infoText: {
        fontSize: '1rem',
        lineHeight: '1.7',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    processingState: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
    },
    spinner: {
        width: '20px',
        height: '20px',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        borderTopColor: '#fff',
        animation: 'spin 1s linear infinite',
    },
    '@media (max-width: 1024px)': {
        container: {
            gridTemplateColumns: '1fr',
            maxWidth: '700px',
        },
        formSection: {
            padding: '2.5rem 2rem',
        },
        infoSection: {
            display: 'none',
        },
        form: {
            gridTemplateColumns: '1fr',
        },
    },
    '@keyframes spin': {
        to: { transform: 'rotate(360deg)' },
    },
};

// Common error messages map
const errorMessages = {
    'DuplicateAadhar': 'This Aadhar number is already registered',
    'DuplicatePan': 'This PAN number is already registered',
    'user rejected': 'Transaction rejected by user',
    'execution reverted': 'Transaction failed - Invalid data'
};

// Add document validation helper
const validateDocument = (file) => {
    if (!file) return false;
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    return validTypes.includes(file.type) && file.size <= maxSize;
};

// Simplify document upload component
const DocumentUpload = ({ formik }) => (
    <div style={styles.formGroup}>
        <label style={styles.label}>Identity Document</label>
        <div style={styles.fileUploadContainer}>
            <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => formik.setFieldValue("documentFile", e.currentTarget.files?.[0])}
                style={{ display: 'none' }}
                id="documentFile"
            />
            <label htmlFor="documentFile">
                {formik.values.documentFile ? (
                    <p style={styles.fileUploadText}>
                        Selected: {formik.values.documentFile.name}
                    </p>
                ) : (
                    <p style={styles.fileUploadText}>
                        Upload Aadhar Card, PAN Card or Photo ID (PDF/JPG/PNG)
                    </p>
                )}
            </label>
        </div>
        {formik.touched.documentFile && formik.errors.documentFile && (
            <span style={styles.error}>{formik.errors.documentFile}</span>
        )}
    </div>
);

// Simplified info section
const InfoSection = () => (
    <div style={styles.infoSection}>
        <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Registration Requirements</h3>
            <p style={styles.infoText}>
                • Government ID (Aadhar/PAN)<br />
                • Valid Email Address<br />
                • Clear Document Scans<br />
                • Age 18 or Above
            </p>
        </div>
        <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Process</h3>
            <p style={styles.infoText}>
                1. Fill Details<br />
                2. Upload Documents<br />
                3. Submit & Wait for Verification<br />
                4. Access Platform
            </p>
        </div>
    </div>
);

const Register = () => {
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();
    const { authState, handleContractCall, refreshUserStatus } = useAuth();

    // Add essential redirects only
    useEffect(() => {
        if (!authState.currentUser?.address) {
            navigate('/', { replace: true });
            return;
        }

        if (authState.currentUser.isRegistered && !authState.currentUser.isRejected) {
            navigate(ROUTES.PENDING, { replace: true });
        }
    }, [authState.currentUser, navigate]);

    // Add cooldown check
    useEffect(() => {
        if (authState.currentUser?.isRejected) {
            const checkCooldown = async () => {
                const cooldown = await handleContractCall(
                    'userRegistry',
                    'getRejectionCooldown',
                    [authState.currentUser.address],
                    { isView: true }
                );
                if (cooldown > 0) {
                    setError(`Please wait ${Math.ceil(cooldown / 3600)} hours before trying again`);
                }
            };
            checkCooldown();
        }
    }, [authState.currentUser, handleContractCall]);

    // Add error mapping
    const ERROR_MESSAGES = {
        'InvalidAadharFormat': 'Invalid Aadhar number format',
        'InvalidPanFormat': 'Invalid PAN number format',
        'DuplicateAadhar': 'This Aadhar number is already registered',
        'DuplicatePan': 'This PAN number is already registered',
        'UserAlreadyExists': 'User is already registered',
        'RejectionCooldownActive': 'Please wait before trying to register again'
    };

    // Update handleRegistration function
    const handleRegistration = async (values) => {
        setProcessing(true);
        try {
            // 1. Format the input values
            const formattedValues = {
                ...values,
                aadharNumber: values.aadharNumber.replace(/\s/g, ''),
                panNumber: values.panNumber.toUpperCase(),
                age: Number(values.age)
            };

            // 2. Validate document before upload
            if (!validateDocument(formattedValues.documentFile)) {
                throw new Error('Invalid document file');
            }

            // 3. Upload document
            const { bytes32Hash } = await uploadFileAndConvertHash(formattedValues.documentFile);

            // 4. Call contract with proper error handling
            await handleContractCall(
                'userRegistry',
                'registerUser',
                [
                    formattedValues.name.trim(),
                    formattedValues.age,
                    formattedValues.city.trim(),
                    formattedValues.aadharNumber,
                    formattedValues.panNumber,
                    bytes32Hash,
                    formattedValues.email.toLowerCase().trim()
                ]
            );

            // 5. Show success and redirect
            showToast.success('Registration successful!');
            await refreshUserStatus();
            navigate(ROUTES.PENDING);
        } catch (error) {
            console.error('Registration error:', error);

            // Extract custom error signature
            const errorMessage = error.message || '';
            const customError = Object.keys(ERROR_MESSAGES).find(key =>
                errorMessage.includes(key)
            );

            showToast.error(
                ERROR_MESSAGES[customError] ||
                'Registration failed. Please check your input and try again.'
            );
        } finally {
            setProcessing(false);
        }
    };

    // Essential validation schema
    const validationSchema = Yup.object().shape({
        name: Yup.string()
            .required('Name is required')
            .min(2, 'Name too short')
            .max(1000, 'Name too long') // Match contract max length
            .trim(),
        age: Yup.number()
            .transform((value) => (isNaN(value) ? undefined : Number(value)))
            .required('Age is required')
            .min(18, 'Must be at least 18 years')
            .max(120, 'Invalid age'),
        city: Yup.string()
            .required('City is required')
            .min(2, 'City name too short')
            .max(1000, 'City name too long') // Match contract max length
            .trim(),
        email: Yup.string()
            .required('Email is required')
            .email('Invalid email format')
            .max(1000, 'Email too long') // Match contract max length
            .trim(),
        // Match exact contract format requirements
        aadharNumber: Yup.string()
            .required('Aadhar number is required')
            .matches(/^\d{12}$/, 'Must be exactly 12 digits')
            .trim(),
        panNumber: Yup.string()
            .required('PAN number is required')
            .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Must match format: ABCDE1234F')
            .trim(),
        documentFile: Yup.mixed()
            .required('Document required')
            .test('fileSize', 'File too large (max 10MB)',
                file => !file || file.size <= 10 * 1024 * 1024)
            .test('fileType', 'Invalid file type',
                file => !file || ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type))
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            age: '',
            city: '',
            email: '',
            aadharNumber: '',
            panNumber: '',
            documentFile: null
        },
        validationSchema,
        onSubmit: handleRegistration
    });

    // Single form render
    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                <div style={styles.formSection}>
                    <div style={styles.formHeader}>
                        <h1 style={styles.title}>Complete Your Registration</h1>
                        <p style={styles.subtitle}>
                            Please provide your details to create your account and start using our platform.
                        </p>
                    </div>

                    <form onSubmit={formik.handleSubmit} style={styles.form}>
                        {/* Personal Information */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input
                                {...formik.getFieldProps('name')}
                                style={styles.input}
                                placeholder="Enter your full name"
                            />
                            {formik.touched.name && formik.errors.name && (
                                <span style={styles.error}>{formik.errors.name}</span>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Age</label>
                            <input
                                type="number"
                                {...formik.getFieldProps('age')}
                                style={styles.input}
                                placeholder="Enter your age"
                                min="18"
                            />
                            {formik.touched.age && formik.errors.age && (
                                <span style={styles.error}>{formik.errors.age}</span>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>City</label>
                            <input
                                {...formik.getFieldProps('city')}
                                style={styles.input}
                                placeholder="Enter your city"
                            />
                            {formik.touched.city && formik.errors.city && (
                                <span style={styles.error}>{formik.errors.city}</span>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                {...formik.getFieldProps('email')}
                                style={styles.input}
                                placeholder="Enter your email"
                            />
                            {formik.touched.email && formik.errors.email && (
                                <span style={styles.error}>{formik.errors.email}</span>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Aadhar Number</label>
                            <input
                                {...formik.getFieldProps('aadharNumber')}
                                style={styles.input}
                                placeholder="Enter your Aadhar number"
                            />
                            {formik.touched.aadharNumber && formik.errors.aadharNumber && (
                                <span style={styles.error}>{formik.errors.aadharNumber}</span>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>PAN Number</label>
                            <input
                                {...formik.getFieldProps('panNumber')}
                                style={styles.input}
                                placeholder="Enter your PAN number"
                            />
                            {formik.touched.panNumber && formik.errors.panNumber && (
                                <span style={styles.error}>{formik.errors.panNumber}</span>
                            )}
                        </div>

                        {/* Replace old document upload with new component */}
                        <DocumentUpload formik={formik} />

                        <button
                            type="submit"
                            disabled={processing || !formik.isValid || !formik.dirty}
                            style={styles.submitButton}
                        >
                            <div style={styles.processingState}>
                                {processing ? (
                                    <>
                                        <span>Processing</span>
                                        <div style={styles.spinner} />
                                    </>
                                ) : (
                                    'Complete Registration'
                                )}
                            </div>
                        </button>
                    </form>
                </div>

                {/* Replace old info section with new component */}
                <InfoSection />
            </div>
        </div>
    );
};

export default Register;
