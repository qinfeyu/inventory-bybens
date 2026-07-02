import { Product, Sale, Expense, ExchangeRates, CapitalAllocation, Customer, PreOrder } from '../types';

export const defaultExchangeRates: ExchangeRates = {
  global: 275,
};

export const defaultCapitalAllocation: CapitalAllocation = {
  takenAsidePercent: 30,
  reinvestedPercent: 70,
};

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'SUP-WHEY-CHOC',
    name: '100% Whey Gold Standard 2.27kg',
    brand: 'Optimum Nutrition',
    description: 'Premium whey protein isolate for muscle recovery and growth.',
    category: 'Supplements',
    variant: 'Double Rich Chocolate',
    size: '2.27 kg',
    originalCostEur: 45.00,
    exchangeRate: 250,
    deliveryCostDzd: 1200,
    landedCostDzd: 12450, // (45 * 250) + 1200
    retailPriceDzd: 17500,
    quantityPurchased: 20,
    quantitySold: 8,
    remainingStock: 12,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-25T14:30:00Z',
  },
  {
    id: 'prod-2',
    sku: 'SUP-CREA-UNI',
    name: 'Creatine Monohydrate 250g',
    brand: 'Optimum Nutrition',
    description: 'Pure micronized creatine monohydrate for strength and power.',
    category: 'Supplements',
    variant: 'Unflavored',
    size: '250g',
    originalCostEur: 12.00,
    exchangeRate: 250,
    deliveryCostDzd: 400,
    landedCostDzd: 3400, // (12 * 250) + 400
    retailPriceDzd: 5500,
    quantityPurchased: 30,
    quantitySold: 15,
    remainingStock: 15,
    createdAt: '2026-06-02T11:00:00Z',
    updatedAt: '2026-06-20T09:15:00Z',
  },
  {
    id: 'prod-3',
    sku: 'SNA-MELT-CARA',
    name: 'Prozis Melty Protein Bar',
    brand: 'Prozis',
    description: 'Delicious high-protein low-sugar snack bar with rich caramel layer.',
    category: 'Snacks',
    variant: 'Salted Caramel',
    size: '12x60g Box',
    originalCostEur: 15.00,
    exchangeRate: 270,
    deliveryCostDzd: 600,
    landedCostDzd: 4650, // (15 * 270) + 600
    retailPriceDzd: 7500,
    quantityPurchased: 15,
    quantitySold: 9,
    remainingStock: 6,
    prozisLink: 'https://www.prozis.com/it/en/prozis/melty-protein-bar-60-g',
    weightAlloc: 0.72,
    createdAt: '2026-06-16T09:00:00Z',
    updatedAt: '2026-06-27T11:00:00Z',
  },
  {
    id: 'prod-4',
    sku: 'SNA-OATS-PB',
    name: 'Prozis Whole Oats 1kg',
    brand: 'Prozis',
    description: 'Instant whole oat powder, excellent source of complex carbs.',
    category: 'Snacks',
    variant: 'Peanut Butter',
    size: '1 kg Bag',
    originalCostEur: 4.00,
    exchangeRate: 270,
    deliveryCostDzd: 300,
    landedCostDzd: 1380, // (4 * 270) + 300
    retailPriceDzd: 3200,
    quantityPurchased: 50,
    quantitySold: 42,
    remainingStock: 8,
    prozisLink: 'https://www.prozis.com/it/en/prozis/oats-1000g',
    weightAlloc: 1.00,
    createdAt: '2026-06-17T14:00:00Z',
    updatedAt: '2026-06-28T18:00:00Z',
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Yacine Belkacem',
    phone: '0550123456',
    address: '12 Rue Didouche Mourad, Alger',
    instagram: '@yacine_fit',
    notes: 'Regular supplements buyer'
  },
  {
    id: 'cust-2',
    name: 'Sofiane Merah',
    phone: '0661987654',
    address: 'Cité 500 Logements, Oran',
    instagram: '@sofiane.mrh',
    notes: 'Often orders Prozis items'
  },
  {
    id: 'cust-3',
    name: 'Amine Kaci',
    phone: '0770456123',
    address: 'El Khroub, Constantine',
    instagram: '@amine.kaci',
    notes: 'Prefers vanilla flavors'
  }
];

