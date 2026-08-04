"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "home" | "menu" | "orders" | "admin";
type AdminTab = "overview" | "menu" | "orders" | "customers";
type OrderStatus = "Pending" | "Preparing" | "Out for Delivery" | "Delivered";

type Food = {
  id: number;
  name: string;
  tamil: string;
  price: number;
  category: string;
  rating: number;
  description: string;
  image: string;
  tag?: string;
};

type CartItem = Food & { quantity: number };

type Order = {
  id: string;
  customer: string;
  mobile: string;
  address: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  time: string;
  payment: string;
};

const defaultFoods: Food[] = [
  {
    id: 1,
    name: "Steamed Rice",
    tamil: "சாதம்",
    price: 60,
    category: "Rice",
    rating: 4.8,
    tag: "Everyday favourite",
    description: "Fluffy, perfectly steamed rice — the comforting heart of a homestyle meal.",
    image:
      "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 2,
    name: "Chicken Kolambu",
    tamil: "கோழி குழம்பு",
    price: 140,
    category: "Chicken",
    rating: 4.9,
    tag: "Bestseller",
    description: "Tender chicken simmered in a bold, slow-roasted Tamil spice gravy.",
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 3,
    name: "Boti Kolambu",
    tamil: "போட்டி குழம்பு",
    price: 160,
    category: "Specials",
    rating: 4.7,
    tag: "House special",
    description: "A rustic, peppery delicacy cooked low and slow with our signature masala.",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 4,
    name: "Mutton Kolambu",
    tamil: "மட்டன் குழம்பு",
    price: 220,
    category: "Mutton",
    rating: 4.9,
    tag: "Weekend favourite",
    description: "Succulent mutton in a deep, aromatic village-style curry, finished with curry leaves.",
    image:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 5,
    name: "Masala Omelette",
    tamil: "மசாலா ஆம்லெட்",
    price: 25,
    category: "Sides",
    rating: 4.8,
    tag: "Quick add-on",
    description: "A fluffy two-egg omelette with onion, chilli, coriander and a touch of pepper.",
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=85",
  },
];

const seededOrders: Order[] = [
  {
    id: "URF-2051",
    customer: "Kavitha",
    mobile: "98765 43210",
    address: "West Mambalam, Chennai",
    items: [
      { ...defaultFoods[0], quantity: 2 },
      { ...defaultFoods[1], quantity: 1 },
    ],
    total: 260,
    status: "Preparing",
    time: "Today, 12:38 PM",
    payment: "Cash on delivery",
  },
  {
    id: "URF-2048",
    customer: "Senthil",
    mobile: "98400 22118",
    address: "Ashok Nagar, Chennai",
    items: [{ ...defaultFoods[3], quantity: 2 }],
    total: 440,
    status: "Delivered",
    time: "Today, 11:12 AM",
    payment: "UPI",
  },
  {
    id: "URF-2046",
    customer: "Meena",
    mobile: "99406 55220",
    address: "Saidapet, Chennai",
    items: [
      { ...defaultFoods[2], quantity: 1 },
      { ...defaultFoods[4], quantity: 2 },
    ],
    total: 210,
    status: "Pending",
    time: "Today, 10:46 AM",
    payment: "Cash on delivery",
  },
];

