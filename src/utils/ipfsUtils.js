import bs58 from 'bs58';
import axios from 'axios';
import { ethers } from 'ethers';
import { IPFS_CONFIG } from '../core/config';
import createLogger from './logger';

const logger = createLogger('ipfsUtils');

// Helper function to convert bytes32 to IPFS hash (Qm... format)
export const bytesToIpfsHash = (bytes32Hex) => {
    try {
        if (!bytes32Hex || bytes32Hex === '0x' + '0'.repeat(64)) {
            throw new Error('Invalid bytes32 input');
        }

        // Remove 0x prefix and get the raw hash part
        const hex = bytes32Hex.slice(2);

        // Convert hex to bytes
        const hashHex = new Uint8Array(
            hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );

        // Create the multihash format: 
        // 0x1220 (18 32 in decimal) for sha2-256 followed by 32 bytes of hash
        const multiHashBytes = new Uint8Array([18, 32, ...hashHex]);

        // Convert to base58
        const ipfsHash = bs58.encode(multiHashBytes);

        logger.debug('IPFS hash conversion:', {
            input: bytes32Hex,
            output: ipfsHash,
            multiHashPrefix: [18, 32],
            hashBytes: Array.from(hashHex)
        });

        return ipfsHash;
    } catch (error) {
        logger.error('Error converting bytes to IPFS hash:', error);
        return null;
    }
};

// Update IPFS hash to bytes32 conversion to match
export const ipfsHashToBytes32 = (ipfsHash) => {
    try {
        // Input validation
        if (!ipfsHash || typeof ipfsHash !== 'string') {
            throw new Error('Invalid IPFS hash: must be a non-empty string');
        }

        // Ensure hash is in correct format
        if (!ipfsHash.startsWith('Qm')) {
            throw new Error('Invalid IPFS hash format: must start with Qm');
        }

        // Decode base58 string
        const bytes = bs58.decode(ipfsHash);

        // Remove the first two bytes (multihash prefix)
        const hashBytes = Array.from(bytes.slice(2));

        // Convert to hex and pad
        const hex = hashBytes.map(b => b.toString(16).padStart(2, '0')).join('');
        const bytes32 = '0x' + hex.padEnd(64, '0');

        logger.debug('IPFS hash conversion:', {
            input: ipfsHash,
            output: bytes32,
            hashBytes
        });

        return bytes32;
    } catch (error) {
        logger.error('Error converting IPFS hash to bytes32:', error);
        return null; // Return null instead of throwing
    }
};

// Update IPFS URL generation with better logging
export const getIpfsUrl = (bytes32Hash) => {
    try {
        if (!bytes32Hash || bytes32Hash === '0x' + '0'.repeat(64)) {
            throw new Error('Invalid document hash');
        }

        const ipfsHash = bytesToIpfsHash(bytes32Hash);
        if (!ipfsHash) {
            throw new Error('Invalid IPFS hash conversion');
        }

        logger.debug('IPFS conversion:', {
            original: bytes32Hash,
            converted: ipfsHash
        });

        return `${IPFS_CONFIG.PINATA_GATEWAY}/${ipfsHash}`;
    } catch (error) {
        logger.error('Error getting IPFS URL:', error);
        return null;
    }
};

export const uploadToIPFS = async (file) => {
    const correlationId = Date.now();
    logger.info(`[${correlationId}] Starting IPFS upload`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });

    if (!file) {
        logger.error(`[${correlationId}] Upload failed: No file provided`);
        throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        logger.debug(`[${correlationId}] Sending file to IPFS`, {
            endpoint: IPFS_CONFIG.baseURL
        });

        const response = await axios.post(IPFS_CONFIG.baseURL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                pinata_api_key: IPFS_CONFIG.apiKey,
                pinata_secret_api_key: IPFS_CONFIG.secretKey,
            },
            timeout: 30000
        });

        if (!response?.data?.IpfsHash) {
            logger.error(`[${correlationId}] Invalid IPFS response`, response.data);
            throw new Error('Invalid IPFS response');
        }

        logger.info(`[${correlationId}] File uploaded successfully`, {
            ipfsHash: response.data.IpfsHash
        });

        return response.data.IpfsHash;
    } catch (error) {
        logger.error(`[${correlationId}] IPFS upload failed:`, {
            error: error.message,
            code: error.code,
            response: error.response?.data
        });

        if (error.code === 'ECONNABORTED') {
            throw new Error('IPFS upload timeout');
        }
        throw new Error(error.response?.data?.message || 'IPFS upload failed');
    }
};

export const uploadFileAndConvertHash = async (file) => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Upload file first
        const ipfsHash = await uploadToIPFS(file);
        if (!ipfsHash) {
            throw new Error('IPFS upload failed');
        }

        // Convert to bytes32
        const bytes32Hash = ipfsHashToBytes32(ipfsHash);
        if (!bytes32Hash) {
            throw new Error('Failed to convert IPFS hash');
        }

        return {
            ipfsHash,
            bytes32Hash
        };
    } catch (error) {
        logger.error('Failed to process file:', error);
        throw error;
    }
};