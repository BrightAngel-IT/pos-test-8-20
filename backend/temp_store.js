async function getOverviewData(user, branchFilter = null) {
  const activeBranch = (user && user.role !== 'super_admin') ? user.branch : branchFilter;

  let [products, sales, users] = await Promise.all([
    getProducts({ branch: activeBranch }),
    getAllSales(),
    getAllUsersForLookup(),
  ]);

  if (activeBranch) {
    sales = sales.filter((sale) => sale.branch === activeBranch);
    users = users.filter((u) => u.branch === activeBranch);
  } else if (user && user.role === 'cashier') {
    sales = sales.filter((sale) =>
      String(sale.cashier?.userId || sale.cashierId) === String(user._id)
    );
  }

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const inventoryValue = formatCurrencyAmount(
    products.reduce((sum, product) => sum + Number(product.quantityInStock) * Number(product.price), 0),
  );
  const stockCost = formatCurrencyAmount(
    products.reduce((sum, product) => sum + Number(product.quantityInStock) * Number(product.costPrice), 0),
  );
  const lowStockProducts = products
    .filter((product) => Number(product.quantityInStock) <= Number(product.reorderLevel))
    .sort((left, right) => left.quantityInStock - right.quantityInStock)
    .map((product) => ({
      ...product,
      rackLabel: getRackLabel(product.rack),
    }));

  const salesToday = sales.filter((sale) => sameDay(sale.createdAt, now));
  const salesThisWeek = sales.filter((sale) => new Date(sale.createdAt) >= weekStart);
  const salesThisMonth = sales.filter((sale) => new Date(sale.createdAt) >= monthStart);
  const salesThisYear = sales.filter((sale) => new Date(sale.createdAt) >= yearStart);

  const rackSummaryMap = new Map();
  products.forEach((product) => {
    const key = `Row ${product.rack.rowNumber}`;
    if (!rackSummaryMap.has(key)) {
      rackSummaryMap.set(key, { row: key, items: 0, units: 0 });
    }
    const entry = rackSummaryMap.get(key);
    entry.items += 1;
    entry.units += Number(product.quantityInStock);
  });

  const productSalesMap = new Map();
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSalesMap.has(item.productId)) {
        productSalesMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          quantity: 0,
          revenue: 0,
          image: item.image,
          rackLabel: getRackLabel(item.rack),
        });
      }
      const entry = productSalesMap.get(item.productId);
      entry.quantity += Number(item.quantity);
      entry.revenue = formatCurrencyAmount(entry.revenue + Number(item.lineTotal));
    });
  });

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = now.getFullYear();
  let monthlySales = [];
  let branchMonthlySales = [];
  let allBranches = [];

  if (activeBranch) {
    monthlySales = monthLabels.map((month, index) => {
      const salesForMonth = sales.filter(s => {
        const d = new Date(s.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === index;
      });
      return {
        month,
        revenue: formatCurrencyAmount(salesForMonth.reduce((sum, s) => sum + Number(s.total), 0))
      };
    });
  } else {
    allBranches = [...new Set(sales.map(s => s.branch || 'Unknown'))];
    branchMonthlySales = monthLabels.map((month, index) => {
      const salesForMonth = sales.filter(s => {
        const d = new Date(s.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === index;
      });

      const monthData = { month };
      allBranches.forEach(branch => {
        const branchSales = salesForMonth.filter(s => (s.branch || 'Unknown') === branch);
        monthData[branch] = formatCurrencyAmount(branchSales.reduce((sum, s) => sum + Number(s.total), 0));
      });
      return monthData;
    });
  }

  const recentSales = sales.slice(0, 6).map((sale) => ({
    ...sale,
    cashierName: sale.cashier?.name || 'Unknown cashier',
  }));

  return {
    user: sanitizeUser(user),
    metrics: {
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      inventoryValue,
      stockCost,
      revenueToday: formatCurrencyAmount(salesToday.reduce((sum, sale) => sum + Number(sale.total), 0)),
      totalOrdersToday: salesToday.length,
      revenueWeekly: formatCurrencyAmount(
        salesThisWeek.reduce((sum, sale) => sum + Number(sale.total), 0),
      ),
      revenueMonthly: formatCurrencyAmount(
        salesThisMonth.reduce((sum, sale) => sum + Number(sale.total), 0),
      ),
      revenueYearly: formatCurrencyAmount(
        salesThisYear.reduce((sum, sale) => sum + Number(sale.total), 0),
      ),
      activeUsers: users.length,
    },
    monthlySales,
    branchMonthlySales,
    allBranches,
    lowStockProducts,
    products: products.map((product) => ({
      ...product,
      rackLabel: getRackLabel(product.rack),
    })),
    recentSales,
    topProducts: [...productSalesMap.values()]
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5),
    rackSummary: [...rackSummaryMap.values()],
  };
}