const categories = ["All", "Rice", "Chicken", "Mutton", "Specials", "Sides"];
const statusSteps: OrderStatus[] = ["Pending", "Preparing", "Out for Delivery", "Delivered"];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function FoodApp() {
  const [view, setView] = useState<View>("home");
  const [foods, setFoods] = useState<Food[]>(defaultFoods);
  const [orders, setOrders] = useState<Order[]>(seededOrders);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");

  useEffect(() => {
    try {
      const savedFoods = localStorage.getItem("urf-foods");
      const savedOrders = localStorage.getItem("urf-orders");
      const savedFavs = localStorage.getItem("urf-favorites");
      const savedDark = localStorage.getItem("urf-dark");
      if (savedFoods) setFoods(JSON.parse(savedFoods));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      if (savedDark === "true") setDark(true);
    } catch {
      // Keep the seeded experience if browser storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("urf-foods", JSON.stringify(foods));
    localStorage.setItem("urf-orders", JSON.stringify(orders));
    localStorage.setItem("urf-favorites", JSON.stringify(favorites));
    localStorage.setItem("urf-dark", String(dark));
  }, [foods, orders, favorites, dark, ready]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredFoods = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return foods.filter((food) => {
      const inCategory = category === "All" || food.category === category;
      const matches =
        !normalized ||
        food.name.toLowerCase().includes(normalized) ||
        food.tamil.includes(normalized) ||
        food.category.toLowerCase().includes(normalized);
      return inCategory && matches;
    });
  }, [foods, category, query]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= 299 ? 0 : 29;
  const cartTotal = subtotal + deliveryFee;

  function goTo(next: View) {
    setView(next);
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart(food: Food, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.id === food.id);
      return existing
        ? current.map((item) =>
            item.id === food.id ? { ...item, quantity: item.quantity + quantity } : item,
          )
        : [...current, { ...food, quantity }];
    });
    setSelectedFood(null);
    setToast(`${food.name} added to your cart`);
  }

  function updateQuantity(id: number, change: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + change } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setToast(favorites.includes(id) ? "Removed from favourites" : "Saved to favourites");
  }

  function placeOrder(details: {
    name: string;
    mobile: string;
    address: string;
    payment: string;
  }) {
    const id = `URF-${Math.floor(2100 + Math.random() * 700)}`;
    const order: Order = {
      id,
      customer: details.name,
      mobile: details.mobile,
      address: details.address,
      items: cart,
      total: cartTotal,
      status: "Pending",
      time: "Just now",
      payment: details.payment,
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
    setLastOrderId(id);
    goTo("orders");
    setToast(`Order ${id} confirmed — we’ll keep you updated`);
  }

  const activeOrder = orders.find((order) => order.id === lastOrderId) ?? orders[0];

  return (
    <div className={dark ? "app dark" : "app"}>
      <Header
        view={view}
        cartCount={cartCount}
        query={query}
        dark={dark}
        onSearch={setQuery}
        onNavigate={goTo}
        onCart={() => setCartOpen(true)}
        onDark={() => setDark((value) => !value)}
      />

      <main>
        {view === "home" && (
          <HomeView
            foods={foods}
            favorites={favorites}
            onMenu={() => goTo("menu")}
            onOrders={() => goTo("orders")}
            onAdd={addToCart}
            onSelect={setSelectedFood}
            onFavorite={toggleFavorite}
          />
        )}
        {view === "menu" && (
          <MenuView
            foods={filteredFoods}
            category={category}
            query={query}
            favorites={favorites}
            onCategory={setCategory}
            onQuery={setQuery}
            onAdd={addToCart}
            onSelect={setSelectedFood}
            onFavorite={toggleFavorite}
          />
        )}
        {view === "orders" && (
          <OrdersView order={activeOrder} hasPlacedOrder={Boolean(lastOrderId)} onMenu={() => goTo("menu")} />
        )}
        {view === "admin" && (
          <AdminView
            authed={adminAuthed}
            tab={adminTab}
            foods={foods}
            orders={orders}
            onLogin={() => setAdminAuthed(true)}
            onLogout={() => {
              setAdminAuthed(false);
              setAdminTab("overview");
            }}
            onTab={setAdminTab}
            onFoods={setFoods}
            onOrders={setOrders}
            onToast={setToast}
          />
        )}
      </main>

      {view !== "admin" && <Footer onNavigate={goTo} />}
      {view !== "admin" && (
        <MobileNav view={view} cartCount={cartCount} onNavigate={goTo} onCart={() => setCartOpen(true)} />
      )}

      {selectedFood && (
        <FoodDialog food={selectedFood} onClose={() => setSelectedFood(null)} onAdd={addToCart} />
      )}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={cartTotal}
          onClose={() => setCartOpen(false)}
          onQuantity={updateQuantity}
          onMenu={() => goTo("menu")}
          onCheckout={() => setCheckoutOpen(true)}
        />
      )}
      {checkoutOpen && (
        <CheckoutDialog
          total={cartTotal}
          onClose={() => setCheckoutOpen(false)}
          onPlaceOrder={placeOrder}
        />
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span>✓</span> {toast}
        </div>
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand" aria-label="Usha Rani Foods">
      <span className="brand-mark">UR</span>
      <span>
        <b>Usha Rani</b>
        <small>FOODS • MADE WITH LOVE</small>
      </span>
    </div>
  );
}

