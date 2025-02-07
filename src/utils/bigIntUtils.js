import createLogger from './logger';

const logger = createLogger('bigIntUtils');

export const formatBigInt = (value) => {
    try {
        if (value === null || value === undefined) return 0;
        return typeof value === 'bigint' ? Number(value) : Number(value) || 0;
    } catch (error) {
        logger.error('Failed to format BigInt:', { value, error });
        return 0;
    }
};

export const formatContractResponse = (response) => {
    try {
        logger.debug('Formatting contract response:', { type: typeof response });

        if (Array.isArray(response)) {
            logger.debug('Processing array response', { length: response.length });
            return response.map(item => formatContractResponse(item));
        }

        if (response && typeof response === 'object') {
            if (response._isBigNumber || response instanceof BigInt) {
                return formatBigInt(response);
            }

            const formatted = {};
            for (const [key, value] of Object.entries(response)) {
                formatted[key] = formatContractResponse(value);
            }
            return formatted;
        }

        return formatBigInt(response);
    } catch (error) {
        logger.error('Error formatting contract response:', {
            error,
            response: typeof response
        });
        return response;
    }
};
