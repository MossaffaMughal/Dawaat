export const normalizeCategory = (category) =>
  String(category || "")
    .trim()
    .toLowerCase();

export const getPageTypeConfig = (category) => {
  const normalizedCategory = normalizeCategory(category);

  if (normalizedCategory === "notebook") {
    return {
      defaultVariant: "plain",
      options: [
        {
          variant: "plain",
          label: "Plain Pages",
          shortLabel: "Plain",
          stockField: "plain_pages_stock_quantity",
          outOfStockMessage: "Plain pages are out of stock",
        },
        {
          variant: "lined",
          label: "Lined Pages",
          shortLabel: "Lined",
          stockField: "lined_pages_stock_quantity",
          outOfStockMessage: "Lined pages are out of stock",
        },
      ],
      prompt: "Select between plain or lined pages",
    };
  }

  if (normalizedCategory === "notebooks") {
    return {
      defaultVariant: "dotted",
      options: [
        {
          variant: "dotted",
          label: "Dotted Pages",
          shortLabel: "Dotted",
          stockField: "dotted_pages_stock_quantity",
          outOfStockMessage: "Dotted pages are out of stock",
        },
        {
          variant: "lined",
          label: "Lined Pages",
          shortLabel: "Lined",
          stockField: "lined_pages_stock_quantity",
          outOfStockMessage: "Lined pages are out of stock",
        },
      ],
      prompt: "Select between dotted or lined pages",
    };
  }

  return null;
};

// Number of units left for a given page-type option. Missing/undefined
// values are treated as available (999) so products created before this
// per-variant tracking existed don't suddenly look out of stock.
export const getVariantStock = (product, option) => {
  const value = product?.[option.stockField];
  return value === undefined || value === null ? 999 : Number(value);
};

export const getAvailablePageTypeVariant = (category, product) => {
  const pageTypeConfig = getPageTypeConfig(category);

  if (!pageTypeConfig) {
    return null;
  }

  const availableOption = pageTypeConfig.options.find(
    (option) => getVariantStock(product, option) > 0,
  );

  return availableOption?.variant ?? pageTypeConfig.defaultVariant;
};

const LOW_STOCK_THRESHOLD = 3;

// What (if anything) to tell the customer about overall stock for this
// product, shown near the price/title rather than next to a single variant
// option. For page-type products, product.stock_quantity is always the sum
// of the variant columns (kept in sync server-side), so:
//   - total <= 3 units left  -> the exact count ("Only X left in stock")
//   - total is healthy but one variant is individually low -> a generic
//     "Low on stock" nudge, since the specific low variant is already
//     called out next to its own option
export const getStockNotice = (product) => {
  if (!product?.in_stock) return null;

  const totalStock = product?.stock_quantity;
  if (totalStock !== undefined && totalStock !== null) {
    if (totalStock <= LOW_STOCK_THRESHOLD) {
      return { type: "critical", count: totalStock };
    }
  }

  const pageTypeConfig = getPageTypeConfig(product?.category);
  if (pageTypeConfig) {
    const anyVariantLow = pageTypeConfig.options.some((option) => {
      const stock = getVariantStock(product, option);
      return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
    });
    if (anyVariantLow) {
      return { type: "low" };
    }
  }

  return null;
};
