import {
  useDeferredValue,
  useEffect,
  useState,
  useTransition
} from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import _BarcodeReader from 'react-barcode-reader'

const BarcodeReader = _BarcodeReader.default || _BarcodeReader

// Components
import { NoticeBanner } from './components/NoticeBanner'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'

// Pages
import { Login } from './pages/Login'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { CashierDashboard } from './pages/cashier/CashierDashboard'
import { POS } from './pages/cashier/POS'
import SalesHistory from './pages/cashier/SalesHistory'
import { Inventory } from './pages/admin/Inventory'
import { Reports } from './pages/admin/Reports'
import { ProductManager } from './pages/admin/ProductManager'
import Suppliers from './pages/admin/Suppliers'
import Customers from './pages/admin/Customers'
import Purchases from './pages/admin/Purchases'
import Invoices from './pages/admin/Invoices'
import AccountStatement from './pages/admin/AccountStatement'
import Returns from './pages/admin/Returns'
import { Notifications } from './pages/admin/Notifications'
import { PaymentAllocation } from './pages/admin/PaymentAllocation'
import StaffManagement from './pages/admin/StaffManagement'
import StaffForm from './pages/admin/StaffForm'
import { Settlements } from './pages/cashier/Settlements'
import CompanyProfile from './pages/admin/CompanyProfile'

// Super Admin Pages
import { SuperAdminDashboard } from './pages/super_admin/Dashboard'
import { BranchManagement } from './pages/super_admin/Branches'
import { BranchDetails } from './pages/super_admin/BranchDetails'
import { SuperAdminReports } from './pages/super_admin/Reports'
import { InventoryTransfer } from './pages/super_admin/InventoryTransfer'
import SuperAdminReturns from './pages/super_admin/Returns'

// Utils
import {
  authConfig,
  formatCurrency,
  printReceipt,
  readErrorMessage,
  roundCurrency,
  normalizeUrl,
} from './utils'

const api = axios.create({
  baseURL: normalizeUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api'),
})

const demoCredentials = [
  {
    label: 'Super Admin Demo',
    email: 'superadmin@gmail.com',
    password: 'superadmin123',
    role: 'Multi-branch operations and consolidated analytics',
  },
  {
    label: 'Admin Demo',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'Full reporting and inventory access',
  },
  {
    label: 'Cashier Demo',
    email: 'cashier@gmail.com',
    password: 'cashier123',
    role: 'Billing and stock browsing access',
  },
]

