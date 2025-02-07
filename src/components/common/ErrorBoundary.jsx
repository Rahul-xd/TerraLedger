import React from 'react';
import createLogger from '../../utils/logger';
import { theme } from '../../styles/theme';
import Button from './Button';

const logger = createLogger('ErrorBoundary');

class ErrorBoundary extends React.Component {
    state = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('Error caught by boundary:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
        // Attempt to recover by reloading the page
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const styles = {
                container: {
                    padding: '2rem',
                    maxWidth: '600px',
                    margin: '2rem auto',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: theme.shadows.medium
                },
                heading: {
                    color: theme.colors.error,
                    marginBottom: '1rem'
                },
                message: {
                    color: theme.colors.text.secondary,
                    marginBottom: '2rem'
                },
                details: {
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: theme.colors.background.light,
                    borderRadius: '4px',
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace'
                }
            };

            return (
                <div style={styles.container}>
                    <h1 style={styles.heading}>Oops! Something went wrong</h1>
                    <p style={styles.message}>
                        We're sorry for the inconvenience. The error has been logged and we'll look into it.
                    </p>
                    <Button
                        variant="primary"
                        onClick={this.handleReset}
                    >
                        Reload Application
                    </Button>

                    {process.env.NODE_ENV === 'development' && (
                        <div style={styles.details}>
                            <p>{this.state.error?.toString()}</p>
                            <pre>{this.state.errorInfo?.componentStack}</pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
