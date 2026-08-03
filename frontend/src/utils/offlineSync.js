import localforage from 'localforage';
import axios from 'axios';

// Configure localforage to use IndexedDB
localforage.config({
    name: 'POS_Database',
    storeName: 'pending_sales'
});

export const saveSaleOffline = async (saleData) => {
    try {
        const pendingSales = await localforage.getItem('pendingSales') || [];
        // Add a unique local ID and timestamp
        const offlineSale = { ...saleData, localId: Date.now(), isOffline: true };
        pendingSales.push(offlineSale);
        await localforage.setItem('pendingSales', pendingSales);
        return true;
    } catch (error) {
        console.error("Error saving sale offline:", error);
        return false;
    }
};

export const getOfflineSales = async () => {
    try {
        return await localforage.getItem('pendingSales') || [];
    } catch (error) {
        console.error("Error fetching offline sales:", error);
        return [];
    }
};


export const syncOfflineSales = async () => {
    if (!navigator.onLine) return; // Only sync if we are online

    try {
        const pendingSales = await localforage.getItem('pendingSales');

        if (pendingSales && pendingSales.length > 0) {
            console.log(`Attempting to sync ${pendingSales.length} offline sales...`);

            const successfulSyncs = [];

            for (const sale of pendingSales) {
                try {
                    // Attempt to send to backend
                    const API_URL = import.meta.env.VITE_API_URL;
                    await axios.post(`${API_URL}/sales`, sale);
                    successfulSyncs.push(sale.localId);
                } catch (error) {
                    console.error(`Failed to sync sale ${sale.localId}:`, error);
                }
            }

            // Remove successful syncs from local storage
            const remainingSales = pendingSales.filter(
                sale => !successfulSyncs.includes(sale.localId)
            );

            await localforage.setItem('pendingSales', remainingSales);
            console.log("Sync complete!");
        }
    } catch (error) {
        console.error("Error during sync process:", error);
    }
};