function Header({
  view,
  cartCount,
  query,
  dark,
  onSearch,
  onNavigate,
  onCart,
  onDark,
}: {
  view: View;
  cartCount: number;
  query: string;
  dark: boolean;
  onSearch: (value: string) => void;
  onNavigate: (view: View) => void;
  onCart: () => void;
  onDark: () => void;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-button" onClick={() => onNavigate("home")} aria-label="Go to home">
          <Brand />
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          {(["home", "menu", "orders"] as View[]).map((item) => (
            <button key={item} className={view === item ? "active" : ""} onClick={() => onNavigate(item)}>
              {item === "orders" ? "Track order" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <label className="header-search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => {
                onSearch(event.target.value);
                if (event.target.value) onNavigate("menu");
              }}
              placeholder="Search dishes"
              aria-label="Search dishes"
            />
          </label>
          <button className="icon-button" onClick={onDark} aria-label="Toggle dark mode">
            {dark ? "☀" : "☾"}
          </button>
          <button className="organizer-button" onClick={() => onNavigate("admin")}>Organizer</button>
          <button className="cart-button" onClick={onCart} aria-label={`Open cart with ${cartCount} items`}>
            <span>Bag</span>
            {cartCount > 0 && <b>{cartCount}</b>}
          </button>
        </div>
      </div>
    </header>
  );
}

function HomeView({
  foods,
  favorites,
  onMenu,
  onOrders,
  onAdd,
  onSelect,
  onFavorite,
}: {
  foods: Food[];
  favorites: number[];
  onMenu: () => void;
  onOrders: () => void;
  onAdd: (food: Food) => void;
  onSelect: (food: Food) => void;
  onFavorite: (id: number) => void;
}) {
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-copy">
          <div className="eyebrow"><span>●</span> Fresh from our kitchen</div>
          <h1>A warm plate of <em>home,</em><br />delivered.</h1>
          <p>
            Honest Tamil flavours, hand-ground masalas and generous portions — cooked fresh after you order.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onMenu}>Explore today’s menu <span>→</span></button>
            <button className="text-button" onClick={onOrders}><span className="play-icon">›</span> Track your order</button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack"><span>K</span><span>S</span><span>M</span><span>R</span></div>
            <div><b>4.9 <span className="stars">★★★★★</span></b><small>Loved by 2,000+ foodies</small></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="sun-shape" />
          <div className="dotted-shape" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foods[1]?.image} alt="A bowl of Usha Rani Foods chicken kolambu" />
          <div className="hero-card hero-card-top"><span className="tiny-icon">♨</span><div><b>Cooked fresh</b><small>Only after you order</small></div></div>
          <div className="hero-card hero-card-bottom"><div className="delivery-dot">25</div><div><b>Fast delivery</b><small>At your door in 30–40 min</small></div></div>
          <div className="leaf leaf-one">✦</div><div className="leaf leaf-two">✦</div>
        </div>
      </section>

      <section className="offer-strip">
        <div className="section-shell offer-inner">
          <span className="offer-badge">WELCOME</span>
          <p><b>₹50 off your first order</b><span>Use code <strong>USHA50</strong> at checkout</span></p>
          <button onClick={onMenu}>Order now →</button>
        </div>
      </section>

      <section className="section-shell popular-section">
        <div className="section-heading">
          <div><span className="kicker">FRESH FROM THE STOVE</span><h2>Today’s favourites</h2></div>
          <button className="view-all" onClick={onMenu}>View full menu <span>→</span></button>
        </div>
        <div className="food-grid home-food-grid">
          {foods.slice(0, 4).map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              favorite={favorites.includes(food.id)}
              onAdd={onAdd}
              onSelect={onSelect}
              onFavorite={onFavorite}
            />
          ))}
        </div>
      </section>

      <section className="story-section" id="about">
        <div className="section-shell story-grid">
          <div className="story-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1100&q=85" alt="A cook preparing fresh food" />
            <div className="story-seal"><b>20+</b><span>YEARS OF<br />HOME COOKING</span></div>
          </div>
          <div className="story-copy">
            <span className="kicker">OUR KITCHEN, OUR STORY</span>
            <h2>Food that remembers<br />where it came from.</h2>
            <p>Usha Rani’s recipes began in a small family kitchen, where every masala was ground by hand and every guest left well fed.</p>
            <p>We still cook the same way today: fresh ingredients, patient simmering and no shortcuts.</p>
            <div className="story-points">
              <div><span>✦</span><b>Hand-ground masalas</b><small>Blended fresh in our kitchen</small></div>
              <div><span>♨</span><b>Cooked in small batches</b><small>For flavour you can taste</small></div>
              <div><span>♡</span><b>Made like family</b><small>Generous, warm and honest</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell reviews-section">
        <div className="section-heading centered"><div><span className="kicker">STRAIGHT FROM OUR CUSTOMERS</span><h2>A little love, served back</h2></div></div>
        <div className="review-grid">
          {[
            ["‘The chicken kolambu tastes exactly like Sunday lunch at home. Proper spice, tender chicken and so much heart.’", "Kavitha R.", "West Mambalam"],
            ["‘Everything arrived piping hot. The mutton gravy was rich, fresh and worth every rupee. My new weekend ritual!’", "Senthil K.", "Ashok Nagar"],
            ["‘Simple food made beautifully. Even the rice was perfect — fluffy, warm and packed with care.’", "Meena S.", "Saidapet"],
          ].map(([quote, name, place], index) => (
            <article className="review-card" key={name}>
              <div className="quote-mark">“</div><div className="stars">★★★★★</div><p>{quote}</p>
              <div className="reviewer"><span>{name[0]}</span><div><b>{name}</b><small>{place}</small></div><i>✓</i></div>
              {index === 1 && <div className="review-ribbon">Most helpful</div>}
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell final-cta">
        <div><span className="kicker">HUNGRY YET?</span><h2>Your comfort meal<br />is just a few taps away.</h2><p>Freshly cooked. Thoughtfully packed. Delivered warm.</p></div>
        <button className="light-button" onClick={onMenu}>Order your meal <span>→</span></button>
      </section>
    </>
  );
}

function MenuView({
  foods,
  category,
  query,
  favorites,
  onCategory,
  onQuery,
  onAdd,
  onSelect,
  onFavorite,
}: {
  foods: Food[];
  category: string;
  query: string;
  favorites: number[];
  onCategory: (category: string) => void;
  onQuery: (value: string) => void;
  onAdd: (food: Food) => void;
  onSelect: (food: Food) => void;
  onFavorite: (id: number) => void;
}) {
  return (
    <section className="menu-page section-shell">
      <div className="page-intro">
        <span className="kicker">COOKED FRESH, EVERY DAY</span>
        <h1>What are you craving?</h1>
        <p>Home-style favourites prepared after you order.</p>
      </div>
      <label className="menu-search"><span>⌕</span><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search rice, chicken, mutton…" /></label>
      <div className="category-row" role="tablist" aria-label="Food categories">
        {categories.map((item) => <button role="tab" aria-selected={category === item} className={category === item ? "active" : ""} onClick={() => onCategory(item)} key={item}>{item}</button>)}
      </div>
      <div className="menu-result-line"><b>{foods.length} dishes</b><span>All prices include taxes</span></div>
      {foods.length ? (
        <div className="food-grid menu-food-grid">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} favorite={favorites.includes(food.id)} onAdd={onAdd} onSelect={onSelect} onFavorite={onFavorite} />
          ))}
        </div>
      ) : (
        <div className="empty-state"><span>⌕</span><h3>No dishes found</h3><p>Try a different search or category.</p><button onClick={() => { onQuery(""); onCategory("All"); }}>Show all dishes</button></div>
      )}
    </section>
  );
}

