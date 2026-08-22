import { foodItems } from './foodItems';

export const productsMap = {};
export const menuCategories = [];

foodItems.product_sets.forEach(set => {
  if (set.name !== "All Products") {
    const productIds = [];
    set.products.forEach(product => {
      productsMap[product.id] = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price.replace(/[^0-9.-]+/g, "")), // Safely convert "₹119.00" to 119
        image_url: product.image_url,
        local_image: `/food${(product.id.charCodeAt(0) % 4) + 1}.png`
      };
      productIds.push(product.id);
    });
    menuCategories.push({
      id: set.id,
      name: set.name,
      productIds: productIds
    });
  }
});

export const flowData = {
  mainMenu: {
    id: "main_menu",
    bodyText: "👋 Welcome to Classic Rolls & Wok!\nA Brand by F1 Fire Fold\n\nHow can we help you today?",
    options: [
      { id: "order_food", label: "🍔 Order Food", nextFlow: "order_food_list" },
      { id: "join_vip", label: "⭐ Join VIP Club", nextFlow: "membership" },
      { id: "store_location", label: "📍 Store Location", nextFlow: "store_info" },
      { id: "contact_us", label: "📞 Contact Us", nextFlow: "contact" }
    ],
    buttonText: "View Options"
  },
  order_food_list: {
    id: "order_food_list",
    bodyText: "Explore our menu! Please choose a category to see our offerings 🍔🍟🥤",
    buttonText: "Menu Categories",
    sections: [
      {
        title: "Food Categories",
        rows: menuCategories.map(cat => ({
          id: `cat_${cat.id}`,
          label: cat.name,
          description: `View all ${cat.name}`,
          nextFlow: `flow_${cat.id}`
        }))
      }
    ]
  },
  categories: {
    id: "categories",
    catalogCard: {
      image: "https://scontent-sin2-2.xx.fbcdn.net/v/t45.5328-4/767364614_4742463979311676_7044897171616817024_n.png?_nc_cat=103&ccb=1-7&_nc_sid=c7e7b7&_nc_ohc=x2cmc86c2fQQ7kNvwFHb87B&_nc_oc=Adqzcw8byBeCyCznQBvE-xv4r4tXI4LFMIk0OkQbeaF1JnftM1qrxJQx-ZwnrvtvjFc&_nc_zt=23&_nc_ht=scontent-sin2-2.xx&edm=ANyJclEEAAAA&_nc_gid=iPY61AcQ0UsFIiwIZbhYpA&_nc_tpa=Q5bMBQLelaPDymTU7pQJkjPf9zbZC0crgFDKusuKaPZsfGMb_ecWJyacXM6old9VxfiSEySJOXrP5u6Y&oh=00_AQHSMdLsoqfLOOsES6LaNsEME89j14juCD4B9nceX3wkZQ&oe=6A836550",
      title: "View Classic Rolls and Wok's Catalog on WhatsApp",
      subtitle: "Browse pictures and details of their offerings."
    },
    bodyText: "Explore our menu and order your favourite food from Classic Rolls & Wok 🍔🍟🥤",
    footerText: "Fresh • Delicious • Made for You 🌶️",
    buttonText: "View catalogue",
    isCatalog: true
  }
};

export const cart_updated_flow = {
  id: "cart_updated",
  bodyText: "Item added to cart! What would you like to do next?",
  buttons: [
    { id: "view_cart", label: "🛒 View Orders", actionType: 'open_cart', nextFlow: null },
    { id: "continue", label: "🛍️ Continue Shopping", nextFlow: "order_food_list" }
  ]
};
flowData["cart_updated"] = cart_updated_flow;

menuCategories.forEach(cat => {
  // 1. List of products in this category
  flowData[`flow_${cat.id}`] = {
    id: `flow_${cat.id}`,
    bodyText: `Here are our delicious ${cat.name}. Please select an item to view details.`,
    buttonText: `View ${cat.name}`,
    sections: [
      {
        title: `${cat.name} Items`,
        rows: cat.productIds.slice(0, 10).map(pid => { // Max 10 rows for WhatsApp list
          const p = productsMap[pid];
          return {
            id: `prod_${pid}`,
            label: p.name.substring(0, 24), // Max 24 chars for title in WA
            description: `₹${p.price}`,
            nextFlow: `view_prod_${pid}`
          };
        })
      }
    ]
  };

  // 2. Interactive Button Message for each Product
  cat.productIds.slice(0, 10).forEach(pid => {
    const p = productsMap[pid];
    flowData[`view_prod_${pid}`] = {
      id: `view_prod_${pid}`,
      headerImage: p.local_image,
      headerText: p.name,
      bodyText: `${p.description ? p.description : ''}\n\n*Price: ₹${p.price}*`,
      buttons: [
        { id: `add_cart_${pid}`, label: "🛒 Add to Cart", actionType: 'add_to_cart', product: p, nextFlow: 'cart_updated' },
        { id: `buy_now_${pid}`, label: "⚡ Buy Now", actionType: 'buy_now', product: p, nextFlow: null }
      ]
    };
  });
});
