import "dotenv/config";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "JWT_SECRET",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variable(s): ${missingEnv.join(", ")}`);
}

const app = express();
const port = Number(process.env.PORT ?? 10000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("This origin is not allowed to call the Usha Rani Foods API."));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

const defaultMenu = [
  {
    name: "Steamed Rice",
    tamil_name: "சாதம்",
    price: 60,
    category: "Rice",
    rating: 4.8,
    badge: "Everyday favourite",
    description: "Fluffy, perfectly steamed rice — the comforting heart of a homestyle meal.",
    image_url: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1000&q=85",
    sort_order: 1,
  },
  {
    name: "Chicken Kolambu",
    tamil_name: "கோழி குழம்பு",
    price: 140,
    category: "Chicken",
    rating: 4.9,
    badge: "Bestseller",
    description: "Tender chicken simmered in a bold, slow-roasted Tamil spice gravy.",
    image_url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1000&q=85",
    sort_order: 2,
  },
  {
    name: "Boti Kolambu",
    tamil_name: "போட்டி குழம்பு",
    price: 160,
    category: "Specials",
    rating: 4.7,
    badge: "House special",
    description: "A rustic, peppery delicacy cooked low and slow with our signature masala.",
    image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1000&q=85",
    sort_order: 3,
  },
  {
    name: "Mutton Kolambu",
    tamil_name: "மட்டன் குழம்பு",
    price: 220,
    category: "Mutton",
    rating: 4.9,
    badge: "Weekend favourite",
    description: "Succulent mutton in a deep, aromatic village-style curry, finished with curry leaves.",
    image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1000&q=85",
    sort_order: 4,
  },
  {
    name: "Masala Omelette",
    tamil_name: "மசாலா ஆம்லெட்",
    price: 25,
    category: "Sides",
    rating: 4.8,
    badge: "Quick add-on",
    description: "A fluffy two-egg omelette with onion, chilli, coriander and a touch of pepper.",
    image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=85",
    sort_order: 5,
  },
];

function toOrderResponse(order) {
  return {
    ...order,
    order_items: order.order_items ?? [],
  };
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    mobile: user.mobile ?? "",
    address: user.default_address ?? "",
  };
}

function bearerToken(request) {
  return request.header("authorization")?.replace(/^Bearer\s+/i, "");
}

function issueCustomerToken(user) {
  return jwt.sign(
    { sub: user.id, role: "customer" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function verifyAdmin(request, response, next) {
  const token = bearerToken(request);
  if (!token) return response.status(401).json({ error: "Admin sign-in is required." });

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (claims.role !== "organizer") throw new Error("Organizer role required");
    request.admin = claims;
    next();
  } catch {
    return response.status(401).json({ error: "Your admin session has expired. Please sign in again." });
  }
}

function verifyCustomer(request, response, next) {
  const token = bearerToken(request);
  if (!token) return response.status(401).json({ error: "Please sign in to continue." });

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    if (claims.role !== "customer" || typeof claims.sub !== "string") throw new Error("Customer role required");
    request.customer = { id: claims.sub };
    next();
  } catch {
    return response.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function validStatus(status) {
  return ["Pending", "Preparing", "Out for Delivery", "Delivered"].includes(status);
}

function normalizedEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizedMobile(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

async function getCustomerById(id) {
  const { data, error } = await supabase
    .from("app_users")
    .select("id, full_name, email, mobile, default_address, role, is_active")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data.is_active || data.role !== "customer") return null;
  return data;
}

async function seedMenuWhenEmpty() {
  const { count, error } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count === 0) {
    const { error: seedError } = await supabase.from("menu_items").insert(defaultMenu);
    if (seedError) throw seedError;
  }
}

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get("/", (_request, response) => {
  response.json({ service: "Usha Rani Foods API", health: "/health" });
});

app.post("/api/auth/signup", async (request, response, next) => {
  try {
    const name = String(request.body?.name ?? "").trim();
    const email = normalizedEmail(request.body?.email);
    const mobile = normalizedMobile(request.body?.mobile);
    const password = String(request.body?.password ?? "");

    if (name.length < 2 || name.length > 80) {
      return response.status(400).json({ error: "Please enter your full name." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: "Please enter a valid email address." });
    }
    if (mobile && mobile.length !== 10) {
      return response.status(400).json({ error: "Please enter a 10-digit mobile number." });
    }
    if (password.length < 8 || password.length > 72) {
      return response.status(400).json({ error: "Password must be between 8 and 72 characters." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from("app_users")
      .insert({ full_name: name, email, mobile, password_hash: passwordHash, role: "customer" })
      .select("id, full_name, email, mobile, default_address, role, is_active")
      .single();
    if (error?.code === "23505") {
      return response.status(409).json({ error: "An account already exists for this email. Please sign in." });
    }
    if (error) throw error;

    return response.status(201).json({ user: toPublicUser(user), token: issueCustomerToken(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const email = normalizedEmail(request.body?.email);
    const password = String(request.body?.password ?? "");
    if (!email || !password) return response.status(400).json({ error: "Email and password are required." });

    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, full_name, email, mobile, default_address, password_hash, role, is_active")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    if (!user || !user.is_active || user.role !== "customer" || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({ error: "Incorrect email or password." });
    }

    return response.json({ user: toPublicUser(user), token: issueCustomerToken(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", verifyCustomer, async (request, response, next) => {
  try {
    const user = await getCustomerById(request.customer.id);
    if (!user) return response.status(401).json({ error: "This account is no longer available." });
    return response.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", async (request, response) => {
  const password = String(request.body?.password ?? "");
  if (password !== process.env.ADMIN_PASSWORD) {
    return response.status(401).json({ error: "Incorrect organizer password." });
  }

  const token = jwt.sign({ role: "organizer" }, process.env.JWT_SECRET, { expiresIn: "12h" });
  return response.json({ token });
});

app.get("/api/menu", async (_request, response, next) => {
  try {
    await seedMenuWhenEmpty();
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return response.json({ menu: data });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders", verifyAdmin, async (_request, response, next) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return response.json({ orders: data.map(toOrderResponse) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/me", verifyCustomer, async (request, response, next) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", request.customer.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return response.json({ orders: data.map(toOrderResponse) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", verifyCustomer, async (request, response, next) => {
  try {
    const name = String(request.body?.name ?? "").trim();
    const mobile = normalizedMobile(request.body?.mobile);
    const address = String(request.body?.address ?? "").trim();
    const paymentMethod = String(request.body?.payment ?? "Cash on delivery");
    const requestedItems = Array.isArray(request.body?.items) ? request.body.items : [];

    if (!name || mobile.length < 10 || !address || requestedItems.length === 0) {
      return response.status(400).json({ error: "Name, mobile, address, and at least one item are required." });
    }

    const quantities = new Map();
    for (const item of requestedItems) {
      const itemId = String(item?.id ?? "");
      const quantity = Number(item?.quantity ?? 0);
      if (!itemId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return response.status(400).json({ error: "Each order item needs a valid quantity." });
      }
      quantities.set(itemId, (quantities.get(itemId) ?? 0) + quantity);
    }

    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .in("id", [...quantities.keys()])
      .eq("is_available", true);
    if (menuError) throw menuError;
    if (menuItems.length !== quantities.size) {
      return response.status(400).json({ error: "One or more selected menu items are unavailable." });
    }

    const itemTotal = menuItems.reduce(
      (sum, item) => sum + Number(item.price) * quantities.get(item.id),
      0,
    );
    const deliveryFee = itemTotal >= 299 ? 0 : 29;
    const total = itemTotal + deliveryFee;
    const orderNumber = `URF-${Math.floor(2100 + Math.random() * 7900)}`;

    const { error: profileError } = await supabase
      .from("app_users")
      .update({ full_name: name, mobile, default_address: address, updated_at: new Date().toISOString() })
      .eq("id", request.customer.id);
    if (profileError) throw profileError;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: request.customer.id,
        customer_name: name,
        customer_mobile: mobile,
        delivery_address: address,
        payment_method: paymentMethod,
        item_total: itemTotal,
        delivery_fee: deliveryFee,
        total,
        status: "Pending",
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: lineItemError } = await supabase.from("order_items").insert(
      menuItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        unit_price: item.price,
        quantity: quantities.get(item.id),
      })),
    );
    if (lineItemError) throw lineItemError;

    const { data: savedOrder, error: savedOrderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order.id)
      .single();
    if (savedOrderError) throw savedOrderError;
    return response.status(201).json({ order: toOrderResponse(savedOrder) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/menu", verifyAdmin, async (request, response, next) => {
  try {
    const item = request.body;
    if (!item?.name || !item?.price || !item?.category || !item?.description || !item?.image_url) {
      return response.status(400).json({ error: "Name, price, category, description, and image are required." });
    }
    const { data, error } = await supabase
      .from("menu_items")
      .insert({ ...item, price: Number(item.price), sort_order: Number(item.sort_order ?? 99) })
      .select()
      .single();
    if (error) throw error;
    return response.status(201).json({ item: data });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/menu/:id", verifyAdmin, async (request, response, next) => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .update({ ...request.body, updated_at: new Date().toISOString() })
      .eq("id", request.params.id)
      .select()
      .single();
    if (error) throw error;
    return response.json({ item: data });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/menu/:id", verifyAdmin, async (request, response, next) => {
  try {
    const { error } = await supabase.from("menu_items").delete().eq("id", request.params.id);
    if (error) throw error;
    return response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id/status", verifyAdmin, async (request, response, next) => {
  try {
    const status = String(request.body?.status ?? "");
    if (!validStatus(status)) return response.status(400).json({ error: "Invalid order status." });
    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", request.params.id)
      .select("*, order_items(*)")
      .single();
    if (error) throw error;
    return response.json({ order: toOrderResponse(data) });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Usha Rani Foods API listening on port ${port}`);
});
