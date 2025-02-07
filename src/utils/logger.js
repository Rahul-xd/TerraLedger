const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const LOG_COLORS = {
    ERROR: '#FF6B6B',
    WARN: '#FFB036',
    INFO: '#4CAF50',
    DEBUG: '#2196F3'
};

// Track recent logs to prevent duplicates
const recentLogs = new Map();
const LOG_DEDUP_INTERVAL = 1000; // 1 second
const LOG_DEDUP_MAX_SIZE = 1000;

const serializeForLogging = (obj) => {
    if (!obj) return '';
    try {
        return JSON.stringify(obj, (_, value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            if (value instanceof Error) {
                return {
                    message: value.message,
                    stack: value.stack,
                    ...value
                };
            }
            return value;
        }, 2);
    } catch (error) {
        return String(obj);
    }
};

const getLogKey = (component, level, message, data) => {
    return `${component}-${level}-${message}-${serializeForLogging(data)}`;
};

const cleanupOldLogs = () => {
    const now = Date.now();
    for (const [key, timestamp] of recentLogs.entries()) {
        if (now - timestamp > LOG_DEDUP_INTERVAL) {
            recentLogs.delete(key);
        }
    }
    // Prevent memory leaks by limiting size
    if (recentLogs.size > LOG_DEDUP_MAX_SIZE) {
        const entriesToDelete = Array.from(recentLogs.entries())
            .sort(([, a], [, b]) => a - b)
            .slice(0, recentLogs.size - LOG_DEDUP_MAX_SIZE);
        entriesToDelete.forEach(([key]) => recentLogs.delete(key));
    }
};

const shouldLog = (key) => {
    const now = Date.now();
    if (recentLogs.has(key)) {
        const lastLog = recentLogs.get(key);
        if (now - lastLog < LOG_DEDUP_INTERVAL) {
            return false;
        }
    }
    recentLogs.set(key, now);
    cleanupOldLogs();
    return true;
};

const createLogger = (component) => {
    const logWithLevel = (level, message, data) => {
        const logKey = getLogKey(component, level, message, data);
        if (!shouldLog(logKey)) return;

        const timestamp = new Date().toISOString();
        const dataStr = data ? serializeForLogging(data) : '';
        const icon = {
            ERROR: '❌',
            WARN: '⚠️',
            INFO: 'ℹ️',
            DEBUG: '🔍'
        }[level];

        console[level.toLowerCase()](
            `[${timestamp}] ${icon} ${component}: ${message}`,
            dataStr ? JSON.parse(dataStr) : ''
        );
    };

    return {
        error: (message, error) => logWithLevel('ERROR', message, error),
        warn: (message, data) => logWithLevel('WARN', message, data),
        info: (message, data) => logWithLevel('INFO', message, data),
        debug: (message, data) => logWithLevel('DEBUG', message, data),

        // Group related logs
        group: (groupName, fn) => {
            console.group(`[${component}] ${groupName}`);
            try {
                fn();
            } finally {
                console.groupEnd();
            }
        },

        // Track performance
        time: (label) => {
            console.time(`[${component}] ${label}`);
        },
        timeEnd: (label) => {
            console.timeEnd(`[${component}] ${label}`);
        }
    };
};

export default createLogger;