function FoodCard({ food, favorite, onAdd, onSelect, onFavorite }: { food: Food; favorite: boolean; onAdd: (food: Food) => void; onSelect: (food: Food) => void; onFavorite: (id: number) => void }) {
  return (
    <article className="food-card">
      <div className="food-image-wrap" onClick={() => onSelect(food)} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onSelect(food)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={food.image} alt={food.name} />
        {food.tag && <span className="food-tag">{food.tag}</span>}
        <button className={favorite ? "heart-button active" : "heart-button"} onClick={(event) => { event.stopPropagation(); onFavorite(food.id); }} aria-label={`Save ${food.name} to favourites`}>{favorite ? "♥" : "♡"}</button>
      </div>
      <div className="food-card-body">
        <div className="food-title-row"><div><h3>{food.name}</h3><span>{food.tamil}</span></div><div className="rating"><b>★</b> {food.rating}</div></div>
        <p>{food.description}</p>
        <div className="food-bottom"><b>{money(food.price)}</b><button onClick={() => onAdd(food)}>ADD <span>+</span></button></div>
      </div>
    </article>
  );
}

function OrdersView({ order, hasPlacedOrder, onMenu }: { order?: Order; hasPlacedOrder: boolean; onMenu: () => void }) {
  if (!order) {
    return <section className="orders-page section-shell empty-order"><span>◎</span><h1>No orders yet</h1><p>Your fresh meal is waiting.</p><button className="primary-button" onClick={onMenu}>Browse the menu</button></section>;
  }
  const currentIndex = statusSteps.indexOf(order.status);
  return (
    <section className="orders-page section-shell">
      <div className="page-intro"><span className="kicker">LIVE ORDER UPDATES</span><h1>{hasPlacedOrder ? "Your meal is on its way" : "Track your order"}</h1><p>We’ll update this page whenever your order moves.</p></div>
      <div className="order-layout">
        <div className="tracking-card">
          <div className="tracking-head"><div><small>ORDER</small><h2>#{order.id}</h2></div><span className={`status-pill ${order.status.toLowerCase().replaceAll(" ", "-")}`}>{order.status}</span></div>
          <div className="eta-box"><span>◷</span><div><small>ESTIMATED ARRIVAL</small><b>{order.status === "Delivered" ? "Delivered today" : "30–40 minutes"}</b></div></div>
          <div className="order-timeline">
            {statusSteps.map((step, index) => (
              <div className={index <= currentIndex ? "timeline-step done" : "timeline-step"} key={step}>
                <span>{index < currentIndex || order.status === "Delivered" ? "✓" : index + 1}</span>
                <div><b>{step}</b><small>{index === currentIndex ? "Your order is here now" : index < currentIndex ? "Completed" : "We’ll notify you"}</small></div>
              </div>
            ))}
          </div>
          <div className="notification-note"><span>●</span><p><b>Notifications are on</b><small>You’ll see an update when the kitchen changes your order status.</small></p></div>
        </div>
        <aside className="order-summary-card">
          <h3>Order summary</h3>
          <div className="summary-items">{order.items.map((item) => <div key={item.id}><span>{item.quantity}× {item.name}</span><b>{money(item.price * item.quantity)}</b></div>)}</div>
          <div className="summary-total"><span>Total paid</span><b>{money(order.total)}</b></div>
          <div className="delivery-address"><small>DELIVERING TO</small><b>{order.customer}</b><p>{order.address}</p><span>{order.mobile}</span></div>
          <button className="outline-button" onClick={onMenu}>Order something else</button>
        </aside>
      </div>
    </section>
  );
}

