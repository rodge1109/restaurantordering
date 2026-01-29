import React, { useState, createContext, useContext, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ChevronRight, Check, X, Search } from 'lucide-react';

// Cart Context
const CartContext = createContext();

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

// Google Sheets API URL - UPDATE THIS WITH YOUR WEB APP URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYH_e2AeORBFguaq3VrrbdpWXJfXYgNM-gGS3R4mgzVjI6tMAwwzZbPRCE-GgjgbAZ/exec';

// Fallback Menu Data (used if Google Sheets fetch fails)
const fallbackMenuData = [
  { id: 1, name: 'Margherita Pizza', category: 'Pizza', price: 12.99, image: 'assets/images/food/pepperoni.png', description: 'Classic tomato sauce, mozzarella, fresh basil', popular: true },
  { id: 2, name: 'Pepperoni Pizza', category: 'Pizza', price: 14.99, image: 'assets/images/food/burgerpizza.png', description: 'Loaded with pepperoni and mozzarella', popular: true },
  { id: 3, name: 'BBQ Chicken Pizza', category: 'Pizza', price: 15.99, image: 'assets/images/food/pepperoni.png', description: 'BBQ sauce, grilled chicken, red onions', popular: false },
  { id: 4, name: 'Veggie Supreme', category: 'Pizza', price: 13.99, image: 'assets/images/food/pepperoni.png', description: 'Mushrooms, peppers, olives, onions', popular: false },

  { id: 5, name: 'Classic Burger', category: 'Burgers', price: 9.99, image: 'assets/images/food/pepperoni.png', description: 'Beef patty, lettuce, tomato, cheese', popular: true },
  { id: 6, name: 'Bacon Cheeseburger', category: 'Burgers', price: 11.99, image: 'assets/images/food/pepperoni.png', description: 'Double beef, bacon, cheddar cheese', popular: true },
  { id: 7, name: 'Veggie Burger', category: 'Burgers', price: 10.99, image: 'assets/images/food/pepperoni.png', description: 'Plant-based patty, avocado, sprouts', popular: false },
  { id: 8, name: 'Chicken Burger', category: 'Burgers', price: 10.49, image: 'assets/images/food/pepperoni.png', description: 'Grilled chicken breast, mayo, lettuce', popular: false },

  { id: 9, name: 'Spaghetti Carbonara', category: 'Pasta', price: 13.99, image: 'assets/images/food/pepperoni.png', description: 'Creamy sauce, bacon, parmesan', popular: true },
  { id: 10, name: 'Penne Arrabiata', category: 'Pasta', price: 12.49, image: 'assets/images/food/pepperoni.png', description: 'Spicy tomato sauce, garlic, herbs', popular: false },
  { id: 11, name: 'Fettuccine Alfredo', category: 'Pasta', price: 13.49, image: 'assets/images/food/pepperoni.png', description: 'Rich cream sauce, parmesan cheese', popular: true },
  { id: 12, name: 'Lasagna', category: 'Pasta', price: 14.99, image: 'assets/images/food/pepperoni.png', description: 'Layered pasta, beef, ricotta, mozzarella', popular: false },

  { id: 13, name: 'Caesar Salad', category: 'Salads', price: 8.99, image: 'assets/images/food/pepperoni.png', description: 'Romaine, croutons, parmesan, caesar dressing', popular: true },
  { id: 14, name: 'Greek Salad', category: 'Salads', price: 9.49, image: 'assets/images/food/pepperoni.png', description: 'Feta, olives, cucumber, tomatoes', popular: false },
  { id: 15, name: 'Caprese Salad', category: 'Salads', price: 10.99, image: 'assets/images/food/pepperoni.png', description: 'Fresh mozzarella, tomatoes, basil', popular: false },

  { id: 16, name: 'Coca Cola', category: 'Drinks', price: 2.99, image: 'assets/images/food/pepperoni.png', description: 'Classic cola, 500ml', popular: true },
  { id: 17, name: 'Fresh Lemonade', category: 'Drinks', price: 3.49, image: 'assets/images/food/pepperoni.png', description: 'Freshly squeezed lemon juice', popular: true },
  { id: 18, name: 'Iced Tea', category: 'Drinks', price: 2.99, image: 'assets/images/food/pepperoni.png', description: 'Peach iced tea', popular: false },

  { id: 19, name: 'Chocolate Cake', category: 'Desserts', price: 6.99, image: 'assets/images/food/pepperoni.png', description: 'Rich chocolate layer cake', popular: true },
  { id: 20, name: 'Tiramisu', category: 'Desserts', price: 7.49, image: 'assets/images/food/pepperoni.png', description: 'Italian coffee-flavored dessert', popular: true },
];

