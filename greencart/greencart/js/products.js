/* Sample catalog for the Home page. Edit this file to add, remove or change products.
   No logic here, just data.

   Product fields:
     name       display name
     category   must match a category id below
     price      current price in pesos
     oldPrice   (optional) original price; makes the product show as "on sale"
     unit       how it's sold, e.g. "1 kg"
     emoji      stand-in picture; swap for real photos later
     organic    (optional) shows the Organic tag
*/

window.GREENCART_CATEGORIES = [
  { id: 'vegetables', label: 'Vegetables', icon: 'c-veg' },
  { id: 'fruits',     label: 'Fruits',     icon: 'c-fruit' },
  { id: 'eggs',       label: 'Eggs',       icon: 'c-egg' },
  { id: 'meat',       label: 'Meat',       icon: 'c-meat' },
  { id: 'milk',       label: 'Milk',       icon: 'c-milk' },
  { id: 'drinks',     label: 'Drinks',     icon: 'c-drink' }
];

window.GREENCART_PRODUCTS = [
  // Vegetables
  { name: 'Organic Carrots',      category: 'vegetables', price: 90,  unit: '1 kg',    emoji: '🥕', organic: true },
  { name: 'Fresh Broccoli',       category: 'vegetables', price: 120, unit: '500 g',   emoji: '🥦', organic: true },
  { name: 'Native Tomatoes',      category: 'vegetables', price: 110, oldPrice: 140, unit: '1 kg', emoji: '🍅', organic: true },
  { name: 'Baby Spinach',         category: 'vegetables', price: 75,  unit: '250 g',   emoji: '🥬', organic: true },
  { name: 'Bell Peppers',         category: 'vegetables', price: 130, unit: '500 g',   emoji: '🫑' },

  // Fruits
  { name: 'Ripe Bananas',         category: 'fruits', price: 70,  unit: '1 kg',   emoji: '🍌', organic: true },
  { name: 'Red Apples',           category: 'fruits', price: 180, unit: '1 kg',   emoji: '🍎' },
  { name: 'Sweet Mangoes',        category: 'fruits', price: 150, oldPrice: 190, unit: '1 kg', emoji: '🥭', organic: true },
  { name: 'Strawberries',         category: 'fruits', price: 160, unit: '250 g',  emoji: '🍓', organic: true },
  { name: 'Pineapple',            category: 'fruits', price: 95,  unit: 'each',   emoji: '🍍' },

  // Eggs
  { name: 'Free-range Eggs',      category: 'eggs', price: 140, unit: 'dozen',    emoji: '🥚', organic: true },
  { name: 'Organic Brown Eggs',   category: 'eggs', price: 165, unit: 'dozen',    emoji: '🥚', organic: true },
  { name: 'Salted Duck Eggs',     category: 'eggs', price: 95,  oldPrice: 110, unit: '6 pcs', emoji: '🥚' },

  // Meat
  { name: 'Chicken Breast',       category: 'meat', price: 260, unit: '1 kg',    emoji: '🍗' },
  { name: 'Beef Cubes',           category: 'meat', price: 380, unit: '500 g',   emoji: '🥩' },
  { name: 'Pork Belly',           category: 'meat', price: 340, oldPrice: 380, unit: '1 kg', emoji: '🥓' },
  { name: 'Fresh Tilapia',        category: 'meat', price: 150, unit: '500 g',   emoji: '🐟' },

  // Milk & dairy
  { name: 'Fresh Whole Milk',     category: 'milk', price: 120, unit: '1 L',     emoji: '🥛', organic: true },
  { name: 'Greek Yogurt',         category: 'milk', price: 145, unit: '500 g',   emoji: '🥣', organic: true },
  { name: 'Cheddar Cheese',       category: 'milk', price: 135, unit: '200 g',   emoji: '🧀' },
  { name: 'Butter',               category: 'milk', price: 110, oldPrice: 125, unit: '200 g', emoji: '🧈' },

  // Drinks
  { name: 'Orange Juice',         category: 'drinks', price: 150, unit: '1 L, cold-pressed', emoji: '🍊', organic: true },
  { name: 'Coconut Water',        category: 'drinks', price: 65,  unit: '500 ml',  emoji: '🥥' },
  { name: 'Iced Green Tea',       category: 'drinks', price: 80,  oldPrice: 95, unit: '500 ml', emoji: '🍵', organic: true }
];