function FoodDialog({ food, onClose, onAdd }: { food: Food; onClose: () => void; onAdd: (food: Food, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="food-dialog" role="dialog" aria-modal="true" aria-label={food.name} onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={food.image} alt={food.name} />
        <div className="food-dialog-copy"><span className="food-tag">{food.tag}</span><h2>{food.name}</h2><span className="tamil-name">{food.tamil}</span><div className="dialog-rating"><span>★ {food.rating}</span><i>•</i><span>Freshly cooked</span></div><p>{food.description}</p><div className="ingredient-note"><span>♨</span><div><b>Made fresh after you order</b><small>Allow 20–25 minutes for preparation</small></div></div><div className="dialog-add"><div className="quantity-control"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><b>{quantity}</b><button onClick={() => setQuantity((value) => value + 1)}>+</button></div><button className="primary-button" onClick={() => onAdd(food, quantity)}>Add • {money(food.price * quantity)}</button></div></div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, subtotal, deliveryFee, total, onClose, onQuantity, onMenu, onCheckout }: { cart: CartItem[]; subtotal: number; deliveryFee: number; total: number; onClose: () => void; onQuantity: (id: number, change: number) => void; onMenu: () => void; onCheckout: () => void }) {
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your cart" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head"><div><span className="kicker">YOUR ORDER</span><h2>Your bag</h2></div><button onClick={onClose} aria-label="Close cart">×</button></div>
        {!cart.length ? (
          <div className="empty-cart"><span>Bag</span><h3>Your bag is hungry</h3><p>Add something comforting from today’s menu.</p><button className="primary-button" onClick={onMenu}>Explore menu</button></div>
        ) : (
          <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.image} alt="" /><div><b>{item.name}</b><small>{money(item.price)} each</small><div className="quantity-control small"><button onClick={() => onQuantity(item.id, -1)}>−</button><b>{item.quantity}</b><button onClick={() => onQuantity(item.id, 1)}>+</button></div></div><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="coupon-box"><span>◇</span><div><b>Have a coupon?</b><small>USHA50 applies to your first order</small></div><button>Apply</button></div><div className="bill-details"><h3>Bill details</h3><div><span>Item total</span><b>{money(subtotal)}</b></div><div><span>Delivery fee</span><b>{deliveryFee ? money(deliveryFee) : <em>FREE</em>}</b></div><div className="grand-total"><span>To pay</span><b>{money(total)}</b></div></div><button className="checkout-button" onClick={onCheckout}><span><small>TO PAY</small><b>{money(total)}</b></span><strong>Checkout →</strong></button></>
        )}
      </aside>
    </div>
  );
}

