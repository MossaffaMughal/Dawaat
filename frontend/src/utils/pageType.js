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
          stockField: "plain_pages_in_stock",
          outOfStockMessage: "Plain pages are out of stock",
        },
        {
          variant: "lined",
          label: "Lined Pages",
          shortLabel: "Lined",
          stockField: "lined_pages_in_stock",
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
          stockField: "dotted_pages_in_stock",
          outOfStockMessage: "Dotted pages are out of stock",
        },
        {
          variant: "lined",
          label: "Lined Pages",
          shortLabel: "Lined",
          stockField: "lined_pages_in_stock",
          outOfStockMessage: "Lined pages are out of stock",
        },
      ],
      prompt: "Select between dotted or lined pages",
    };
  }

  return null;
};

export const getAvailablePageTypeVariant = (category, product) => {
  const pageTypeConfig = getPageTypeConfig(category);

  if (!pageTypeConfig) {
    return null;
  }

  const availableOption = pageTypeConfig.options.find(
    (option) => product?.[option.stockField] ?? true,
  );

  return availableOption?.variant ?? pageTypeConfig.defaultVariant;
};