const categories = ['All', 'Pizza', 'Burgers', 'Pasta', 'Salads', 'Drinks', 'Desserts'];

// Main App Component
export default function RestaurantApp() {
  const [cartItems, setCartItems] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);

  // Products state
  const [menuData, setMenuData] = useState(fallbackMenuData);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // Fetch products from Google Sheets on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);

        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();

        if (data.success && data.products && data.products.length > 0) {
          setMenuData(data.products);
        } else {
          // Use fallback data if no products returned
          setMenuData(fallbackMenuData);
          setProductsError('Using offline menu data');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setMenuData(fallbackMenuData);
        setProductsError('Using offline menu data');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (item) => {
    const existingItem = cartItems.find(i => i.id === item.id);
    if (existingItem) {
      setCartItems(cartItems.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(id);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice
  };

  return (
    <CartContext.Provider value={contextValue}>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        /* Hide scrollbar for category filter */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Boston Celtics Green Color Override */
        .bg-green-600 {
          background-color: #007A33 !important;
        }
        .bg-green-500 {
          background-color: #008C3C !important;
        }
        .bg-green-700 {
          background-color: #006129 !important;
        }
        .bg-green-400 {
          background-color: #00A34A !important;
        }
        .bg-green-100 {
          background-color: #E6F4EC !important;
        }
        .text-green-600 {
          color: #007A33 !important;
        }
        .text-green-400 {
          color: #00A34A !important;
        }
        .text-green-100 {
          color: #E6F4EC !important;
        }
        .text-green-700 {
          color: #006129 !important;
        }
        .border-green-600 {
          border-color: #007A33 !important;
        }
        .border-green-300 {
          border-color: #66C299 !important;
        }
        .border-green-400 {
          border-color: #00A34A !important;
        }
        .border-green-500 {
          border-color: #008C3C !important;
        }
        .hover\\:bg-green-700:hover {
          background-color: #006129 !important;
        }
        .hover\\:bg-green-500:hover {
          background-color: #008C3C !important;
        }
        .hover\\:text-green-600:hover {
          color: #007A33 !important;
        }
        .hover\\:bg-green-100:hover {
          background-color: #E6F4EC !important;
        }
        .from-green-900 {
          --tw-gradient-from: #004D20 !important;
        }
        .to-green-900 {
          --tw-gradient-to: #004D20 !important;
        }
        .via-green-900 {
          --tw-gradient-via: #004D20 !important;
        }
        .from-green-400 {
          --tw-gradient-from: #00A34A !important;
        }
        .to-green-500 {
          --tw-gradient-to: #008C3C !important;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
        <Header
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setShowCart={setShowCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        {currentPage === 'home' && (
          <HomePage
            setCurrentPage={setCurrentPage}
            menuData={menuData}
            isLoading={isLoadingProducts}
          />
        )}
        {currentPage === 'menu' && (
          <MenuPage
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            menuData={menuData}
            isLoading={isLoadingProducts}
          />
        )}
        {currentPage === 'cart' && <CartPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'checkout' && <CheckoutPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'confirmation' && <ConfirmationPage setCurrentPage={setCurrentPage} />}
        {showCart && <CartDrawer setShowCart={setShowCart} setCurrentPage={setCurrentPage} />}
      </div>
    </CartContext.Provider>
  );
}

// Header Component
function Header({ currentPage, setCurrentPage, setShowCart, searchQuery, setSearchQuery }) {
  const { getTotalItems } = useCart();

  return (
    <header className="bg-green-600 shadow-2xl sticky top-0 z-50 border-b-4 border-green-400">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="text-5xl font-black text-white drop-shadow-lg">K</div>
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow-lg tracking-wider">Kuchefnero.ph</h1>
              <p className="text-xs text-white font-bold">Food Ordering System (ver 1.0)</p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && currentPage !== 'menu') setCurrentPage('menu');
              }}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-green-500 focus:border-green-700 focus:outline-none font-bold text-green-800 bg-green-100 placeholder-green-700/50"
            />
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`font-black transition-all px-4 py-2 rounded-lg text-sm tracking-wider ${currentPage === 'home' ? 'bg-green-400 text-green-700' : 'text-green-400 hover:bg-green-700'}`}
            >
              HOME
            </button>
            <button 
              onClick={() => setCurrentPage('menu')}
              className={`font-black transition-all px-4 py-2 rounded-lg text-sm tracking-wider ${currentPage === 'menu' ? 'bg-green-400 text-green-700' : 'text-green-400 hover:bg-green-700'}`}
            >
              MENU
            </button>
          </nav>

          <button
            onClick={() => setShowCart(true)}
            className="relative bg-green-400 text-white px-6 py-2 rounded-full hover:shadow-2xl transition-all flex items-center space-x-2 shadow-lg hover:scale-105 font-black text-sm"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>CART</span>
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-black animate-bounce">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>

        <div className="mt-3 md:hidden relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for food..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value && currentPage !== 'menu') setCurrentPage('menu');
            }}
            className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-green-500 focus:border-green-700 focus:outline-none font-bold text-green-800 bg-green-100 placeholder-green-700/50"
          />
        </div>
      </div>
    </header>
  );
}