function CheckoutDialog({ total, onClose, onPlaceOrder }: { total: number; onClose: () => void; onPlaceOrder: (details: { name: string; mobile: string; address: string; payment: string }) => void }) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const details = { name: String(data.get("name") ?? "").trim(), mobile: String(data.get("mobile") ?? "").trim(), address: String(data.get("address") ?? "").trim(), payment: String(data.get("payment") ?? "Cash on delivery") };
    if (!details.name || details.mobile.length < 10 || !details.address) { setError("Please enter your name, a valid mobile number and delivery address."); return; }
    onPlaceOrder(details);
  }
  return (
    <div className="modal-backdrop checkout-backdrop" onMouseDown={onClose}>
      <form className="checkout-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head"><div><span className="kicker">ALMOST THERE</span><h2>Delivery details</h2></div><button type="button" onClick={onClose}>×</button></div>
        <div className="form-grid"><label>Full name<input name="name" placeholder="e.g. Kavitha R" autoFocus /></label><label>Mobile number<input name="mobile" inputMode="tel" placeholder="10-digit number" /></label><label className="full-field">Delivery address<textarea name="address" rows={3} placeholder="Door no., street, area and landmark" /></label></div>
        <fieldset><legend>Payment method</legend><label className="payment-option"><input type="radio" name="payment" value="Cash on delivery" defaultChecked /><span>₹</span><div><b>Cash on delivery</b><small>Pay when your order arrives</small></div></label><label className="payment-option"><input type="radio" name="payment" value="UPI" /><span>U</span><div><b>UPI on delivery</b><small>Scan and pay securely at the door</small></div></label></fieldset>
        {error && <p className="form-error">{error}</p>}
        <button className="checkout-button place-order" type="submit"><span><small>TOTAL</small><b>{money(total)}</b></span><strong>Place order →</strong></button><p className="secure-note">✓ Your order details stay on this device in this demo.</p>
      </form>
    </div>
  );
}

function AdminView({ authed, tab, foods, orders, onLogin, onLogout, onTab, onFoods, onOrders, onToast }: { authed: boolean; tab: AdminTab; foods: Food[]; orders: Order[]; onLogin: () => void; onLogout: () => void; onTab: (tab: AdminTab) => void; onFoods: (foods: Food[]) => void; onOrders: (orders: Order[]) => void; onToast: (message: string) => void }) {
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [editing, setEditing] = useState<Food | null>(null);
  const [foodFormOpen, setFoodFormOpen] = useState(false);
  const revenue = orders.filter((order) => order.status === "Delivered").reduce((total, order) => total + order.total, 0);

  if (!authed) {
    return (
      <section className="admin-login-page">
        <div className="admin-login-brand"><Brand /></div>
        <form className="admin-login-card" onSubmit={(event) => { event.preventDefault(); if (pin === "2707") { onLogin(); setLoginError(""); } else setLoginError("That PIN doesn’t match. Try the demo PIN shown below."); }}>
          <span className="admin-lock">●</span><span className="kicker">ORGANIZER ACCESS</span><h1>Welcome back.</h1><p>Sign in to manage today’s kitchen, orders and menu.</p>
          <label>4-digit PIN<input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="••••" autoFocus /></label>
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="primary-button" type="submit">Open dashboard →</button>
          <div className="demo-pin"><span>DEMO ACCESS</span><b>PIN 2707</b></div>
        </form>
      </section>
    );
  }

  function saveFood(details: Omit<Food, "id" | "rating">) {
    if (editing) {
      onFoods(foods.map((food) => food.id === editing.id ? { ...food, ...details } : food));
      onToast(`${details.name} updated`);
    } else {
      onFoods([...foods, { ...details, id: Date.now(), rating: 4.8 }]);
      onToast(`${details.name} added to the menu`);
    }
    setEditing(null); setFoodFormOpen(false);
  }

  function updateStatus(id: string, status: OrderStatus) {
    onOrders(orders.map((order) => order.id === id ? { ...order, status } : order));
    const order = orders.find((item) => item.id === id);
    onToast(`${order?.customer ?? "Customer"} notified: order is ${status.toLowerCase()}`);
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <div className="admin-role"><span>UR</span><div><b>Usha Rani</b><small>Kitchen organizer</small></div></div>
        <nav>{(["overview", "menu", "orders", "customers"] as AdminTab[]).map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => onTab(item)}><span>{item === "overview" ? "▦" : item === "menu" ? "◇" : item === "orders" ? "▤" : "◎"}</span>{item[0].toUpperCase() + item.slice(1)}{item === "orders" && <b>{orders.filter((order) => order.status !== "Delivered").length}</b>}</button>)}</nav>
        <button className="admin-logout" onClick={onLogout}>↗ Sign out</button>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar"><div><small>MONDAY, 3 AUGUST</small><h1>{tab === "overview" ? "Good afternoon, Usha!" : tab[0].toUpperCase() + tab.slice(1)}</h1></div><div><span className="kitchen-status">● Kitchen open</span><button className="admin-notification">♢<b>{orders.filter((order) => order.status === "Pending").length}</b></button></div></div>

        {tab === "overview" && <AdminOverview orders={orders} revenue={revenue} onTab={onTab} />}
        {tab === "menu" && <AdminMenu foods={foods} onAdd={() => { setEditing(null); setFoodFormOpen(true); }} onEdit={(food) => { setEditing(food); setFoodFormOpen(true); }} onDelete={(id) => { if (window.confirm("Remove this dish from the menu?")) { onFoods(foods.filter((food) => food.id !== id)); onToast("Dish removed from the menu"); } }} />}
        {tab === "orders" && <AdminOrders orders={orders} onStatus={updateStatus} />}
        {tab === "customers" && <AdminCustomers orders={orders} />}
      </div>
      {foodFormOpen && <FoodForm food={editing} onClose={() => { setEditing(null); setFoodFormOpen(false); }} onSave={saveFood} />}
    </div>
  );
}

