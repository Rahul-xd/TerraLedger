import { toast } from 'react-toastify';

const toastConfig = {
    position: "top-right",
    autoClose: 5000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
};

export const showToast = {
    success: (message) => toast.success(message, toastConfig),
    error: (message) => toast.error(message, toastConfig),
    info: (message) => toast.info(message, toastConfig),
    warning: (message) => toast.warning(message, toastConfig),
    transaction: {
        pending: (message) => toast.loading(message, {
            ...toastConfig,
            autoClose: false
        }),
        success: (message) => {
            toast.dismiss();
            toast.success(message, toastConfig);
        },
        error: (error) => {
            toast.dismiss();
            toast.error(
                error?.message || error?.toString() || 'Transaction failed',
                toastConfig
            );
        }
    }
};

export const dismissToasts = () => toast.dismiss();