// Home Page
function HomePage({ setCurrentPage, menuData, isLoading }) {
  const popularItems = menuData.filter(item => item.popular).slice(0, 6);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "TASTE THE SUCCESS",
      subtitle: "DELIVERED FAST!",
      description: "Order your favorite meals and get them delivered hot and fresh",
      bgImage: "assets/images/hero/hero1.jpg"
    },
    {
      title: "FRESH & DELICIOUS",
      subtitle: "EVERY TIME!",
      description: "Made with quality ingredients, cooked with passion",
      bgImage: "assets/images/hero/hero1.jpg"
    },
    {
      title: "30 MINUTES OR LESS",
      subtitle: "GUARANTEED!",
      description: "Fast delivery right to your doorstep",
      bgImage: "assets/images/hero/hero1.jpg"
    },
    {
      title: "ORDER NOW",
      subtitle: "PAY LATER!",
      description: "Multiple payment options available for your convenience",
      bgImage: "assets/images/hero/hero1.jpg"
    }
  ];

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div>
      {/* Hero Carousel Section */}
      <section className="relative overflow-hidden">
        <div className="relative h-[307px] md:h-[400px]">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 text-white transition-all duration-700 ease-in-out transform ${
                index === currentSlide
                  ? 'translate-x-0 opacity-100'
                  : index < currentSlide
                  ? '-translate-x-full opacity-0'
                  : 'translate-x-full opacity-0'
              }`}
              style={{
                backgroundImage: `url(${slide.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                <h1 className="text-5xl md:text-7xl font-black mb-4 drop-shadow-lg animate-fadeIn">
                  {slide.title}
                  <br />
                  <span className="text-yellow-300">{slide.subtitle}</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-white font-bold animate-fadeIn">
                  {slide.description}
                </p>
                <button
                  onClick={() => setCurrentPage('menu')}
                  className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-black hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl inline-flex items-center space-x-2 tracking-wider animate-fadeIn hover:scale-105"
                >
                  <span>ORDER NOW</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full transition-all z-10 hover:scale-110"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full transition-all z-10 hover:scale-110"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Navigation */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'bg-white w-8 h-3'
                  : 'bg-white/50 hover:bg-white/75 w-3 h-3'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-green-600 mb-8 sm:mb-12 text-center drop-shadow-lg">⭐ POPULAR NOW</h2>
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-xl text-green-600 font-bold">Loading popular items...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {popularItems.map(item => (
                <PopularItemCard key={item.id} item={item} />
              ))}
            </div>
            <div className="text-center mt-8 sm:mt-12">
              <button
                onClick={() => setCurrentPage('menu')}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-black hover:bg-red-700 transition-all shadow-lg text-sm tracking-wider"
              >
                VIEW FULL MENU
              </button>
            </div>
          </>
        )}
        </div>
      </section>

      {/* Features & Contact Info */}
      <section className="bg-gray-50 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-16">
            <div className="bg-green-600 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-black text-white mb-2">FAST DELIVERY</h3>
              <p className="text-green-100 font-bold">Get your food delivered in 30 minutes or less</p>
            </div>
            <div className="bg-green-600 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-6xl mb-4">👨‍🍳</div>
              <h3 className="text-xl font-black text-white mb-2">FRESH FOOD</h3>
              <p className="text-green-100 font-bold">Made fresh daily with quality ingredients</p>
            </div>
            <div className="bg-green-600 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-black text-white mb-2">BEST QUALITY</h3>
              <p className="text-green-100 font-bold">Rated 4.9/5 by our satisfied customers</p>
            </div>
          </div>

          {/* Contact & Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left border-t-2 border-green-300 pt-6">
            {/* About */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">ABOUT US</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Kuchefnero delivers delicious food right to your doorstep. Quality ingredients, fast service, and satisfied customers since 2020.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">CONTACT</h4>
              <div className="space-y-3 text-gray-700 text-sm">
                <div className="flex items-start space-x-2">
                  <span>📍</span>
                  <span>123 Food Street, Quezon City, NCR, Philippines</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>+63 912 345 6789</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📧</span>
                  <span>hello@kuchefnero.com</span>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">HOURS</h4>
              <div className="space-y-2 text-gray-700 text-sm">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9AM - 11PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10AM - 12AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>10AM - 10PM</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">FOLLOW US</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-xl transition-all">
                  📘
                </a>
                <a href="#" className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-xl transition-all">
                  📷
                </a>
                <a href="#" className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-xl transition-all">
                  🐦
                </a>
              </div>
              <div className="text-gray-700 text-sm">
                <p className="mb-2">Subscribe to our newsletter:</p>
                <div className="flex space-x-2">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-xs font-bold"
                  />
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-black text-xs transition-all">
                    GO
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t-2 border-green-300 mt-12 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2026 Kuchefnero. All rights reserved. |
              <a href="#" className="hover:text-green-600 transition-all ml-1">Privacy Policy</a> |
              <a href="#" className="hover:text-green-600 transition-all ml-1">Terms of Service</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Popular Item Card
function PopularItemCard({ item }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-gray-50 rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group w-full h-96 flex flex-col">
      <div className="bg-gray-50 p-8 text-center flex-1 flex flex-col justify-center">
        {item.image && item.image.startsWith('assets/') ? (
          <img src={item.image} alt={item.name} className="object-contain mx-auto rounded-lg h-32 w-32 group-hover:scale-110 transition-transform bg-gray-50" />
        ) : (
          <div className="text-7xl group-hover:scale-110 transition-transform">{item.image}</div>
        )}
      </div>
      <div className="p-6 flex flex-col justify-between h-40">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-black text-green-600">{item.name}</h3>
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-black">POPULAR</span>
        </div>
        <p className="text-gray-600 text-sm mb-4 font-semibold">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-black text-red-600">Php {item.price.toFixed(2)}</span>
          <button 
            onClick={() => addToCart(item)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center space-x-1 font-black text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Menu Page
function MenuPage({ selectedCategory, setSelectedCategory, searchQuery, menuData, isLoading }) {
  const filteredItems = menuData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Category Filter - Right below header */}
      <div className="bg-white shadow-md sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-1 py-3 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-all text-xs tracking-wide ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-green-600 mb-6 sm:mb-8 text-center">OUR MENU</h1>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-xl text-green-600 font-bold">Loading menu...</p>
          </div>
        ) : (
          <>
            {/* Menu Grid - Optimized for horizontal cards */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              {filteredItems.map(item => (
                <MenuItem key={item.id} item={item} />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <p className="text-2xl text-gray-400">No items found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Menu Item Card
function MenuItem({ item }) {
  const { addToCart } = useCart();

  return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group w-full flex flex-row h-auto min-h-[140px] sm:min-h-[150px]">
        {/* Left side - Product Image */}
        <div className="bg-gray-50 p-3 sm:p-4 flex items-center justify-center w-28 sm:w-32 md:w-36 flex-shrink-0 relative">
          {item.image && item.image.startsWith('assets/') ? (
            <img src={item.image} alt={item.name} className="object-contain w-full h-28 sm:h-32 md:h-36 rounded-lg group-hover:scale-110 transition-transform duration-300" />
          ) : (
            <div className="text-4xl sm:text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">{item.image}</div>
          )}
          {item.popular && (
            <span className="absolute top-1 right-1 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-black">
            HOT
          </span>
        )}
      </div>

      {/* Right side - Product Details */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="text-sm sm:text-base font-medium text-green-600 mb-1 truncate">{item.name}</h3>
          <p className="text-gray-600 text-xs sm:text-xs mb-2 line-clamp-2 font-normal">{item.description}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-base sm:text-lg md:text-xl font-semibold text-green-600 whitespace-nowrap">Php {item.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(item)}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center space-x-1 text-xs font-medium flex-shrink-0 hover:scale-105"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Cart Drawer
function CartDrawer({ setShowCart, setCurrentPage }) {
  const { cartItems } = useCart();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={() => setShowCart(false)}>
      <div className="bg-gray-100 w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
            <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map(item => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>
              <button 
                onClick={() => {
                  setShowCart(false);
                  setCurrentPage('cart');
                }}
                className="w-full bg-green-600 text-white py-4 rounded-full font-bold hover:bg-green-700 transition-all"
              >
                View Full Cart
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Cart Page
function CartPage({ setCurrentPage }) {
  const { cartItems, getTotalPrice } = useCart();
  const deliveryFee = 4.99;
  const tax = getTotalPrice() * 0.08;
  const total = getTotalPrice() + deliveryFee + tax;

  if (cartItems.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
        <ShoppingCart className="w-24 h-24 text-red-300 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-red-600 mb-4">YOUR CART IS EMPTY</h2>
        <p className="text-gray-600 mb-8 font-bold text-lg">Add some delicious items to get started!</p>
        <button
          onClick={() => setCurrentPage('menu')}
          className="bg-red-600 text-white px-8 py-3 rounded-lg font-black hover:bg-red-700 transition-all text-lg tracking-wider"
        >
          BROWSE MENU
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-5xl font-black text-green-600 mb-12 text-center">🛒 YOUR CART</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4 mb-6 bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-md">
          {cartItems.map(item => (
            <CartItemCard key={item.id} item={item} detailed />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 border-t-4 border-green-600">
            <h3 className="text-2xl font-black text-red-600 mb-6">ORDER SUMMARY</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Php {getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>Php {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>Php {tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">Php {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('checkout')}
              className="w-full bg-green-600 text-white py-4 rounded-full font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// Cart Item Card
function CartItemCard({ item, detailed = false }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex items-center space-x-4">
      <div className="bg-white rounded-lg p-3 flex items-center justify-center w-20 h-20">
        {item.image && item.image.startsWith('assets/') ? (
          <img src={item.image} alt={item.name} className="object-contain w-full h-full rounded" />
        ) : (
          <div className="text-4xl">{item.image}</div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-black text-green-600 text-sm">{item.name}</h3>
        <p className="text-green-600 font-black text-sm">Php {item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-all"
        >
          <Minus className="w-4 h-4 text-red-600" />
        </button>
        <span className="font-black text-lg w-8 text-center">{item.quantity}</span>
        <button 
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {detailed && (
        <button 
          onClick={() => removeFromCart(item.id)}
          className="text-green-600 hover:text-green-700 p-2 font-black"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Checkout Page
function CheckoutPage({ setCurrentPage }) {
  const { getTotalPrice, cartItems } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'credit'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare order data
      const orderNumber = `MD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
      const orderDate = new Date().toLocaleString();
      const deliveryFee = 4.99;
      const tax = getTotalPrice() * 0.08;
      const total = getTotalPrice() + deliveryFee + tax;

      // Format cart items as a string
      const itemsList = cartItems.map(item =>
        `${item.name} (x${item.quantity}) - Php ${(item.price * item.quantity).toFixed(2)}`
      ).join(', ');

      // Send data to Google Sheets (uses GOOGLE_SCRIPT_URL from top of file)
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNumber,
          orderDate: orderDate,
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          barangay: formData.zipCode,
          paymentMethod: formData.paymentMethod,
          items: itemsList,
          subtotal: getTotalPrice().toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2)
        })
      });

      // Navigate to confirmation page
      setCurrentPage('confirmation');
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFee = 4.99;
  const tax = getTotalPrice() * 0.08;
  const total = getTotalPrice() + deliveryFee + tax;

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-5xl font-black text-green-600 mb-12 text-center">💳 CHECKOUT</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white bg-opacity-95 rounded-xl shadow-lg p-6 space-y-6 border-t-4 border-green-600">
            <div>
              <h3 className="text-xl font-black text-green-600 mb-4">📍 DELIVERY ADDRESS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border-2 border-red-600 focus:border-red-700 focus:outline-none font-semibold"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border-2 border-red-600 focus:border-red-700 focus:outline-none font-semibold"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border-2 border-red-600 focus:border-red-700 focus:outline-none font-semibold"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border-2 border-red-600 focus:border-red-700 focus:outline-none font-semibold"
                />
              </div>
              <input
                type="text"
                placeholder="Street Address"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border-2 border-red-600 focus:border-red-700 focus:outline-none font-semibold mt-4"
              />
              <input
                type="text"
                placeholder="City"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border-2 border-red-600 focus:border-red-700 focus:outline-none font-semibold mt-4"
              />
            </div>

            <div>
              <h3 className="text-xl font-black text-green-600 mb-4">💰 PAYMENT METHOD</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border-2 border-green-600 rounded-lg cursor-pointer hover:bg-green-50 transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="credit"
                    checked={formData.paymentMethod === 'credit'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-black text-green-600">💳 Credit/Debit Card</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-green-600 rounded-lg cursor-pointer hover:bg-green-50 transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-black text-green-600">💵 Cash on Delivery</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-green-600 rounded-lg cursor-pointer hover:bg-green-50 transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-black text-green-600">🅿️ PayPal</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-green-600 rounded-lg cursor-pointer hover:bg-green-50 transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    checked={formData.paymentMethod === 'gcash'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-black text-green-600">📱 GCash</span>
                </label>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg font-black transition-all shadow-lg hover:shadow-xl text-lg tracking-wider ${
                isSubmitting 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'PROCESSING ORDER...' : `PLACE ORDER - Php ${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white bg-opacity-95 rounded-xl shadow-lg p-6 sticky top-24 border-t-4 border-green-600">
            <h3 className="text-2xl font-black text-green-600 mb-6">ORDER SUMMARY</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Php {getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>Php {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>Php {tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-green-600">Php {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-600 font-black">
                <Check className="w-5 h-5" />
                <span>Free delivery on orders over Php 30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// Confirmation Page
function ConfirmationPage({ setCurrentPage }) {
  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-2xl mx-auto px-4">
      <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-12 text-center mb-8 shadow-2xl mt-8">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h1 className="text-5xl font-black text-white mb-4">ORDER CONFIRMED!</h1>
        <p className="text-white text-xl font-black">Thank you for your order. Your delicious food is on the way!</p>
      </div>

      <div className="bg-green-600 rounded-xl p-6 mb-8 shadow-lg">
        <div className="text-sm text-green-400 font-black mb-2">ORDER NUMBER</div>
        <div className="text-3xl font-black text-white">#MD{Math.floor(Math.random() * 10000).toString().padStart(5, '0')}</div>
      </div>

      <div className="space-y-4 mb-8 text-left">
        <div className="flex items-center space-x-4 p-4 bg-green-300 rounded-lg border-2 border-green-400">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-2xl text-white font-black">
            ✓
          </div>
          <div>
            <div className="font-black text-green-700">ORDER RECEIVED</div>
            <div className="text-sm text-green-700 font-bold">We've received your order</div>
          </div>
        </div>
        <div className="flex items-center space-x-4 p-4 bg-green-200 rounded-lg border-2 border-green-300">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-2xl text-white font-black">
            👨‍🍳
          </div>
          <div>
            <div className="font-black text-green-700">PREPARING</div>
            <div className="text-sm text-green-700 font-bold">Your food is being prepared</div>
          </div>
        </div>
        <div className="flex items-center space-x-4 p-4 bg-green-100 rounded-lg border-2 border-green-200">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-2xl text-white font-black">
            🚗
          </div>
          <div>
            <div className="font-black text-green-700">ON THE WAY</div>
            <div className="text-sm text-green-700 font-bold">Estimated time: 25-30 mins</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 border-2 border-blue-600 rounded-lg p-4 mb-8">
        <div className="text-sm text-blue-700 font-black mb-2">📱 TRACK YOUR ORDER</div>
        <p className="text-sm text-blue-700 font-bold">You will receive a text message with delivery updates</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => setCurrentPage('home')}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-black hover:bg-green-700 transition-all text-lg tracking-wider"
        >
          BACK HOME
        </button>
        <button
          onClick={() => setCurrentPage('menu')}
          className="flex-1 bg-green-400 text-green-700 py-3 rounded-lg font-black hover:bg-green-500 transition-all text-lg tracking-wider"
        >
          ORDER AGAIN
        </button>
      </div>
      </div>
    </div>
  );
}