function AdminOverview({ orders, revenue, onTab }: { orders: Order[]; revenue: number; onTab: (tab: AdminTab) => void }) {
  const cards = [
    ["Today’s orders", orders.length, "+12%", "▤"],
    ["Pending", orders.filter((order) => order.status === "Pending").length, "Needs action", "◷"],
    ["Delivered", orders.filter((order) => order.status === "Delivered").length, "Today", "✓"],
    ["Revenue", money(revenue), "+8.4%", "₹"],
  ];
  return (
    <>
      <div className="admin-metric-grid">{cards.map(([label, value, note, icon]) => <article key={String(label)}><div><small>{label}</small><strong>{value}</strong><span>{note}</span></div><i>{icon}</i></article>)}</div>
      <div className="admin-overview-grid">
        <section className="dashboard-panel"><div className="panel-head"><div><h2>Revenue overview</h2><p>Your sales over the last 7 days</p></div><select aria-label="Revenue period"><option>Last 7 days</option></select></div><div className="chart-wrap"><div className="chart-y"><span>₹600</span><span>₹400</span><span>₹200</span><span>₹0</span></div><div className="bar-chart">{[42, 62, 38, 76, 58, 91, 70].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} className={index === 5 ? "peak" : ""}><b>{index === 5 ? "₹540" : ""}</b></span><small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small></div>)}</div></div></section>
        <section className="dashboard-panel popular-panel"><div className="panel-head"><div><h2>Popular dishes</h2><p>Top sellers today</p></div></div>{defaultFoods.slice(1, 4).map((food, index) => <div className="popular-admin-row" key={food.id}><span>{index + 1}</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={food.image} alt="" /><div><b>{food.name}</b><small>{10 - index * 2} orders</small></div><strong>{money(food.price * (10 - index * 2))}</strong></div>)}</section>
      </div>
      <section className="dashboard-panel recent-orders"><div className="panel-head"><div><h2>Recent orders</h2><p>Live activity from your kitchen</p></div><button onClick={() => onTab("orders")}>View all →</button></div><AdminOrderTable orders={orders.slice(0, 4)} compact /></section>
    </>
  );
}

function AdminMenu({ foods, onAdd, onEdit, onDelete }: { foods: Food[]; onAdd: () => void; onEdit: (food: Food) => void; onDelete: (id: number) => void }) {
  return <section className="dashboard-panel admin-menu-panel"><div className="panel-head"><div><h2>Your menu</h2><p>{foods.length} dishes available today</p></div><button className="primary-button" onClick={onAdd}>+ Add food item</button></div><div className="admin-food-grid">{foods.map((food) => <article key={food.id}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={food.image} alt={food.name} /><div><span>{food.category}</span><h3>{food.name}</h3><p>{food.description}</p><strong>{money(food.price)}</strong><div><button onClick={() => onEdit(food)}>Edit</button><button className="danger" onClick={() => onDelete(food.id)}>Delete</button></div></div></article>)}</div></section>;
}

function AdminOrders({ orders, onStatus }: { orders: Order[]; onStatus: (id: string, status: OrderStatus) => void }) {
  return <section className="dashboard-panel orders-management"><div className="panel-head"><div><h2>Order management</h2><p>Update a status to notify the customer</p></div><span className="kitchen-status">● Live updates</span></div><AdminOrderTable orders={orders} onStatus={onStatus} /></section>;
}

