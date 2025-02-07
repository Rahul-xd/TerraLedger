import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import createLogger from '../../utils/logger';
import { CHAIN_CONFIG } from '../config'; // Add this import

const useWeb3 = () => {
    const logger = createLogger('useWeb3');
    const [state, setState] = useState({
        account: null,
        provider: null,
        signer: null,
        isConnecting: false,
        isInitialized: false,
        error: null
    });

    // Remove auto-initialization
    useEffect(() => {
        setState(prev => ({ ...prev, isInitialized: true }));
        return () => {
            sessionStorage.removeItem('web3State');
        };
    }, []);

    // Update checkConnection to handle network switch
    const checkConnection = useCallback(async () => {
        logger.debug('Checking wallet connection...');
        if (!window.ethereum) {
            throw new Error('Please install MetaMask');
        }

        try {
            // Get chain ID first
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            logger.debug('Current chainId:', { chainId });

            // Switch network if needed
            if (chainId.toLowerCase() !== CHAIN_CONFIG.hardhatChainId) {
                logger.debug('Switching to Hardhat network...');
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: CHAIN_CONFIG.hardhatChainId }]
                    });
                } catch (switchError) {
                    logger.error('Network switch failed:', switchError);
                    throw new Error('Please switch to Hardhat network');
                }
            }

            // Then request accounts
            logger.debug('Requesting accounts...');
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            return accounts[0];
        } catch (error) {
            logger.error('Connection check failed:', error);
            throw error;
        }
    }, [logger]);

    // Update connect function to ensure consistent address
    const connect = useCallback(async () => {
        if (state.isConnecting) return null;
        setState(prev => ({ ...prev, isConnecting: true }));

        try {
            // Check if MetaMask is installed
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            // Switch network first
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CHAIN_CONFIG.hardhatChainId }]
            });

            // Get accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts?.[0]) {
                throw new Error('No account found');
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Verify signer matches selected account
            const signerAddress = await signer.getAddress();
            if (signerAddress.toLowerCase() !== accounts[0].toLowerCase()) {
                throw new Error('Signer address mismatch');
            }

            const newState = {
                account: accounts[0],
                provider,
                signer,
                isInitialized: true,
                isConnecting: false,
                error: null
            };

            setState(newState);
            logger.debug('Web3 connection successful:', { account: accounts[0] });

            return { success: true, ...newState };
        } catch (error) {
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error.message
            }));
            throw error;
        }
    }, [state.isConnecting]);

    // Clean disconnect function
    const disconnect = useCallback(async () => {
        try {
            // Clear web3 state first
            sessionStorage.removeItem('web3State');
            // Reset provider state
            if (window.ethereum) {
                await window.ethereum.request({
                    method: "eth_accounts",
                    params: []
                });
            }
            // Reset state
            setState({
                account: null,
                provider: null,
                signer: null,
                isInitialized: true,
                isConnecting: false
            });

            logger.debug('Web3 state cleared completely');
            return true;
        } catch (error) {
            logger.error('Disconnect error:', error);
            return false;
        }
    }, [logger]);

    return {
        ...state,
        connect,
        disconnect
    };
};

export default useWeb3;
