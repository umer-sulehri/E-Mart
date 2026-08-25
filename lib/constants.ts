export const CATEGORIES = [
  {
    id: "1",
    name: "Fruits & Vegetables",
    slug: "fruits-vegetables",
    icon: "Leaf",
    thumbnail: "/images/categories/fruits-vegetables.jpg",
  },
  {
    id: "2",
    name: "Dairy & Eggs",
    slug: "dairy-eggs",
    icon: "Egg",
    thumbnail: "/images/categories/dairy-eggs.jpg",
  },
  {
    id: "3",
    name: "Meat & Poultry",
    slug: "meat-poultry",
    icon: "Drumstick",
    thumbnail: "/images/categories/meat-poultry.jpg",
  },
  {
    id: "4",
    name: "Seafood",
    slug: "seafood",
    icon: "Fish",
    thumbnail: "/images/categories/seafood.jpg",
  },
  {
    id: "5",
    name: "Bakery",
    slug: "bakery",
    icon: "CakeSlice",
    thumbnail: "/images/categories/bakery.jpg",
  },
  {
    id: "6",
    name: "Canned Goods",
    slug: "canned-goods",
    icon: "Container",
    thumbnail: "/images/categories/canned-goods.jpg",
  },
  {
    id: "7",
    name: "Frozen Foods",
    slug: "frozen-foods",
    icon: "Snowflake",
    thumbnail: "/images/categories/frozen-foods.jpg",
  },
  {
    id: "8",
    name: "Pasta & Rice",
    slug: "pasta-rice",
    icon: "UtensilsCrossed",
    thumbnail: "/images/categories/pasta-rice.jpg",
  },
  {
    id: "9",
    name: "Breakfast",
    slug: "breakfast",
    icon: "Coffee",
    thumbnail: "/images/categories/breakfast.jpg",
  },
  {
    id: "10",
    name: "Snacks",
    slug: "snacks",
    icon: "Cookie",
    thumbnail: "/images/categories/snacks.jpg",
  },
  {
    id: "11",
    name: "Beverages",
    slug: "beverages",
    icon: "CupSoda",
    thumbnail: "/images/categories/beverages.jpg",
    subcategories: [
      { name: "Water", slug: "water" },
      { name: "Juice", slug: "juice" },
      { name: "Soda", slug: "soda" },
      { name: "Tea", slug: "tea" },
    ],
  },
  {
    id: "12",
    name: "Spices & Seasonings",
    slug: "spices-seasonings",
    icon: "Flame",
    thumbnail: "/images/categories/spices-seasonings.jpg",
  },
  {
    id: "13",
    name: "Baby Food & Formula",
    slug: "baby-food-formula",
    icon: "Baby",
    thumbnail: "/images/categories/baby-food-formula.jpg",
  },
  {
    id: "14",
    name: "Health & Wellness",
    slug: "health-wellness",
    icon: "Heart",
    thumbnail: "/images/categories/health-wellness.jpg",
  },
  {
    id: "15",
    name: "Household Supplies",
    slug: "household-supplies",
    icon: "Home",
    thumbnail: "/images/categories/household-supplies.jpg",
  },
  {
    id: "16",
    name: "Personal Care",
    slug: "personal-care",
    icon: "Sparkles",
    thumbnail: "/images/categories/personal-care.jpg",
  },
  {
    id: "17",
    name: "Pet Food & Supplies",
    slug: "pet-food-supplies",
    icon: "PawPrint",
    thumbnail: "/images/categories/pet-food-supplies.jpg",
  },
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", icon: "Banknote" },
  { id: "easypaisa", name: "Easypaisa", icon: "Smartphone" },
  { id: "jazzcash", name: "JazzCash", icon: "Smartphone" },
  { id: "stripe", name: "Stripe (Card)", icon: "CreditCard" },
] as const;

export const ORDER_STATUSES = [
  { id: "pending", label: "Pending", color: "text-yellow-600" },
  { id: "confirmed", label: "Confirmed", color: "text-blue-600" },
  { id: "processing", label: "Processing", color: "text-indigo-600" },
  { id: "shipped", label: "Shipped", color: "text-purple-600" },
  { id: "out_for_delivery", label: "Out for Delivery", color: "text-orange-600" },
  { id: "delivered", label: "Delivered", color: "text-green-600" },
  { id: "cancelled", label: "Cancelled", color: "text-red-600" },
  { id: "returned", label: "Returned", color: "text-gray-600" },
] as const;

export const USER_ROLES = [
  { id: "customer", label: "Customer" },
  { id: "seller", label: "Seller" },
  { id: "admin", label: "Admin" },
] as const;

export const SITE_CONFIG = {
  name: "E-Mart",
  title: "E-Mart - Online Grocery Store",
  description:
    "Fresh groceries delivered to your doorstep. Shop from a wide selection of organic produce, dairy, meat, and everyday essentials.",
  url: "https://emart.pk",
  ogImage: "/images/og-image.jpg",
  creator: "E-Mart",
  keywords: [
    "grocery",
    "online shopping",
    "fresh produce",
    "organic",
    "delivery",
    "Pakistan",
  ],
  email: "support@emart.pk",
  phone: "+92-300-1234567",
  social: {
    facebook: "https://facebook.com/emart",
    twitter: "https://twitter.com/emart",
    instagram: "https://instagram.com/emart",
  },
} as const;

export const SHIPPMET_METHODS = [
  { id: "standard", name: "Standard Delivery", days: "3-5 days", price: 0 },
  { id: "express", name: "Express Delivery", days: "1-2 days", price: 150 },
  { id: "same_day", name: "Same Day Delivery", days: "Within 24 hours", price: 250 },
] as const;
