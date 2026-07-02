export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string; // Product brand (e.g. Prozis, ON)
  description?: string;
  category: 'Supplements' | 'Snacks';
  variant: string; // e.g. Flavor, Color, Style
  size: string; // e.g. 2.27 kg, 1 unit
  originalCostEur: number; // Sourcing cost in €
  exchangeRate: number; // Product-level exchange rate
  deliveryCostDzd: number; // Product-level delivery cost in DZD
  landedCostDzd: number; // calculated: (originalCostEur * exchangeRate) + deliveryCostDzd
  retailPriceDzd: number; // local retail price
  quantityPurchased: number; // total units bought
  quantitySold: number; // total units sold
  remainingStock: number; // calculated: purchased - sold
  prozisLink?: string; // snacks reference
  weightAlloc?: number; // snacks bulk weight allocation (kg)
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  sellPriceDzd: number; // price at sale
  baseCostDzd: number; // cost of items sold (quantity * product.landedCostDzd)
  profitDzd: number; // quantity * (sellPriceDzd - product.landedCostDzd)
  exchangeRateUsed: number; // product.exchangeRate at sale time
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  totalRevenueDzd: number; // sum of item.quantity * item.sellPriceDzd
  totalBaseCostDzd: number; // sum of item.baseCostDzd
  totalProfitDzd: number; // totalRevenueDzd - totalBaseCostDzd
  totalProfitEur: number; // sum of item.profitDzd / item.exchangeRateUsed
  customerId?: string; // linked customer
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  instagram?: string;
  notes?: string;
}

export interface PreOrderItem {
  productId?: string; // optional linked product
  productName: string;
  variant: string;
  size: string;
  quantity: number;
  originalCostEur: number;
  exchangeRate: number;
  deliveryCostDzd: number;
  priceDzd: number; // target retail price
}

export interface PreOrder {
  id: string;
  date: string;
  customerId?: string; // optional linked customer
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  category: 'Supplements' | 'Snacks';
  items: PreOrderItem[];
  totalRevenueDzd: number; // total retail price with benefits
  totalDeliveryDzd: number; // total delivery cost in DZD
  totalCostDzd: number; // total cost without benefits
  totalProfitDzd: number; // total profit (totalRevenueDzd - totalCostDzd)
  status: 'Pending' | 'Sourced' | 'Arrived' | 'Delivered' | 'Cancelled';
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Ad Spend' | 'Cargo/Shipping' | 'Operational' | 'Other';
  amountDzd: number;
  amountEur: number;
  date: string;
  notes?: string;
}

export interface ExchangeRates {
  global: number;
}

export interface CapitalAllocation {
  takenAsidePercent: number;
  reinvestedPercent: number;
}

export interface CapitalPoolOverride {
  enabled: boolean;
  value: number;
}

export interface DashboardStats {
  totalInvestedEur: number;
  totalInvestedDzd: number;
  totalRevenueDzd: number;
  totalAdSpendDzd: number;
  totalCargoDzd: number;
  totalOtherExpensesDzd: number;
  totalProfitDzd: number;
  totalProfitEur: number;
  lowStockCount: number;
  outOfStockCount: number;
}