function AdminOrderTable({ orders, compact = false, onStatus }: { orders: Order[]; compact?: boolean; onStatus?: (id: string, status: OrderStatus) => void }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th>{!compact && <th>Update</th>}</tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><b>#{order.id}</b><small>{order.time}</small></td><td><b>{order.customer}</b><small>{order.mobile}</small></td><td>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</td><td><b>{money(order.total)}</b></td><td><span className={`status-pill ${order.status.toLowerCase().replaceAll(" ", "-")}`}>{order.status}</span></td>{!compact && <td><select value={order.status} onChange={(event) => onStatus?.(order.id, event.target.value as OrderStatus)}>{statusSteps.map((status) => <option key={status}>{status}</option>)}</select></td>}</tr>)}</tbody></table></div>;
}

function AdminCustomers({ orders }: { orders: Order[] }) {
  const customers = Array.from(new Map(orders.map((order) => [order.mobile, order])).values());
  return <section className="dashboard-panel customers-panel"><div className="panel-head"><div><h2>Customers</h2><p>{customers.length} customers have ordered</p></div></div><div className="customer-list">{customers.map((customer) => <div key={customer.mobile}><span>{customer.customer[0]}</span><div><b>{customer.customer}</b><small>{customer.mobile} • {customer.address}</small></div><strong>{orders.filter((order) => order.mobile === customer.mobile).length} order(s)</strong><button onClick={() => window.open(`https://wa.me/91${customer.mobile.replace(/\D/g, "")}`, "_blank")}>Message</button></div>)}</div></section>;
}

function FoodForm({ food, onClose, onSave }: { food: Food | null; onClose: () => void; onSave: (food: Omit<Food, "id" | "rating">) => void }) {
  const [image, setImage] = useState(food?.image ?? defaultFoods[0].image);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ name: String(data.get("name")), tamil: String(data.get("tamil")), price: Number(data.get("price")), category: String(data.get("category")), description: String(data.get("description")), image, tag: String(data.get("tag")) }); }
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="food-form-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="kicker">MENU EDITOR</span><h2>{food ? "Edit food item" : "Add food item"}</h2></div><button type="button" onClick={onClose}>×</button></div><label className="image-upload">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image} alt="Food preview" /><span>Choose food photo<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setImage(String(reader.result)); reader.readAsDataURL(file); }} /></span></label><div className="form-grid"><label>Dish name<input name="name" defaultValue={food?.name} required /></label><label>Tamil name<input name="tamil" defaultValue={food?.tamil} /></label><label>Price (₹)<input name="price" type="number" min="1" defaultValue={food?.price} required /></label><label>Category<select name="category" defaultValue={food?.category}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="full-field">Short description<textarea name="description" rows={3} defaultValue={food?.description} required /></label><label className="full-field">Badge text<input name="tag" defaultValue={food?.tag} placeholder="e.g. Bestseller" /></label></div><button className="primary-button full-button" type="submit">{food ? "Save changes" : "Add to menu"} →</button></form></div>;
}

function MobileNav({ view, cartCount, onNavigate, onCart }: { view: View; cartCount: number; onNavigate: (view: View) => void; onCart: () => void }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === "home" ? "active" : ""} onClick={() => onNavigate("home")}><span>⌂</span>Home</button><button className={view === "menu" ? "active" : ""} onClick={() => onNavigate("menu")}><span>◇</span>Menu</button><button onClick={onCart} className="mobile-cart"><i>Bag</i>{cartCount > 0 && <b>{cartCount}</b>}<small>Cart</small></button><button className={view === "orders" ? "active" : ""} onClick={() => onNavigate("orders")}><span>◎</span>Orders</button><button className={view === "admin" ? "active" : ""} onClick={() => onNavigate("admin")}><span>♙</span>Admin</button></nav>;
}

function Footer({ onNavigate }: { onNavigate: (view: View) => void }) {
  return <footer className="site-footer" id="contact"><div className="section-shell footer-grid"><div><Brand /><p>Home-style Tamil food, cooked fresh<br />and delivered warm across Chennai.</p><div className="social-row"><a href="https://instagram.com" aria-label="Instagram">ig</a><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://wa.me/919876543210" aria-label="WhatsApp">wa</a></div></div><div><h3>Explore</h3><button onClick={() => onNavigate("menu")}>Today’s menu</button><button onClick={() => onNavigate("orders")}>Track order</button><a href="#about">Our story</a></div><div><h3>We’re open</h3><p>Monday – Sunday<br /><b>11:00 AM – 10:00 PM</b></p><span className="kitchen-status">● Taking orders now</span></div><div><h3>Talk to us</h3><a href="tel:+919876543210">+91 98765 43210</a><a href="mailto:hello@usharanifoods.in">hello@usharanifoods.in</a><p>West Mambalam, Chennai</p></div></div><div className="section-shell footer-bottom"><span>© 2026 Usha Rani Foods. Made with warmth in Chennai.</span><span>Privacy • Terms</span></div></footer>;
}
