function recommendProducts({ products = [], cart = { items: [], total: 0 }, intent, rules = {} }) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCartItems = Array.isArray(cart.items) ? cart.items : [];
  const priorityProductIds = Array.isArray(rules.priorityProductIds) ? rules.priorityProductIds.map(String) : [];
  const excludedCategories = new Set(
    Array.isArray(rules.excludedCategories) ? rules.excludedCategories.map((c) => String(c).toLowerCase()) : []
  );
  const minStock = Number.isFinite(Number(rules.minStock)) ? Number(rules.minStock) : 0;

  const eligibleProducts = safeProducts.filter((p) => {
    const category = String((p || {}).category || '').toLowerCase();
    const stock = Number((p || {}).stock || 0);
    if (excludedCategories.has(category)) return false;
    if (stock < minStock) return false;
    return true;
  });

  const withPrioritySorting = (list) => {
    return [...list].sort((a, b) => {
      const aPriority = priorityProductIds.includes(String(a.id || a.product_id));
      const bPriority = priorityProductIds.includes(String(b.id || b.product_id));
      if (aPriority === bPriority) return 0;
      return aPriority ? -1 : 1;
    });
  };

  let recommendations = [];

  if (intent === 'product_search') {
    recommendations = withPrioritySorting(eligibleProducts).slice(0, 3);
  }

  if (safeCartItems.length > 0) {
    const categories = safeCartItems.map((i) => i.category).filter(Boolean);
    recommendations = eligibleProducts.filter(
      (p) =>
        !safeCartItems.some((i) => i.product_id === p.id || i.product_id === p.product_id) &&
        categories.includes(p.category)
    );
  }

  if (intent === 'purchase') {
    const cartTotal = Number(cart.total) || 0;
    recommendations = eligibleProducts.filter((p) => Number(p.price) > cartTotal).slice(0, 2);
  }

  return withPrioritySorting(recommendations).slice(0, 3);
}

module.exports = {
  recommendProducts,
};