export const initialSales: Sale[] = [
  {
    id: 'sale-1',
    date: '2026-06-18T14:20:00Z',
    items: [
      {
        productId: 'prod-1',
        productName: '100% Whey Gold Standard 2.27kg',
        category: 'Supplements',
        quantity: 2,
        sellPriceDzd: 17500,
        baseCostDzd: 24900, // 2 * 12450
        profitDzd: 10100,
        exchangeRateUsed: 250
      },
      {
        productId: 'prod-2',
        productName: 'Creatine Monohydrate 250g',
        category: 'Supplements',
        quantity: 1,
        sellPriceDzd: 5500,
        baseCostDzd: 3400, // 1 * 3400
        profitDzd: 2100,
        exchangeRateUsed: 250
      }
    ],
    totalRevenueDzd: 40500, // 35000 + 5500
    totalBaseCostDzd: 28300, // 24900 + 3400
    totalProfitDzd: 12200,
    totalProfitEur: 48.80, // 10100/250 + 2100/250
    customerId: 'cust-1',
    customerName: 'Yacine Belkacem',
    customerPhone: '0550123456',
    customerAddress: '12 Rue Didouche Mourad, Alger',
    notes: 'Mixed supplements order'
  },
  {
    id: 'sale-2',
    date: '2026-06-28T16:00:00Z',
    items: [
      {
        productId: 'prod-4',
        productName: 'Prozis Whole Oats 1kg',
        category: 'Snacks',
        quantity: 10,
        sellPriceDzd: 3200,
        baseCostDzd: 13800, // 10 * 1380
        profitDzd: 18200,
        exchangeRateUsed: 270
      },
      {
        productId: 'prod-3',
        productName: 'Prozis Melty Protein Bar',
        category: 'Snacks',
        quantity: 2,
        sellPriceDzd: 7500,
        baseCostDzd: 9300, // 2 * 4650
        profitDzd: 5700,
        exchangeRateUsed: 270
      }
    ],
    totalRevenueDzd: 47000, // 32000 + 15000
    totalBaseCostDzd: 23100, // 13800 + 9300
    totalProfitDzd: 23900,
    totalProfitEur: 88.52, // 23900 / 270
    customerName: 'Fitness Club Gym',
    customerPhone: '021556677',
    customerAddress: 'Hydra, Algiers',
    notes: 'Bulk snacks delivery'
  }
];

export const initialPreOrders: PreOrder[] = [
  {
    id: 'pre-1',
    date: '2026-06-29T10:00:00Z',
    customerId: 'cust-2',
    customerName: 'Sofiane Merah',
    customerPhone: '0661987654',
    customerAddress: 'Cité 500 Logements, Oran',
    category: 'Supplements',
    items: [
      {
        productName: 'Prozis Zero Whey Isolate 2kg',
        variant: 'Vanilla',
        size: '2 kg',
        quantity: 1,
        originalCostEur: 55.00,
        exchangeRate: 250,
        deliveryCostDzd: 1500,
        priceDzd: 16000
      }
    ],
    totalRevenueDzd: 16000,
    totalDeliveryDzd: 1500,
    totalCostDzd: 15250, // (55 * 250) + 1500
    totalProfitDzd: 750,
    status: 'Pending',
    notes: 'Requested vanilla flavor, not currently in stock'
  },
  {
    id: 'pre-2',
    date: '2026-06-30T09:00:00Z',
    customerId: 'cust-3',
    customerName: 'Amine Kaci',
    customerPhone: '0770456123',
    customerAddress: 'El Khroub, Constantine',
    category: 'Supplements',
    items: [
      {
        productId: 'prod-2',
        productName: 'Creatine Monohydrate 250g',
        variant: 'Unflavored',
        size: '250g',
        quantity: 3,
        originalCostEur: 12.00,
        exchangeRate: 250,
        deliveryCostDzd: 400,
        priceDzd: 5500
      }
    ],
    totalRevenueDzd: 16500, // 3 * 5500
    totalDeliveryDzd: 1200, // 3 * 400
    totalCostDzd: 10200, // 3 * (12 * 250 + 400) = 3 * 3400
    totalProfitDzd: 6300,
    status: 'Sourced',
    notes: 'Waiting for shipment arrival'
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    title: 'Instagram Ads - June Campaign',
    category: 'Ad Spend',
    amountEur: 100.00,
    amountDzd: 27500, // 100 * 275
    date: '2026-06-15T18:00:00Z',
    notes: 'Targeting fitness demographics in Algiers'
  },
  {
    id: 'exp-2',
    title: 'Cargo Delivery from Prozis (France)',
    category: 'Cargo/Shipping',
    amountEur: 150.00,
    amountDzd: 41250, // 150 * 275
    date: '2026-06-10T12:00:00Z',
    notes: 'Shipping cost for Supplements and Snacks package'
  }
];
