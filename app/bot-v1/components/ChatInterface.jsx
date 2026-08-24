"use client";

import React, { useState, useEffect, useRef } from "react";
import { flowData, productsMap, menuCategories } from "../data";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [currentProducts, setCurrentProducts] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [inputText, setInputText] = useState("");
  const [pendingQuantityProduct, setPendingQuantityProduct] = useState(null);
  
  const messagesEndRef = useRef(null);
  const initialized = useRef(false);

  // Initialize chat
  useEffect(() => {
    if (!initialized.current) {
        const storedMessages = localStorage.getItem('bot_v1_messages');
        const storedCart = localStorage.getItem('bot_v1_cart');
        
        if (storedCart) {
            setCart(JSON.parse(storedCart));
        }

        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        } else {
            const VIP_LANDING_TEXT = `Hi there! 👋😆
Here are your exclusive VIP offers to make your day special:

🎟️ *Welcome Vouchers*
· ₹100 OFF × 5 vouchers
· Minimum order: ₹499

🍟 *Monthly Free Fries*
· 1 free fries every month
· Minimum order: ₹299

🎂 *Birthday Month Special*
· ₹100 OFF on orders ₹499+
· ₹200 OFF on orders ₹899+
· Available during your birthday month 🎂

💰 *VIP 10% OFF*
· Always active! No min spend.`;

            setMessages([
              { 
                id: 1, 
                sender: 'bot', 
                text: VIP_LANDING_TEXT, 
                type: "text", 
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
              },
              { 
                id: 2, 
                sender: 'bot', 
                item: flowData.mainMenu, 
                type: "list", 
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
              }
            ]);
        }
        initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (initialized.current && messages.length > 0) {
        localStorage.setItem('bot_v1_messages', JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialized.current) {
        localStorage.setItem('bot_v1_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addBotMessage = (flowItem, type = "list") => {
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      sender: 'bot', 
      item: flowItem, 
      type: type, 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    }]);
  };

  const addUserMessage = (text, replyToItem = null) => {
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text, replyToItem, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
  };

  const handleActionSelect = (option, replyToItem = null) => {
    setShowMenu(false);
    addUserMessage(option.label, replyToItem);
    
    if (option.actionType === 'add_to_cart' && option.product) {
      setPendingQuantityProduct(option.product);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: `Please enter the number of items you want to add for *${option.product.name}*:`, 
          type: "text", 
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        }]);
      }, 400);
      return; // Stop processing further for now
    }
    
    // Simulate delay
    setTimeout(() => {
      if (option.actionType === 'open_cart' || option.actionType === 'buy_now') {
         let currentCart = cart;
         if (option.actionType === 'buy_now' && option.product) {
            addToCart(option.product);
            currentCart = [...cart, { ...option.product, quantity: 1 }];
            
            const newTotal = cartTotal + option.product.price;
            if (newTotal >= 299) {
                const eligibleText = `🎉 *Great choice!*\nSince your order is over ₹299 and this is your first order this month, you have unlocked your **Monthly Free Fries**! 🍟`;
                setMessages(prev => [...prev, { 
                  id: Date.now() + 1, 
                  sender: 'bot', 
                  text: eligibleText, 
                  type: "text", 
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                }]);
            }
         }
         
         if (currentCart.length > 0) {
            const orderId = `ORD-Nugg-0001-NV-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            let itemsText = currentCart.map(item => `· ${item.name} ×${item.quantity} — INR ${(item.price * item.quantity).toFixed(2)}`).join('\n');
            
            const cartTotal = currentCart.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            let discount = 0;
            let offerName = "";
            let offerIcon = "";

            if (cartTotal >= 499) {
                discount = 100;
                offerName = "Welcome Voucher (₹100 OFF)";
                offerIcon = "🎟️";
            } else if (cartTotal >= 299) {
                discount = 0;
                offerName = "Monthly Free Fries";
                offerIcon = "🍟";
            } else {
                discount = cartTotal * 0.1;
                offerName = "VIP Member 10% OFF";
                offerIcon = "💰";
            }
            
            let receiptText = `📦 *Order ID:* ${orderId}\n\n🍔 *Products:*\n${itemsText}`;
            
            receiptText += `\n\n🎁 *VIP Offer Applied!*\n${offerIcon} *Offer:* ${offerName}\n💰 *Original Amount:* INR ${cartTotal.toFixed(2)}`;
            if (discount > 0) {
                receiptText += `\n🎉 *You Save:* INR ${discount.toFixed(2)}`;
            } else if (offerName === "Monthly Free Fries") {
                receiptText += `\n🎉 *You Save:* INR 119.00 (Free Item)`;
                receiptText += `\n🍟 *Added:* 1x Classic Fries (Free)`;
            }
            
            if (option.actionType === 'buy_now') {
                const payable = (cartTotal - discount).toFixed(2);
                receiptText += `\n\n💳 *Payable Amount:* INR ${payable}\n\n💳 *Complete your payment using the link below:*\n\n🔗 https://rzp.io/rzp/e9eX414V\n\nOnce the payment is completed, your order will be processed. ✅\n\nThank you for your order! ❤️`;
            }

            setTimeout(() => {
              if (option.actionType === 'open_cart') {
                setMessages(prev => [...prev, { 
                  id: Date.now() + 2, 
                  sender: 'bot', 
                  type: "buttons", 
                  item: {
                    bodyText: receiptText,
                    buttons: [
                      { id: "btn_continue_shopping", label: "🛍️ Continue Shopping", nextFlow: "order_food_list" },
                      { id: "btn_proceed_payment", label: "💳 Proceed to Payment", actionType: "buy_now" }
                    ]
                  },
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                }]);
              } else {
                setMessages(prev => [...prev, { id: Date.now() + 2, sender: 'bot', text: receiptText, type: "text", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
              }
            }, option.actionType === 'buy_now' ? 600 : 200);
         }
         return;
      }

      const nextFlow = option.nextFlow ? flowData[option.nextFlow] : null;
      if (nextFlow) {
        if (nextFlow.isCatalog || nextFlow.products) {
          addBotMessage(nextFlow, "products");
        } else if (nextFlow.buttons) {
          addBotMessage(nextFlow, "buttons");
        } else {
          addBotMessage(nextFlow, "list");
        }
      } else {
        if (option.actionType !== 'add_to_cart') {
          // Fallback simple message
          setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: "This feature is coming soon!", type: "text", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
          setTimeout(() => {
               addBotMessage(flowData.mainMenu, "list");
          }, 1000);
        }
      }
    }, 800);
  };

  const handleOpenMenu = (menuData) => {
    setCurrentMenu(menuData);
    setShowMenu(true);
  };

  const handleOpenProducts = (productData) => {
    setCurrentProducts(productData);
    setShowProducts(true);
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p);
      }
      return [...prev, { ...product, quantity: quantity }];
    });
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    addUserMessage(text);
    setInputText("");

    if (pendingQuantityProduct) {
      const qty = parseInt(text);
      if (!isNaN(qty) && qty > 0) {
        addToCart(pendingQuantityProduct, qty);
        setPendingQuantityProduct(null);
        
        const newTotal = cartTotal + (pendingQuantityProduct.price * qty);
        let waitTime = 400;
        
        if (newTotal >= 299) {
          const eligibleText = `🎉 *Great choice!*\nSince your order is over ₹299 and this is your first order this month, you have unlocked your **Monthly Free Fries**! 🍟`;
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              id: Date.now(), 
              sender: 'bot', 
              text: eligibleText, 
              type: "text", 
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
            }]);
          }, 400);
          waitTime = 1200;
        }

        setTimeout(() => {
          addBotMessage(flowData.cart_updated, "buttons");
        }, waitTime);
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            id: Date.now(),
            sender: 'bot',
            text: `Please enter a valid number (e.g., 1, 2, 3).`,
            type: "text",
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }, 400);
      }
      return;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(),
        sender: 'bot',
        text: `I didn't understand that. Please use the menu options.`,
        type: "text",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    }, 800);
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === productId);
      if (existing.quantity === 1) {
        return prev.filter(p => p.id !== productId);
      }
      return prev.map(p => p.id === productId ? { ...p, quantity: p.quantity - 1 } : p);
    });
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    // Generate order ID
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-6)}`;
    
    let itemsText = cart.map(item => `· *Product:* ${item.name}\n· *Quantity:* ${item.quantity}`).join('\n\n');
    const total = cartTotal;

    const receiptText = `Hi Karventhan😆👋\n\nYour order has been confirmed and payment has been received.✅\n\n📦 *Order Details*\n· *Order ID:* ${orderId}\n${itemsText}\n· *Total Amount:* ₹${total}`;

    setShowCart(false);
    setCart([]);
    addUserMessage("Confirm Order");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: "Checking out... Processing payment 💳", type: "text", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: receiptText, type: "text", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        setTimeout(() => {
            addBotMessage(flowData.mainMenu, "list");
        }, 5000);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#efeae2] text-[#111b21] font-sans overflow-hidden relative shadow-2xl">
      {/* Header */}
      <div className="bg-white px-2 py-2 flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-10 text-[#111b21]">
        <button className="p-2 mr-1 hover:bg-gray-100 rounded-full text-[#54656f]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3 shrink-0">
          <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="font-medium text-[17px] leading-tight truncate text-[#111b21] mb-0.5">+91 83173 53699</h1>
          <p className="text-[13px] text-[#54656f] leading-tight truncate">Classic Rolls and Wok</p>
        </div>
        <div className="flex gap-4 text-[#54656f] ml-2 shrink-0 items-center">
            <button 
               onClick={() => {
                   localStorage.removeItem('bot_v1_messages');
                   localStorage.removeItem('bot_v1_cart');
                   window.location.reload();
               }}
               className="text-[11px] font-semibold bg-[#008069] text-white px-2 py-1 rounded shadow-sm hover:bg-[#006b58]"
            >
               Clear Chat
            </button>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"></path></svg>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21 16.65v2.24c0 .62-.53 1.11-1.15 1.11C10.05 20 4 13.95 4 4.15 4 3.53 4.49 3 5.11 3h2.24c.54 0 .99.41 1.09.95.14.77.36 1.51.64 2.21.09.23.03.49-.16.68l-1.57 1.57c1.78 3.51 4.7 6.43 8.21 8.21l1.57-1.57c.19-.19.45-.25.68-.16.7.28 1.44.5 2.21.64.54.1.95.55.95 1.09z"></path></svg>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3"
        style={{
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
          backgroundBlendMode: 'overlay',
          backgroundColor: '#efeae2',
          opacity: 0.95
        }}
      >
        <div className="flex justify-center mb-2 mt-4">
          <div className="bg-[#fff] text-[#54656f] text-xs px-3 py-1.5 rounded-xl shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] font-medium">
            Monday
          </div>
        </div>

        <div className="flex justify-center mb-2">
          <div className="bg-[#d9eed3] text-[#54656f] text-[12.5px] leading-tight px-4 py-2.5 rounded-xl text-center shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] flex flex-col items-center max-w-[95%]">
             <span>This business uses a secure service from Meta to manage this chat. Tap to learn more.</span>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-[#fff] text-[#54656f] text-xs px-3 py-1.5 rounded-xl shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] font-medium">
            Today
          </div>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {/* User Message */}
            {msg.sender === 'user' && (
              <div className="max-w-[85%] bg-[#d9fdd3] rounded-lg p-1.5 relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] rounded-tr-none flex flex-col mt-1">
                {msg.replyToItem && (
                  <div className="bg-[#cdebc3] rounded-md p-1 mb-1 border-l-4 border-[#025b4b] flex flex-col opacity-90 overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    <span className="text-[#3b3c8f] font-bold text-[13.5px] leading-tight mb-0.5 truncate pl-1">+91 83173 53699</span>
                    <div className="flex flex-col text-[13.5px] text-[#54656f] leading-tight truncate pl-1">
                        {msg.replyToItem.headerText && <span>{msg.replyToItem.headerText}</span>}
                        <span className="truncate">{msg.replyToItem.bodyText ? msg.replyToItem.bodyText.replace(/\n/g, ' ') : ''}</span>
                    </div>
                  </div>
                )}
                <div className="px-1 text-[15px] whitespace-pre-wrap leading-tight pt-0.5">
                  {msg.text}
                  <span className="float-right text-[11px] text-[#667781] ml-3 mt-1 flex items-center">
                    {msg.timestamp}
                    <svg viewBox="0 0 16 15" width="16" height="15" className="ml-1 fill-[#8696a0]">
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                    </svg>
                  </span>
                  <div className="clear-both"></div>
                </div>
              </div>
            )}

            {/* Simple Text Bot Message */}
            {msg.sender === 'bot' && msg.type === 'text' && (
              <div className="max-w-[85%] bg-white rounded-lg p-2 pb-1 relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] rounded-tl-none">
                <div className="text-[15.5px] whitespace-pre-wrap leading-snug text-[#111b21]">
                  {msg.text.split(/(\*[^*]+\*)/g).map((part, i) => 
                    part.startsWith('*') && part.endsWith('*') 
                      ? <strong key={i} className="font-bold">{part.slice(1, -1)}</strong> 
                      : part
                  )}
                  <span className="float-right text-[11px] text-[#667781] ml-3 mt-1.5">{msg.timestamp}</span>
                  <div className="clear-both"></div>
                </div>
              </div>
            )}

            {/* Interactive Bot Messages */}
            {msg.sender === 'bot' && (msg.type === 'list' || msg.type === 'buttons' || msg.type === 'products') && (
              <div className="min-w-[260px] max-w-[85%] bg-white rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] rounded-tl-none flex flex-col overflow-hidden">
                
                {/* Optional Header Image */}
                {msg.item.headerImage && (
                  <img src={msg.item.headerImage} alt="Header" className="w-full h-40 object-cover" />
                )}

                {/* Optional Catalog Card */}
                {msg.item.catalogCard && (
                  <div className="mx-1 mt-1 rounded-md bg-[#f0f2f5] flex items-center overflow-hidden mb-2">
                    <img src={msg.item.catalogCard.image} alt="Catalog" className="w-16 h-16 object-cover shrink-0" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop'; }} />
                    <div className="flex-1 px-2.5 py-1 min-w-0">
                      <h4 className="font-semibold text-[14.5px] text-[#111b21] truncate">{msg.item.catalogCard.title}</h4>
                      <p className="text-[13px] text-[#54656f] truncate mt-0.5">{msg.item.catalogCard.subtitle}</p>
                    </div>
                  </div>
                )}

                <div className={`px-3 ${msg.item.catalogCard ? 'pt-1' : 'pt-2'} pb-1.5`}>
                  {/* Optional Header Text */}
                  {msg.item.headerText && (
                    <h3 className="font-bold text-[15px] mb-1 leading-tight">{msg.item.headerText}</h3>
                  )}
                  
                  {/* Body Text */}
                  <div className="text-[15.5px] whitespace-pre-wrap leading-snug text-[#111b21]">
                    {msg.item.bodyText}
                  </div>
                  
                  {/* Footer Text & Timestamp */}
                  <div className="mt-1">
                    {msg.item.footerText && (
                      <span className="text-[13px] text-[#54656f]">{msg.item.footerText}</span>
                    )}
                    <span className="float-right text-[11px] text-[#667781] ml-3 mt-1.5">{msg.timestamp}</span>
                    <div className="clear-both"></div>
                  </div>
                </div>

                {/* List Button */}
                {msg.type === 'list' && (
                  <button 
                    onClick={() => handleOpenMenu(msg.item)}
                    className="w-full border-t border-[#e9edef] py-3.5 flex items-center justify-center text-[#008069] font-medium active:bg-gray-50 transition-colors text-[15.5px]"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2 fill-current">
                      <path d="M8 6h13v2H8V6zm-4 0h2v2H4V6zm4 5h13v2H8v-2zm-4 0h2v2H4v-2zm4 5h13v2H8v-2zm-4 0h2v2H4v-2z"></path>
                    </svg>
                    {msg.item.buttonText || "View Items"}
                  </button>
                )}

                {/* Product Catalog Button */}
                {msg.type === 'products' && (
                  <div className="flex flex-col border-t border-[#e9edef]">
                    <button 
                      onClick={() => handleOpenProducts(msg.item)}
                      className="w-full py-3.5 flex items-center justify-center text-[#008069] font-medium active:bg-gray-50 transition-colors text-[15.5px]"
                    >
                      {msg.item.buttonText}
                    </button>
                    {cart.length > 0 && (
                      <button 
                        onClick={() => setShowCart(true)}
                        className="w-full border-t border-[#e9edef] py-3 flex items-center justify-center text-[#00a884] font-medium active:bg-gray-50 transition-colors"
                      >
                         View Cart (₹{cartTotal})
                      </button>
                    )}
                  </div>
                )}

                {/* Reply Buttons */}
                {msg.type === 'buttons' && msg.item.buttons && (
                  <div className="flex flex-col">
                    {msg.item.buttons.map((btn, index) => (
                      <button 
                        key={btn.id}
                        onClick={() => handleActionSelect(btn, msg.item)}
                        className="w-full border-t border-[#e9edef] py-3 flex items-center justify-center text-[#00a884] font-medium active:bg-gray-50 transition-colors"
                      >
                        {/* Optional icon like curved arrow could go here */}
                        <svg viewBox="0 0 24 24" width="18" height="18" className="mr-2 fill-current opacity-70">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path>
                        </svg>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] px-1.5 py-1.5 flex items-end">
        <button className="p-2 text-[#54656f] hover:text-[#008069] mr-0.5">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.28-7.39c.67 0 1.22-.55 1.22-1.22s-.55-1.22-1.22-1.22-1.22.55-1.22 1.22.55 1.22 1.22 1.22zm-6.56 0c.67 0 1.22-.55 1.22-1.22s-.55-1.22-1.22-1.22-1.22.55-1.22 1.22.55 1.22 1.22 1.22zm7.14 2.87c-.89 1.48-2.52 2.45-4.36 2.45s-3.47-.97-4.36-2.45l.87-.51c.69 1.16 1.95 1.93 3.49 1.93s2.81-.77 3.49-1.93l.87.51z"></path>
          </svg>
        </button>
        <div className="flex-1 bg-white rounded-3xl px-4 py-2 min-h-[44px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] flex items-center mx-1 mb-0.5 overflow-hidden">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendText();
            }}
            placeholder="Message"
            className="text-[17px] text-[#111b21] flex-1 font-normal outline-none bg-transparent"
          />
          <button className="p-1 text-[#54656f] hover:text-[#008069] mr-2 shrink-0">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{transform: "rotate(-45deg)"}}><path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"></path></svg>
          </button>
          <button className="p-1 text-[#54656f] hover:text-[#008069] shrink-0">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21.036 6.5h-3.486l-1.096-2.193a.98.98 0 0 0-.895-.532h-7.118a.98.98 0 0 0-.895.532L6.45 6.5H2.964C1.88 6.5 1 7.38 1 8.464v10.572c0 1.084.88 1.964 1.964 1.964h18.072C22.12 21 23 20.12 23 19.036V8.464C23 7.38 22.12 6.5 21.036 6.5zM12 18.25c-3.176 0-5.75-2.574-5.75-5.75s2.574-5.75 5.75-5.75 5.75 2.574 5.75 5.75-2.574 5.75-5.75 5.75zm0-9.5c-2.071 0-3.75 1.679-3.75 3.75s1.679 3.75 3.75 3.75 3.75-1.679 3.75-3.75-1.679-3.75-3.75-3.75z"></path></svg>
          </button>
        </div>
        <button onClick={inputText.trim() ? handleSendText : undefined} className="bg-[#00a884] rounded-full p-3 ml-1 text-white shadow-sm mb-1 flex items-center justify-center shrink-0 cursor-pointer">
            {inputText.trim() ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.349 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.002z"></path></svg>
            )}
        </button>
      </div>

      {/* Menu Modal (iOS style drawer) */}
      {showMenu && currentMenu && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40 animate-in fade-in duration-200">
          <div className="bg-[#f0f2f5] w-full rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transform transition-transform animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center p-4 border-b border-[#d1d7db] bg-white">
              <button onClick={() => setShowMenu(false)} className="text-[#008069] text-[17px] font-medium">
                Cancel
              </button>
              <h2 className="font-semibold text-[17px]">Options</h2>
              <div className="w-16"></div> {/* Spacer for center alignment */}
            </div>
            
            <div className="overflow-y-auto flex-1 bg-white">
              {currentMenu.sections ? (
                currentMenu.sections.map((section, idx) => (
                  <div key={idx}>
                    <div className="bg-[#f0f2f5] px-4 py-2 text-[13.5px] font-bold text-[#54656f] uppercase tracking-wider">{section.title}</div>
                    {section.rows.map(option => (
                      <button 
                        key={option.id}
                        onClick={() => handleActionSelect(option, currentMenu)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between active:bg-[#f0f2f5] transition-colors border-b border-[#f0f2f5] last:border-0"
                      >
                        <div>
                          <span className="text-[17px] text-[#111b21] block leading-tight">{option.label}</span>
                          {option.description && <span className="text-[14px] text-[#54656f] block mt-1">{option.description}</span>}
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-[#d1d7db] shrink-0 ml-3"></div>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                currentMenu.options?.map(option => (
                  <button 
                    key={option.id}
                    onClick={() => handleActionSelect(option, currentMenu)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between active:bg-[#f0f2f5] transition-colors border-b border-[#f0f2f5] last:border-0"
                  >
                    <span className="text-[17px] text-[#111b21]">{option.label}</span>
                    <div className="w-5 h-5 rounded-full border-2 border-[#d1d7db]"></div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Drawer */}
      {showProducts && currentProducts && (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#f0f2f5] animate-in slide-in-from-bottom duration-300">
          <div className="bg-[#008069] px-4 py-3 flex items-center shadow-sm text-white">
             <button onClick={() => setShowProducts(false)} className="mr-4">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
              </button>
              <h2 className="font-semibold text-[17px] flex-1">Catalog</h2>
              {cart.length > 0 && (
                <button onClick={() => { setShowProducts(false); setShowCart(true); }} className="relative">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cart.reduce((a,c) => a+c.quantity, 0)}</span>
                </button>
              )}
          </div>
          
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-4 border-b border-[#f0f2f5] bg-white">
                <h2 className="text-xl font-bold">{currentProducts.headerText || "Menu"}</h2>
                <p className="text-[#54656f] text-sm mt-1">{currentProducts.bodyText}</p>
            </div>
            {menuCategories
              .filter(category => currentProducts.productsToDisplay ? category.id === currentProducts.productsToDisplay : true)
              .map(category => (
                <div key={category.id} className="mb-4">
                  <div className="bg-[#f0f2f5] px-4 py-2 sticky top-0 z-10 shadow-sm font-semibold text-[#54656f]">{category.name}</div>
                  {category.productIds.map(productId => {
                     const product = productsMap[productId];
                     if (!product) return null;
                     return (
                      <div key={product.id} className="p-4 border-b border-[#f0f2f5] flex gap-4 bg-white items-start">
                         <div className="flex-1">
                           <h3 className="font-semibold text-[17px] text-[#111b21]">{product.name}</h3>
                           <span className="text-[#54656f] font-medium text-sm mt-1 block">₹{product.price}</span>
                           <p className="text-[#54656f] text-sm mt-1 line-clamp-2">{product.description}</p>
                         </div>
                         <div className="flex flex-col items-center gap-2 shrink-0">
                            <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded-xl shadow-sm" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'; }} />
                            
                            {cart.find(p => p.id === product.id) ? (
                                <div className="flex items-center gap-3 bg-[#f0f2f5] rounded-lg px-2 py-1">
                                    <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 flex items-center justify-center text-[#008069] font-bold text-lg">-</button>
                                    <span className="text-sm font-semibold">{cart.find(p => p.id === product.id).quantity}</span>
                                    <button onClick={() => addToCart(product)} className="w-6 h-6 flex items-center justify-center text-[#008069] font-bold text-lg">+</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => addToCart(product)}
                                    className="text-[#008069] font-bold text-sm px-4 py-1.5 border border-[#d1d7db] rounded-lg hover:bg-[#f0f2f5]"
                                >
                                    ADD
                                </button>
                            )}
                         </div>
                      </div>
                     );
                  })}
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart View */}
      {showCart && (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#f0f2f5] animate-in slide-in-from-bottom duration-300">
          <div className="bg-[#008069] px-4 py-3 flex items-center shadow-sm text-white">
             <button onClick={() => setShowCart(false)} className="mr-4">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
              </button>
              <h2 className="font-semibold text-[17px]">Cart</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="bg-white p-4 border-b border-[#f0f2f5] flex items-center gap-4">
                 <img src={item.local_image} alt={item.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'; }} />
                 <div className="flex-1">
                   <h3 className="font-medium text-[15px]">{item.name}</h3>
                   <span className="text-[#54656f] text-sm mt-1">₹{item.price}</span>
                 </div>
                 <div className="flex items-center gap-3 bg-[#f0f2f5] rounded-lg px-2 py-1">
                   <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center text-[#008069] font-bold text-lg">-</button>
                   <span className="text-sm font-semibold">{item.quantity}</span>
                   <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center text-[#008069] font-bold text-lg">+</button>
                 </div>
                 <span className="font-bold text-[15px] ml-2 w-12 text-right">₹{item.price * item.quantity}</span>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[#54656f] mt-20">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" className="mb-4 opacity-50"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                <p className="text-[15px]">Your cart is empty</p>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-[#d1d7db]">
              <div className="flex justify-between mb-4 text-[#111b21] px-2">
                <span className="font-medium text-[15px]">Total Amount</span>
                <span className="font-bold text-[17px]">₹{cartTotal}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-[#008069] text-white py-3.5 rounded-full font-medium text-[15px] shadow-sm active:bg-[#006b58] transition-colors"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