const emptyProductForm = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  description: '',
  unit: 'pcs',
  price: '0',
  costPrice: '0',
  loyaltyDiscount: '0',
  quantityInStock: '0',
  reorderLevel: '0',
  rack: {
    rowNumber: '1',
    columnNumber: '1',
    shelfNumber: '1',
  },
  image: '',
  imageFile: null,
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ims-theme') || 'light')
  const [session, setSession] = useState(() => {
    const saved = sessionStorage.getItem('ims-session')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const location = useLocation()
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()

  // Map pathname to activeView for legacy component compatibility
  const activeView = location.pathname === '/' ? 'overview' : location.pathname.slice(1).replace('/', '-')

  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
  })
  const [overview, setOverview] = useState(null)
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [reportRange, setReportRange] = useState('weekly')
  const [report, setReport] = useState(null)
  const [company, setCompany] = useState(null)
  const [customers, setCustomers] = useState([])
  const [catalogQuery, setCatalogQuery] = useState('')
  const [inventoryQuery, setInventoryQuery] = useState('')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [barcodeValue, setBarcodeValue] = useState('')
  const [cart, setCart] = useState([])
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: 'Walk-in customer',
    customerId: '',
    loyaltyCard: '',
    paymentMethod: 'cash',
    discount: '0',
    notes: '',
  })
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [editingProductId, setEditingProductId] = useState('')
  const [editingStaff, setEditingStaff] = useState(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [busyAction, setBusyAction] = useState('')
  const [notice, setNotice] = useState(null)

  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ims-read-notifications')) || []
    } catch {
      return []
    }
  })
  const [hasShownPopup, setHasShownPopup] = useState(false)

  // Auto-generate SKU for new products once data is loaded
  useEffect(() => {
    if (products.length > 0 && !editingProductId) {
      setProductForm(prev => ({ ...prev, sku: generateNextSKU() }))
    }
  }, [products, editingProductId])

  const notifications = products
    .filter((p) => p.quantityInStock <= p.reorderLevel)
    .map((p) => ({
      id: `low-stock-${p._id}`,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${p.name} is low on stock (${p.quantityInStock} remaining). Reorder level is ${p.reorderLevel}.`,
      read: readNotifications.includes(`low-stock-${p._id}`)
    }))

  const unreadCount = notifications.filter(n => !n.read).length

  function markNotificationRead(id) {
    setReadNotifications(prev => {
      const next = [...prev, id]
      localStorage.setItem('ims-read-notifications', JSON.stringify(next))
      return next
    })
  }

  function markAllNotificationsRead() {
    const allIds = notifications.map(n => n.id)
    setReadNotifications(allIds)
    localStorage.setItem('ims-read-notifications', JSON.stringify(allIds))
  }

  const onRequestError = (error, fallback) => {
    handleRequestError(error, fallback)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ims-theme', theme)
  }, [theme])

  useEffect(() => {
    if (session?.token) {
      sessionStorage.setItem('ims-session', JSON.stringify(session))
    } else {
      sessionStorage.removeItem('ims-session')
    }
  }, [session])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => {
      setNotice(null)
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (products.length > 0 && unreadCount > 0 && !hasShownPopup) {
      setNotice({ type: 'warning', text: `You have ${unreadCount} items low on stock. Check notifications.` })
      setHasShownPopup(true)
    }
  }, [products.length, unreadCount, hasShownPopup])

  useEffect(() => {
    if (!session?.token) return

    let isCancelled = false
    async function fetchAllData() {
      setPageLoading(true)
      try {
        const fetchTasks = [
          api.get('/dashboard/overview', authConfig(session.token)),
          api.get('/products', authConfig(session.token)),
          api.get('/sales', authConfig(session.token)),
          api.get('/customers', authConfig(session.token)),
        ]

        // Only add report fetch if admin
        const isAdmin = session.user.role === 'admin'
        if (isAdmin) {
          fetchTasks.push(api.get('/reports/sales?range=' + reportRange, authConfig(session.token)))
        }

        const results = await Promise.all(fetchTasks)

        if (isCancelled) return

        setOverview(results[0].data)
        setProducts(results[1].data.products || [])
        setSales(results[2].data.sales || [])
        setCustomers(results[3].data)

        if (isAdmin && results[4]) {
          setReport(results[4].data)
        }
      } catch (error) {
        if (isCancelled) return
        setNotice({ type: 'error', text: 'Cloud sync failed. Check connectivity.' })
      } finally {
        if (!isCancelled) setPageLoading(false)
      }
    }
    fetchAllData()
    return () => { isCancelled = true }
  }, [session?.token])

  useEffect(() => {
    if (!session?.token || session.user.role !== 'admin') return

    let isCancelled = false
    async function loadReport() {
      try {
        const response = await api.get(
          `/reports/sales?range=${reportRange}`,
          authConfig(session.token),
        )
        if (!isCancelled) setReport(response.data)
      } catch (error) {
        if (!isCancelled) onRequestError(error, 'Unable to load the sales report.')
      }
    }
    loadReport()
    return () => { isCancelled = true }
  }, [reportRange, session?.token, session?.user?.role])

  const catalogProducts = products.filter((product) =>
    `${product.name} ${product.barcode} ${product.sku} ${product.category}`
      .toLowerCase()
      .includes(catalogQuery.toLowerCase()),
  )

  const cartSubtotal = roundCurrency(
    cart.reduce((sum, item) => {
      const regularPrice = Number(item.price || 0)
      const loyaltyPrice = Number(item.loyaltyDiscount || 0)
      const effectiveUnitPrice = checkoutForm.loyaltyCard
        ? Math.max(0, Math.min(regularPrice, loyaltyPrice || regularPrice))
        : regularPrice
      return sum + effectiveUnitPrice * Number(item.quantity)
    }, 0),
  )
  const discountValue = Number(checkoutForm.discount || 0)
  const discountAmount = roundCurrency(cartSubtotal * (discountValue / 100))
  const cartTotal = roundCurrency(cartSubtotal - discountAmount)

  useEffect(() => {
    setCart(currentCart => currentCart.map(item => {
      const regularPrice = Number(item.price || 0)
      const loyaltyPrice = Number(item.loyaltyDiscount || 0)
      const unit = checkoutForm.loyaltyCard
        ? Math.max(0, Math.min(regularPrice, loyaltyPrice || regularPrice))
        : regularPrice
      return { ...item, lineTotal: item.quantity * unit }
    }))
  }, [checkoutForm.loyaltyCard])

  async function refreshCoreData() {
    if (!session?.token) return null
    try {
      const [overviewResponse, productsResponse, salesResponse, customersResponse, companyResponse] = await Promise.all([
        api.get('/dashboard/overview', authConfig(session.token)),
        api.get('/products', authConfig(session.token)),
        api.get('/sales', authConfig(session.token)),
        api.get('/customers', authConfig(session.token)),
        api.get('/company'),
      ])
      const freshProducts = productsResponse.data.products || [];
      setOverview(overviewResponse.data)
      setProducts(freshProducts)
      setSales(salesResponse.data.sales || [])
      setCustomers(customersResponse.data || [])
      setCompany(companyResponse.data)
      return freshProducts;
    } catch (err) {
      console.error("Refresh failed", err);
      return null;
    }
  }

  useEffect(() => {
    if (company?.name) {
      document.title = `${company.name} | Inventory System`
    }
  }, [company])

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  async function fetchCompanyInfo() {
    try {
      const resp = await api.get('/company')
      setCompany(resp.data)
    } catch (err) {
      console.error("Failed to load company info", err)
    }
  }

  async function handleCompanyUpdate(formData) {
    if (!session?.token) return
    setBusyAction('save-company')
    try {
      const response = await api.post('/company', formData, {
        headers: {
          ...authConfig(session.token).headers,
          'Content-Type': 'multipart/form-data',
        },
      })
      setCompany(response.data)
      setNotice({ type: 'success', text: 'Company settings updated successfully.' })
    } catch (error) {
      setNotice({ type: 'error', text: readErrorMessage(error, 'Unable to update company info.') })
    } finally {
      setBusyAction('')
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setBusyAction('login')
    try {
      const response = await api.post('/auth/login', authForm)
      setSession(response.data)
      navigate('/')
      setNotice({ type: 'success', text: `Welcome back, ${response.data.user.name}.` })
    } catch (error) {
      setNotice({ type: 'error', text: readErrorMessage(error, 'Unable to sign in.') })
    } finally {
      setBusyAction('')
    }
  }

  function handleLogout() {
    setSession(null)
    setOverview(null)
    setProducts([])
    setSales([])
    setReport(null)
    setCart([])
    navigate('/')
    setNotice({ type: 'info', text: 'Signed out.' })
  }

  function handleRequestError(error, fallback) {
    const message = readErrorMessage(error, fallback)
    if (error.response?.status === 401) {
      handleLogout()
      setNotice({ type: 'error', text: 'Your session expired.' })
      return
    }
    setNotice({ type: 'error', text: message })
  }

  function addProductToCart(product) {
    setCart((currentCart) => {
      const isLoyalty = !!checkoutForm.loyaltyCard
      const regularPrice = Number(product.price || 0)
      const loyaltyPrice = Number(product.loyaltyDiscount || 0)
      const effectivePrice = isLoyalty
        ? Math.max(0, Math.min(regularPrice, loyaltyPrice || regularPrice))
        : regularPrice

      const existing = currentCart.find((item) => item.productId === product._id)
      if (existing) {
        return currentCart.map((item) => {
          if (item.productId === product._id) {
            const nextQty = Math.min(item.quantity + 1, product.quantityInStock)
            return {
              ...item,
              quantity: nextQty,
              lineTotal: nextQty * effectivePrice,
            }
          }
          return item
        })
      }
      return [
        ...currentCart,
        {
          productId: product._id,
          name: product.name,
          barcode: product.barcode,
          sku: product.sku,
          price: product.price,
          loyaltyDiscount: product.loyaltyDiscount || 0,
          image: product.image,
          rackLabel: product.rackLabel,
          available: product.quantityInStock,
          quantity: 1,
          discount: 0,
          discountPrice: 0,
          lineTotal: effectivePrice,
        },
      ]
    })
  }

  function changeCartQuantity(productId, direction) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.productId !== productId) return item
          const nextQuantity = direction === 'increase' ? item.quantity + 1 : item.quantity - 1
          const finalQty = Math.max(0, Math.min(nextQuantity, item.available))
          const regularPrice = Number(item.price || 0)
          const loyaltyPrice = Number(item.loyaltyDiscount || 0)
          const effectivePrice = checkoutForm.loyaltyCard
            ? Math.max(0, Math.min(regularPrice, loyaltyPrice || regularPrice))
            : regularPrice
          return {
            ...item,
            quantity: finalQty,
            lineTotal: finalQty * effectivePrice,
          }
        })
        .filter((item) => item.quantity > 0),
    )
  }

  function handleBarcodeLookup(scannedValue) {
    if (location.pathname === '/returns') return
    const cleanedValue = String(scannedValue || '').trim()
    if (!cleanedValue) return

    // Intercept the single allowed loyalty card barcode.
    const expectedLoyaltyCode = company?.loyaltyCardCode || 'NILMA-2026-DISC295'
    if (cleanedValue === expectedLoyaltyCode) {
      setCheckoutForm(prev => ({ ...prev, loyaltyCard: cleanedValue }))
      setNotice({ type: 'success', text: `Loyalty Card ${cleanedValue} applied.` })
      return
    }

    // Capture in product form if currently managing catalog to prevent navigation
    if (location.pathname === '/product-manager') {
      setProductForm(prev => ({ ...prev, barcode: cleanedValue }))
      setNotice({ type: 'info', text: `Captured barcode: ${cleanedValue}` })
      return
    }

    // Capture in inventory search if on inventory page
    if (location.pathname === '/inventory') {
      setInventoryQuery(cleanedValue)
      return
    }

    setBarcodeValue(cleanedValue)
    navigate('/pos')
    const matchingProduct = products.find((p) => p.barcode === cleanedValue || p.sku === cleanedValue)
    if (!matchingProduct) {
      setCatalogQuery(cleanedValue)
      setNotice({ type: 'warning', text: `No product matched barcode ${cleanedValue}.` })
      return
    }
    addProductToCart(matchingProduct)
    setNotice({ type: 'success', text: `${matchingProduct.name} added to cart.` })
  }

  function handleProductFormChange(event) {
    const { name, value, type, files } = event.target

    if (type === 'file' && files?.[0]) {
      setProductForm((current) => ({ ...current, imageFile: files[0] }))
      return
    }

    if (name.startsWith('rack.')) {
      const rackField = name.split('.')[1]
      setProductForm((current) => ({
        ...current,
        rack: { ...current.rack, [rackField]: value },
      }))
      return
    }
    setProductForm((current) => ({ ...current, [name]: value }))
  }

  function startEditingProduct(product) {
    setEditingProductId(product._id)
    setProductForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      description: product.description,
      unit: product.unit,
      price: String(product.price),
      costPrice: String(product.costPrice),
      latestPurchaseCost: product.latestPurchaseCost || 0,
      loyaltyDiscount: String(product.loyaltyDiscount || '0'),
      quantityInStock: String(product.quantityInStock),
      reorderLevel: String(product.reorderLevel),
      rack: {
        rowNumber: String(product.rack.rowNumber),
        columnNumber: String(product.rack.columnNumber),
        shelfNumber: String(product.rack.shelfNumber),
      },
      image: product.image,
    })
    navigate('/inventory')
  }

  function generateNextSKU(customProducts) {
    const list = customProducts || products
    if (!list || list.length === 0) return 'SKU-001'
    const skus = list.map(p => {
      const match = String(p.sku || '').match(/SKU-(\d+)/)
      return match ? parseInt(match[1]) : 0
    })
    const maxNum = Math.max(...skus, 0)
    return `SKU-${String(maxNum + 1).padStart(3, '0')}`
  }

  function resetProductEditor(customProducts) {
    setEditingProductId('')
    setProductForm({ ...emptyProductForm, sku: generateNextSKU(customProducts) })
  }

  async function handleProductSave(event) {
    event.preventDefault()
    setBusyAction('product-save')
    try {
      const formData = new FormData();

      // Basic fields
      formData.append('name', productForm.name);
      formData.append('sku', productForm.sku);
      formData.append('barcode', productForm.barcode);
      formData.append('category', productForm.category);
      formData.append('description', productForm.description);
      formData.append('unit', productForm.unit);
      formData.append('price', productForm.price);
      formData.append('costPrice', productForm.costPrice);
      formData.append('loyaltyDiscount', productForm.loyaltyDiscount);
      formData.append('quantityInStock', productForm.quantityInStock);
      formData.append('reorderLevel', productForm.reorderLevel);

      // Nested rack fields
      formData.append('rack.rowNumber', productForm.rack.rowNumber);
      formData.append('rack.columnNumber', productForm.rack.columnNumber);
      formData.append('rack.shelfNumber', productForm.rack.shelfNumber);

      // Handle image file or existing URL
      if (productForm.imageFile) {
        formData.append('image', productForm.imageFile);
      } else {
        formData.append('image', productForm.image);
      }

      const config = {
        headers: {
          ...authConfig(session.token).headers,
          'Content-Type': 'multipart/form-data',
        }
      };

      if (editingProductId) {
        await api.patch(`/products/${editingProductId}`, formData, config);
      } else {
        await api.post('/products', formData, config);
      }

      const freshProducts = await refreshCoreData()
      resetProductEditor(freshProducts)
      setNotice({ type: 'success', text: 'Product saved successfully.' })
    } catch (error) {
      handleRequestError(error, 'Unable to save product.')
    } finally {
      setBusyAction('')
    }
  }

  async function handleProductDelete(productId) {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    setBusyAction('product-delete')
    try {
      await api.delete(`/products/${productId}`, authConfig(session.token))
      await refreshCoreData()
      setNotice({ type: 'success', text: 'Product deleted successfully.' })
    } catch (error) {
      handleRequestError(error, 'Unable to delete product.')
    } finally {
      setBusyAction('')
    }
  }

  async function handleCheckout(event) {
    event.preventDefault()
    if (cart.length === 0) return
    setBusyAction('checkout')
    try {
      const splitPayments = [];
      if (checkoutForm.paymentMethod === 'split') {
        if (Number(checkoutForm.splitCash || 0) > 0) {
          splitPayments.push({ method: 'cash', amount: Number(checkoutForm.splitCash) });
        }
        if (Number(checkoutForm.splitCard || 0) > 0) {
          splitPayments.push({ method: 'card', amount: Number(checkoutForm.splitCard) });
        }
        if (Number(checkoutForm.splitUpi || 0) > 0) {
          splitPayments.push({ method: 'upi', amount: Number(checkoutForm.splitUpi) });
        }
        if (Number(checkoutForm.splitCredit || 0) > 0) {
          splitPayments.push({ method: 'credit', amount: Number(checkoutForm.splitCredit) });
        }
      }

      const response = await api.post(
        '/sales',
        {
          customerName: checkoutForm.customerName,
          customerId: checkoutForm.customerId,
          loyaltyCard: checkoutForm.loyaltyCard,
          paymentMethod: checkoutForm.paymentMethod,
          discount: Number(checkoutForm.discount || 0),
          notes: checkoutForm.notes,
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          splitPayments: splitPayments.length > 0 ? splitPayments : undefined,
        },
        authConfig(session.token),
      )
      await refreshCoreData()
      setCart([])
      setCheckoutForm({
        customerName: 'Walk-in customer',
        customerId: '',
        loyaltyCard: '',
        paymentMethod: 'cash',
        discount: '0',
        notes: '',
        splitCash: '',
        splitCard: '',
        splitUpi: '',
        splitCredit: ''
      })
      printReceipt(response.data.sale, session.user, 0, company)
      setNotice({ type: 'success', text: 'Sale completed.' })
    } catch (error) {
      handleRequestError(error, 'Checkout failed.')
    } finally {
      setBusyAction('')
    }
  }
  if (!session) {
    return (
      <Login
        theme={theme}
        setTheme={setTheme}
        authForm={authForm}
        setAuthForm={setAuthForm}
        handleLogin={handleLogin}
        busyAction={busyAction}
        demoCredentials={demoCredentials}
        notice={notice}
        company={company}
      />
    )
  }


  return (
    <div className="app-shell">
      <BarcodeReader onError={() => { }} onScan={handleBarcodeLookup} />

      <Sidebar
        session={session}
        activeView={activeView}
        handleLogout={handleLogout}
        unreadCount={unreadCount}
        company={company}
      />

      <main className="workspace stack gap-5">
        <Topbar activeView={activeView} session={session} overview={overview} theme={theme} setTheme={setTheme} />
        <NoticeBanner notice={notice} />

        {pageLoading && (
          <div className="panel loading-state">
            <div className="spinner" />
            <p>Syncing warehouse data...</p>
          </div>
        )}

        {!pageLoading && (
          <Routes>
            <Route path="/" element={
              session.user.role === 'super_admin' ? (
                <Navigate to="/super-admin" replace />
              ) : session.user.role === 'admin' ? (
                <AdminDashboard
                  overview={overview}
                  session={session}
                  startTransition={startTransition}
                />
              ) : (
                <CashierDashboard
                  overview={overview}
                  session={session}
                  startTransition={startTransition}
                />
              )
            } />

            <Route path="/pos" element={
              <POS
                catalogProducts={catalogProducts}
                customers={customers}
                catalogQuery={catalogQuery}
                setCatalogQuery={setCatalogQuery}
                cart={cart}
                setCart={setCart}
                addProductToCart={addProductToCart}
                changeCartQuantity={changeCartQuantity}
                checkoutForm={checkoutForm}
                setCheckoutForm={setCheckoutForm}
                handleCheckout={handleCheckout}
                busyAction={busyAction}
                cartSubtotal={cartSubtotal}
                cartTotal={cartTotal}
                discountAmount={discountAmount}
                barcodeValue={barcodeValue}
              />
            } />

            <Route path="/sales-history" element={
              <SalesHistory
                api={api}
                session={session}
                onNotice={setNotice}
                company={company}
              />
            } />

            <Route path="/settlements" element={
              <Settlements
                api={api}
                session={session}
                onNotice={setNotice}
              />
            } />


            <Route path="/inventory" element={
              <AdminRoute session={session}>
                <Inventory
                  products={products}
                  inventoryQuery={inventoryQuery}
                  setInventoryQuery={setInventoryQuery}
                  onlyLowStock={onlyLowStock}
                  setOnlyLowStock={setOnlyLowStock}
                  productForm={productForm}
                  handleProductFormChange={handleProductFormChange}
                  handleProductSave={handleProductSave}
                  startEditingProduct={startEditingProduct}
                  resetProductEditor={resetProductEditor}
                  editingProductId={editingProductId}
                  busyAction={busyAction}
                  startTransition={startTransition}
                  handleProductDelete={handleProductDelete}
                />
              </AdminRoute>
            } />

            <Route path="/product-manager" element={
              <AdminRoute session={session}>
                <ProductManager
                  productForm={productForm}
                  handleProductFormChange={handleProductFormChange}
                  handleProductSave={handleProductSave}
                  resetProductEditor={resetProductEditor}
                  editingProductId={editingProductId}
                  busyAction={busyAction}
                />
              </AdminRoute>
            } />

            <Route path="/super-admin/exchange" element={
              <AdminRoute session={session}>
                {session.user.role === 'super_admin' ? (
                  <InventoryTransfer api={api} session={session} onNotice={setNotice} refreshCoreData={refreshCoreData} />
                ) : (
                  <Navigate to="/" replace />
                )}
              </AdminRoute>
            } />

            <Route path="/suppliers" element={<AdminRoute session={session}><Suppliers api={api} session={session} onNotice={setNotice} refreshCoreData={refreshCoreData} /></AdminRoute>} />
            <Route path="/purchases" element={<AdminRoute session={session}><Purchases api={api} session={session} onNotice={setNotice} refreshCoreData={refreshCoreData} /></AdminRoute>} />
            <Route path="/customers" element={<Customers api={api} session={session} onNotice={setNotice} refreshCoreData={refreshCoreData} />} />


            <Route path="/staff" element={
              <AdminRoute session={session}>
                <StaffManagement
                  api={api}
                  session={session}
                  onNotice={setNotice}
                  setEditingStaff={setEditingStaff}
                />
              </AdminRoute>
            } />
            <Route path="/company-profile" element={
              <AdminRoute session={session}>
                <CompanyProfile
                  company={company}
                  onUpdate={handleCompanyUpdate}
                  isBusy={busyAction === 'save-company'}
                />
              </AdminRoute>
            } />
            <Route path="/staff-form" element={
              <AdminRoute session={session}>
                <StaffForm
                  api={api}
                  session={session}
                  onNotice={setNotice}
                  editingStaff={editingStaff}
                  setEditingStaff={setEditingStaff}
                />
              </AdminRoute>
            } />

            <Route path="/purchases" element={<AdminRoute session={session}><Purchases api={api} session={session} onNotice={setNotice} refreshCoreData={refreshCoreData} /></AdminRoute>} />
            <Route path="/invoices" element={<AdminRoute session={session}><Invoices api={api} session={session} onNotice={setNotice} sales={sales} customers={customers} company={company} /></AdminRoute>} />
            <Route path="/payments" element={<AdminRoute session={session}><PaymentAllocation api={api} session={session} onNotice={setNotice} /></AdminRoute>} />
            <Route path="/accounts/:type/:id" element={<AccountStatement api={api} session={session} onNotice={setNotice} company={company} />} />
            <Route path="/returns" element={<Returns api={api} session={session} onNotice={setNotice} refreshCoreData={refreshCoreData} />} />

            <Route path="/notifications" element={
              <Notifications
                notifications={notifications}
                markNotificationRead={markNotificationRead}
                markAllNotificationsRead={markAllNotificationsRead}
              />
            } />

            <Route path="/reports" element={
              <AdminRoute session={session}>
                <Reports
                  report={report}
                  reportRange={reportRange}
                  setReportRange={setReportRange}
                />
              </AdminRoute>
            } />

            {/* Super Admin Routes */}
            <Route path="/super-admin" element={
              <SuperAdminRoute session={session}>
                <SuperAdminDashboard api={api} session={session} />
              </SuperAdminRoute>
            } />
            <Route path="/super-admin/branches" element={
              <SuperAdminRoute session={session}>
                <BranchManagement api={api} session={session} />
              </SuperAdminRoute>
            } />
            <Route path="/super-admin/branches/:branchName" element={
              <SuperAdminRoute session={session}>
                <BranchDetails api={api} session={session} />
              </SuperAdminRoute>
            } />
            <Route path="/super-admin/reports" element={
              <SuperAdminRoute session={session}>
                <SuperAdminReports api={api} session={session} />
              </SuperAdminRoute>
            } />
            <Route path="/super-admin/returns" element={
              <SuperAdminRoute session={session}>
                <SuperAdminReturns api={api} session={session} onNotice={setNotice} refreshCoreData={refreshCoreData} />
              </SuperAdminRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

// Helper for conditional admin routes
const AdminRoute = ({ session, children }) => {
  if (!session || !['admin', 'super_admin'].includes(session.user.role)) return <Navigate to="/" replace />
  return children
}

// Helper for conditional super admin routes
const SuperAdminRoute = ({ session, children }) => {
  if (!session || session.user.role !== 'super_admin') return <Navigate to="/" replace />
  return children
}

export default App
