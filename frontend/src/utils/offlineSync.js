import localforage from 'localforage';
import axios from 'axios';

export const cacheLoginCredentials = async (username, password, sessionData) => {
    try {
        const credentials = await localforage.getItem('offlineCredentials') || {};
        credentials[username] = {
            password: btoa(password), 
            sessionData
        };
        await localforage.setItem('offlineCredentials', credentials);
    } catch (error) {
        console.error("Error caching credentials:", error);
    }
};

export const attemptOfflineLogin = async (username, password) => {
    try {
        const credentials = await localforage.getItem('offlineCredentials') || {};
        const userCreds = credentials[username];
        if (userCreds && userCreds.password === btoa(password)) {
            return userCreds.sessionData;
        }
        return null;
    } catch (error) {
        console.error("Error attempting offline login:", error);
        return null;
    }
};

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

export const saveReturnOffline = async (returnData) => {
    try {
        const pendingReturns = await localforage.getItem('pendingReturns') || [];
        const offlineReturn = { ...returnData, localId: Date.now(), isOffline: true };
        pendingReturns.push(offlineReturn);
        await localforage.setItem('pendingReturns', pendingReturns);
        return true;
    } catch (error) {
        console.error("Error saving return offline:", error);
        return false;
    }
};

export const getOfflineReturns = async () => {
    try {
        return await localforage.getItem('pendingReturns') || [];
    } catch (error) {
        console.error("Error fetching offline returns:", error);
        return [];
    }
};

export const syncOfflineReturns = async () => {
    if (!navigator.onLine) return;

    try {
        const pendingReturns = await localforage.getItem('pendingReturns');
        if (pendingReturns && pendingReturns.length > 0) {
            console.log(`Attempting to sync ${pendingReturns.length} offline returns...`);
            const successfulSyncs = [];
            for (const ret of pendingReturns) {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    await axios.post(`${API_URL}/returns`, ret);
                    successfulSyncs.push(ret.localId);
                } catch (error) {
                    console.error(`Failed to sync return ${ret.localId}:`, error);
                }
            }
            const remainingReturns = pendingReturns.filter(
                ret => !successfulSyncs.includes(ret.localId)
            );
            await localforage.setItem('pendingReturns', remainingReturns);
            console.log("Returns sync complete!");
        }
    } catch (error) {
        console.error("Error during returns sync process:", error);
    }
};

export const saveSettlementOffline = async (settlementData, endpoint) => {
    try {
        const pendingSettlements = await localforage.getItem('pendingSettlements') || [];
        const offlineSettlement = { ...settlementData, endpoint, localId: Date.now(), isOffline: true };
        pendingSettlements.push(offlineSettlement);
        await localforage.setItem('pendingSettlements', pendingSettlements);
        return true;
    } catch (error) {
        console.error("Error saving settlement offline:", error);
        return false;
    }
};

export const getOfflineSettlements = async () => {
    try {
        return await localforage.getItem('pendingSettlements') || [];
    } catch (error) {
        console.error("Error fetching offline settlements:", error);
        return [];
    }
};

export const syncOfflineSettlements = async () => {
    if (!navigator.onLine) return;

    try {
        const pendingSettlements = await localforage.getItem('pendingSettlements');
        if (pendingSettlements && pendingSettlements.length > 0) {
            console.log(`Attempting to sync ${pendingSettlements.length} offline settlements...`);
            const successfulSyncs = [];
            for (const settlement of pendingSettlements) {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    await axios.post(`${API_URL}${settlement.endpoint || '/payments'}`, settlement);
                    successfulSyncs.push(settlement.localId);
                } catch (error) {
                    console.error(`Failed to sync settlement ${settlement.localId}:`, error);
                }
            }
            const remainingSettlements = pendingSettlements.filter(
                settlement => !successfulSyncs.includes(settlement.localId)
            );
            await localforage.setItem('pendingSettlements', remainingSettlements);
            console.log("Settlements sync complete!");
        }
    } catch (error) {
        console.error("Error during settlements sync process:", error);
    }
};
