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
                    const API_URL = import.meta.env.VITE_API_URL;
                    const sessionString = sessionStorage.getItem('ims-session');
                    let token = null;
                    if (sessionString) {
                        try {
                            const sessionData = JSON.parse(sessionString);
                            token = sessionData.token;
                        } catch (e) {}
                    }
                    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                    const response = await axios.post(`${API_URL}/sales`, sale, config);
                    successfulSyncs.push(sale.localId);

                    // Crucial Fix: When an offline sale becomes an online sale, its ID changes.
                    // We must update any pending offline settlements that point to the old offline ID
                    // so they don't fail with "Invoice not found" when they sync.
                    const newSaleId = response.data?.sale?._id || response.data?._id;
                    if (newSaleId) {
                        try {
                            const pSettlements = await localforage.getItem('pendingSettlements');
                            if (pSettlements && pSettlements.length > 0) {
                                let updated = false;
                                const offlineHexId = String(sale.localId).padStart(24, '0').slice(0, 24);
                                const oldInvNo = sale.invoiceNumber || sale.invoiceNo || `INVC-${sale.localId}`;
                                
                                for (const st of pSettlements) {
                                    if (st.allocations && Array.isArray(st.allocations)) {
                                        for (const alloc of st.allocations) {
                                            if (alloc.invoiceId === offlineHexId || alloc.invoiceId === oldInvNo) {
                                                alloc.invoiceId = newSaleId;
                                                updated = true;
                                            }
                                        }
                                    }
                                }
                                if (updated) {
                                    await localforage.setItem('pendingSettlements', pSettlements);
                                }
                            }
                        } catch (e) {
                            console.error("Error updating pending settlements with new sale ID:", e);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to sync sale ${sale.localId}:`, error);
                    // Only discard on 400 (Bad Request) or 409 (Conflict). Do NOT discard on 401 Unauthorized!
                    if (error.response && (error.response.status === 400 || error.response.status === 409)) {
                        console.warn(`Discarding un-syncable sale ${sale.localId} due to permanent backend error`);
                        successfulSyncs.push(sale.localId);
                    }
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
                    const sessionString = sessionStorage.getItem('ims-session');
                    let token = null;
                    if (sessionString) {
                        try {
                            const sessionData = JSON.parse(sessionString);
                            token = sessionData.token;
                        } catch (e) {}
                    }
                    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                    await axios.post(`${API_URL}/returns`, ret, config);
                    successfulSyncs.push(ret.localId);
                } catch (error) {
                    console.error(`Failed to sync return ${ret.localId}:`, error);
                    if (error.response && (error.response.status === 400 || error.response.status === 409)) {
                        console.warn(`Discarding un-syncable return ${ret.localId} due to permanent backend error`);
                        successfulSyncs.push(ret.localId);
                    }
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
                    const sessionString = sessionStorage.getItem('ims-session');
                    let token = null;
                    if (sessionString) {
                        try {
                            const sessionData = JSON.parse(sessionString);
                            token = sessionData.token;
                        } catch (e) {}
                    }
                    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                    await axios.post(`${API_URL}${settlement.endpoint || '/payments'}`, settlement, config);
                    successfulSyncs.push(settlement.localId);
                } catch (error) {
                    console.error(`Failed to sync settlement ${settlement.localId}:`, error);
                    if (error.response && (error.response.status === 400 || error.response.status === 409 || error.response.status === 404)) {
                        console.warn(`Discarding un-syncable settlement ${settlement.localId} due to permanent backend error`);
                        successfulSyncs.push(settlement.localId);
                    }
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
