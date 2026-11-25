
import React, { useEffect, useState } from "react";
import "./App.css";

const CANCEL_TIME = 24 * 60 * 60 * 1000;

const readData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => readData("artverse-user", null));
  const [accounts, setAccounts] = useState(() =>
    readData("artverse-accounts", [])
  );
  const [artworks, setArtworks] = useState(() =>
    readData("artverse-artworks", [])
  );
  const [wishlist, setWishlist] = useState(() =>
    readData("artverse-wishlist", [])
  );
  const [orders, setOrders] = useState(() =>
    readData("artverse-orders", [])
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "user",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [uploadData, setUploadData] = useState({
    title: "",
    category: "Painting",
    price: "",
    description: "",
    image: null,
  });

  useEffect(() => {
    localStorage.setItem("artverse-user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("artverse-accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("artverse-artworks", JSON.stringify(artworks));
  }, [artworks]);

  useEffect(() => {
    localStorage.setItem("artverse-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("artverse-orders", JSON.stringify(orders));
  }, [orders]);

  const go = (nextPage) => {
    setMessage("");
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isArtist = user?.role === "artist";

  const notify = (text) => {
    setMessage(text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SIGN UP
  const handleSignup = (e) => {
    e.preventDefault();

    const email = signupData.email.trim().toLowerCase();

    if (accounts.some((account) => account.email.toLowerCase() === email)) {
      notify("An account with this email already exists.");
      return;
    }

    const newAccount = {
      ...signupData,
      email,
      role: signupData.role,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setUser({
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
    });

    setSignupData({
      name: "",
      email: "",
      password: "",
      role: "user",
    });

    go(newAccount.role === "artist" ? "dashboard" : "home");
    notify("Account created successfully!");
  };

  // LOGIN
  const handleLogin = (e) => {
    e.preventDefault();

    const email = loginData.email.trim().toLowerCase();

    const account = accounts.find(
      (item) =>
        item.email.toLowerCase() === email &&
        item.password === loginData.password &&
        (item.role || "user") === loginData.role
    );

    if (!account) {
      notify("Invalid email, password or account type.");
      return;
    }

    setUser({
      name: account.name,
      email: account.email,
      role: account.role || "user",
    });

    setLoginData({
      email: "",
      password: "",
      role: "user",
    });

    go(account.role === "artist" ? "dashboard" : "home");
    notify("Welcome to ArtVerse!");
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    go("home");
    notify("You have logged out.");
  };

  // IMAGE UPLOAD
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify("Image must be smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setUploadData((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };

    reader.onerror = () => {
      notify("Could not read this image. Please try another.");
    };

    reader.readAsDataURL(file);
  };

  // UPLOAD ARTWORK
  const handleUpload = (e) => {
    e.preventDefault();

    if (!isArtist) {
      notify("Only artists can upload artwork.");
      return;
    }

    if (!uploadData.image) {
      notify("Please select an artwork image.");
      return;
    }

    const artwork = {
      id: Date.now(),
      title: uploadData.title,
      category: uploadData.category,
      price: Number(uploadData.price),
      description: uploadData.description,
      image: uploadData.image,
      artist: user.name,
      artistEmail: user.email,
      createdAt: Date.now(),
    };

    setArtworks((prev) => [artwork, ...prev]);

    setUploadData({
      title: "",
      category: "Painting",
      price: "",
      description: "",
      image: null,
    });

    go("gallery");
    notify("Your artwork has been uploaded!");
  };

  // DELETE ARTWORK
  const deleteArtwork = (id) => {
    if (!isArtist) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this artwork?"
    );

    if (!confirmed) return;

    setArtworks((prev) => prev.filter((art) => art.id !== id));
    setWishlist((prev) => prev.filter((item) => item !== id));

    // Existing orders are preserved.
    notify("Artwork deleted successfully.");
  };

  // WISHLIST
  const toggleWishlist = (id) => {
    if (!user) {
      notify("Please login to use your wishlist.");
      go("login");
      return;
    }

    setWishlist((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // PLACE ORDER
  const placeOrder = (artwork) => {
    if (!user) {
      notify("Please login to place an order.");
      go("login");
      return;
    }

    if (isArtist) {
      notify("Artist accounts cannot place customer orders.");
      return;
    }

    const alreadyOrdered = orders.some(
      (order) =>
        order.artworkId === artwork.id &&
        order.userEmail === user.email &&
        order.status !== "Cancelled"
    );

    if (alreadyOrdered) {
      notify("You already have an active order for this artwork.");
      return;
    }

    const newOrder = {
      id: Date.now(),
      artworkId: artwork.id,
      artworkTitle: artwork.title,
      image: artwork.image,
      price: artwork.price,
      artist: artwork.artist,
      artistEmail: artwork.artistEmail,
      userName: user.name,
      userEmail: user.email,
      createdAt: Date.now(),
      status: "Pending",
    };

    setOrders((prev) => [newOrder, ...prev]);
    go("orders");
    notify("Your order has been placed successfully!");
  };

  // CHECK CANCELLATION ELIGIBILITY
  const canCancelOrder = (order) => {
    if (!order || typeof order.createdAt !== "number") return false;

    const elapsed = Date.now() - order.createdAt;

    return (
      elapsed >= 0 &&
      elapsed <= CANCEL_TIME &&
      ["Pending", "Confirmed"].includes(order.status)
    );
  };

  // CANCEL ORDER
  const cancelOrder = (id) => {
    if (!user || isArtist) return;

    const order = orders.find(
      (item) => item.id === id && item.userEmail === user.email
    );

    if (!order) {
      notify("Order not found.");
      return;
    }

    if (!canCancelOrder(order)) {
      notify("This order can no longer be cancelled.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    setOrders((prev) =>
      prev.map((item) =>
        item.id === id && canCancelOrder(item)
          ? {
              ...item,
              status: "Cancelled",
              cancelledAt: Date.now(),
            }
          : item
      )
    );

    notify("Your order has been cancelled.");
  };

  // ARTIST UPDATES ORDER
  const updateOrderStatus = (id, status) => {
    if (!isArtist) return;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? { ...order, status }
          : order
      )
    );

    notify("Order status updated.");
  };

  const filteredArtworks = artworks.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.artist.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || art.category === category;

    return matchesSearch && matchesCategory;
  });

  const wishlistArtworks = artworks.filter((art) =>
    wishlist.includes(art.id)
  );

  const myOrders = orders.filter(
    (order) => order.userEmail === user?.email
  );

  const categories = ["All", "Painting", "Digital Art", "Sketch", "Abstract"];

  // ARTWORK CARD
  const ArtworkCard = ({ artwork }) => (
    <div className="art-card" key={artwork.id}>
      <div className="art-image-wrap">
        <img
          src={artwork.image}
          alt={artwork.title}
          className="art-image"
        />

        {!isArtist && (
          <button
            className="heart-btn"
            onClick={() => toggleWishlist(artwork.id)}
            aria-label="Toggle wishlist"
          >
            {wishlist.includes(artwork.id) ? "♥" : "♡"}
          </button>
        )}
      </div>

      <div className="art-card-content">
        <span className="eyebrow">{artwork.category}</span>
        <h3>{artwork.title}</h3>
        <p className="muted">By {artwork.artist}</p>
        <p className="art-description">{artwork.description}</p>

        <div className="art-card-bottom">
          <strong>₹{Number(artwork.price).toLocaleString("en-IN")}</strong>

          {isArtist ? (
            <button
              className="small-delete-btn"
              onClick={() => deleteArtwork(artwork.id)}
            >
              Delete
            </button>
          ) : (
            <button
              className="small-dark-btn"
              onClick={() => placeOrder(artwork)}
            >
              Order Now
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ORDER CARD
  const OrderCard = ({ order, artistMode = false }) => (
    <div className="order-card" key={order.id}>
      <div className="order-art">
        {order.image && (
          <img src={order.image} alt={order.artworkTitle} />
        )}
      </div>

      <div className="order-info">
        <h3>{order.artworkTitle}</h3>

        <p className="muted">
          Order ID: {order.id}
        </p>

        <p>
          Price: <strong>₹{Number(order.price).toLocaleString("en-IN")}</strong>
        </p>

        {artistMode ? (
          <>
            <p>Customer: {order.userName}</p>
            <p className="muted">{order.userEmail}</p>
          </>
        ) : (
          <p>Artist: {order.artist}</p>
        )}

        <span
          className={`status status-${order.status.toLowerCase()}`}
        >
          {order.status}
        </span>

        <p className="muted small-note">
          Placed:{" "}
          {typeof order.createdAt === "number"
            ? new Date(order.createdAt).toLocaleString()
            : "Date unavailable"}
        </p>

        {artistMode ? (
          <select
            className="status-select"
            value={order.status}
            onChange={(e) =>
              updateOrderStatus(order.id, e.target.value)
            }
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        ) : order.userEmail === user?.email &&
          canCancelOrder(order) ? (
          <button
            className="cancel-btn"
            onClick={() => cancelOrder(order.id)}
          >
            Cancel Order
          </button>
        ) : (
          <p className="muted small-note">
            {order.status === "Cancelled"
              ? "This order has been cancelled."
              : ["Shipped", "Delivered"].includes(order.status)
              ? "Cancellation is unavailable after shipping."
              : "The 24-hour cancellation period has ended."}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-shell">

      {/* HEADER */}
      <header className="site-header">
        <button className="brand" onClick={() => go("home")}>
          <span className="brand-mark">✳</span>
          art<span className="brand-dot">verse.</span>
        </button>

        <nav className="main-nav">
          <button
            className={page === "home" ? "nav-active" : ""}
            onClick={() => go("home")}
          >
            Home
          </button>

          <button
            className={page === "gallery" ? "nav-active" : ""}
            onClick={() => {
              setCategory("All");
              go("gallery");
            }}
          >
            Gallery
          </button>

          <button onClick={() => go("about")}>About</button>

          {user && !isArtist && (
            <>
              <button onClick={() => go("wishlist")}>Wishlist</button>
              <button onClick={() => go("orders")}>My Orders</button>
            </>
          )}

          {isArtist && (
            <>
              <button onClick={() => go("upload")}>Upload Art</button>
              <button onClick={() => go("dashboard")}>Dashboard</button>
            </>
          )}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <span className="welcome-user">
                Hi, {user.name}
              </span>
              <button className="login-link" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="login-link" onClick={() => go("login")}>
                Login
              </button>
              <button className="dark-btn" onClick={() => go("signup")}>
                Join Us
              </button>
            </>
          )}
        </div>
      </header>

      {/* MESSAGE */}
      {message && (
        <div className="notice">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      {/* HOME */}
      {page === "home" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow">
                ✦ A WORLD OF CREATIVITY
              </span>

              <h1>
                Art that speaks.
                <br />
                <span>Stories that stay.</span>
              </h1>

              <p>
                Discover original artworks, explore creative minds
                and find pieces that make your space feel like you.
              </p>

              <div className="hero-actions">
                <button
                  className="dark-btn hero-btn"
                  onClick={() => go("gallery")}
                >
                  Explore Gallery ↗
                </button>

                <button
                  className="text-btn"
                  onClick={() => go("about")}
                >
                  Our Story →
                </button>
              </div>

              <div className="hero-stats">
                <div>
                  <strong>{artworks.length}</strong>
                  <span>Artworks</span>
                </div>

                <div>
                  <strong>
                    {new Set(artworks.map((art) => art.artistEmail)).size}
                  </strong>
                  <span>Artists</span>
                </div>

                <div>
                  <strong>{orders.length}</strong>
                  <span>Orders</span>
                </div>
              </div>
            </div>

            <div className="hero-art">
              <div className="hero-arch">
                <span className="arch-star">✳</span>
              </div>

              <div className="arch-caption">
                ART
                <br />
                IS
                <br />
                LIFE.
              </div>

              <div className="floating-note">
                <span className="note-star">✳</span>
                <div>
                  <strong>Art is for everyone.</strong>
                  <span>Find your inspiration.</span>
                </div>
              </div>
            </div>
          </section>

          {/* EXPLORE COLLECTIONS */}
          <section className="collections-section">
            <div className="collections-heading">
              <span className="eyebrow">FIND YOUR STYLE</span>
              <h2>
                Explore collections<span>.</span>
              </h2>
            </div>

            <div className="collections-grid">
              {[
                { number: "01", name: "Painting", color: "painting" },
                { number: "02", name: "Digital Art", color: "digital" },
                { number: "03", name: "Sketch", color: "sketch" },
                { number: "04", name: "Abstract", color: "abstract" },
              ].map((item) => (
                <button
                  key={item.name}
                  className={`collection-card ${item.color}`}
                  onClick={() => {
                    setCategory(item.name);
                    go("gallery");
                  }}
                >
                  <span className="collection-number">
                    {item.number}
                  </span>

                  <div>
                    <h3>{item.name}</h3>
                    <p>Explore collection ↗</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* RECENT ARTWORKS */}
          <section className="section-block">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE CREATIVE SPACE</span>
                <h2>Fresh from the Gallery</h2>
                <p>Discover the latest creations from our artists.</p>
              </div>

              <button
                className="text-btn"
                onClick={() => go("gallery")}
              >
                View all artworks →
              </button>
            </div>

            {artworks.length === 0 ? (
              <div className="empty-state">
                <span>✳</span>
                <h3>No artworks uploaded yet.</h3>
                <p>Be the first artist to share your creativity!</p>
                <button
                  className="dark-btn"
                  onClick={() => go("signup")}
                >
                  Join as an Artist
                </button>
              </div>
            ) : (
              <div className="art-grid">
                {artworks.slice(0, 3).map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="artist-banner">
            <div>
              <span className="eyebrow">YOUR ART. YOUR STORY.</span>
              <h2>Have something beautiful to share?</h2>
              <p>Become an artist and showcase your creations.</p>
            </div>

            <button
              className="light-btn"
              onClick={() => go("signup")}
            >
              Become an Artist ↗
            </button>
          </section>
        </>
      )}

      {/* GALLERY */}
      {page === "gallery" && (
        <main className="page-section">
          <div className="page-heading">
            <span className="eyebrow">A COLLECTION OF CREATIVITY</span>
            <h1>
              Explore <span>Artworks.</span>
            </h1>
            <p>Find something that speaks to you.</p>
          </div>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search artworks or artists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {filteredArtworks.length === 0 ? (
            <div className="empty-state">
              <span>✳</span>
              <h3>No artworks found.</h3>
              <p>Try another category or search term.</p>
              <button
                className="outline-btn"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="art-grid">
              {filteredArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* SIGNUP */}
      {page === "signup" && (
        <main className="form-page">
          <div className="form-card">
            <span className="eyebrow">JOIN OUR COMMUNITY</span>
            <h1>Create an <span>Account.</span></h1>
            <p>Start your creative journey with ArtVerse.</p>

            <form onSubmit={handleSignup}>
              <label>Full Name</label>
              <input
                required
                type="text"
                placeholder="Enter your name"
                value={signupData.name}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    name: e.target.value,
                  })
                }
              />

              <label>Email Address</label>
              <input
                required
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    email: e.target.value,
                  })
                }
              />

              <label>Password</label>
              <input
                required
                minLength="6"
                type="password"
                placeholder="Create a password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    password: e.target.value,
                  })
                }
              />

              <label>Account Type</label>
              <select
                value={signupData.role}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    role: e.target.value,
                  })
                }
              >
                <option value="user">User / Customer</option>
                <option value="artist">Artist / Admin</option>
              </select>

              <button className="dark-btn form-submit" type="submit">
                Create Account
              </button>
            </form>

            <p className="form-bottom">
              Already have an account?{" "}
              <button onClick={() => go("login")}>Login</button>
            </p>
          </div>
        </main>
      )}

      {/* LOGIN */}
      {page === "login" && (
        <main className="form-page">
          <div className="form-card">
            <span className="eyebrow">WELCOME BACK</span>
            <h1>Login to <span>ArtVerse.</span></h1>
            <p>Continue exploring the world of creativity.</p>

            <form onSubmit={handleLogin}>
              <label>Email Address</label>
              <input
                required
                type="email"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    email: e.target.value,
                  })
                }
              />

              <label>Password</label>
              <input
                required
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password: e.target.value,
                  })
                }
              />

              <label>Login As</label>
              <select
                value={loginData.role}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    role: e.target.value,
                  })
                }
              >
                <option value="user">User / Customer</option>
                <option value="artist">Artist / Admin</option>
              </select>

              <button className="dark-btn form-submit" type="submit">
                Login
              </button>
            </form>

            <p className="form-bottom">
              Don't have an account?{" "}
              <button onClick={() => go("signup")}>Sign Up</button>
            </p>
          </div>
        </main>
      )}

      {/* UPLOAD ARTWORK */}
      {page === "upload" && (
        <main className="form-page">
          <div className="form-card wide-form">
            <span className="eyebrow">SHARE YOUR CREATIVITY</span>
            <h1>Upload <span>Artwork.</span></h1>
            <p>Showcase your original creation to the world.</p>

            {!isArtist ? (
              <div className="empty-state">
                <p>Only artist accounts can upload artwork.</p>
                <button
                  className="dark-btn"
                  onClick={() => go("login")}
                >
                  Login as Artist
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpload}>
                <label>Artwork Title</label>
                <input
                  required
                  type="text"
                  placeholder="Enter artwork title"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      title: e.target.value,
                    })
                  }
                />

                <label>Category</label>
                <select
                  value={uploadData.category}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      category: e.target.value,
                    })
                  }
                >
                  {categories.filter((item) => item !== "All").map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <label>Price (₹)</label>
                <input
                  required
                  min="1"
                  type="number"
                  placeholder="Enter price"
                  value={uploadData.price}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      price: e.target.value,
                    })
                  }
                />

                <label>Description</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Describe your artwork..."
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      description: e.target.value,
                    })
                  }
                />

                <label>Artwork Image (Maximum 2 MB)</label>
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                {uploadData.image && (
                  <img
                    src={uploadData.image}
                    alt="Artwork preview"
                    style={{
                      width: "100%",
                      maxHeight: "220px",
                      objectFit: "contain",
                      marginTop: "12px",
                    }}
                  />
                )}

                <button className="dark-btn form-submit" type="submit">
                  Upload Artwork
                </button>
              </form>
            )}
          </div>
        </main>
      )}

      {/* WISHLIST */}
      {page === "wishlist" && (
        <main className="page-section">
          <div className="page-heading">
            <span className="eyebrow">YOUR FAVOURITES</span>
            <h1>My <span>Wishlist.</span></h1>
            <p>Artworks you have saved.</p>
          </div>

          {wishlistArtworks.length === 0 ? (
            <div className="empty-state">
              <span>♡</span>
              <h3>Your wishlist is empty.</h3>
              <p>Explore the gallery and save your favourite artworks.</p>
              <button
                className="dark-btn"
                onClick={() => go("gallery")}
              >
                Explore Gallery
              </button>
            </div>
          ) : (
            <div className="art-grid">
              {wishlistArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* USER ORDERS */}
      {page === "orders" && (
        <main className="page-section">
          <div className="page-heading">
            <span className="eyebrow">YOUR PURCHASES</span>
            <h1>My <span>Orders.</span></h1>
            <p>Track your artwork orders and their status.</p>
            <p className="muted">
              Orders can be cancelled within 24 hours if they have not shipped.
            </p>
          </div>

          {!user ? (
            <div className="empty-state">
              <h3>Please login to view your orders.</h3>
              <button
                className="dark-btn"
                onClick={() => go("login")}
              >
                Login
              </button>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="empty-state">
              <span>✳</span>
              <h3>No orders yet.</h3>
              <p>Your artwork purchases will appear here.</p>
              <button
                className="dark-btn"
                onClick={() => go("gallery")}
              >
                Browse Gallery
              </button>
            </div>
          ) : (
            <div className="order-list">
              {myOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </main>
      )}

      {/* ARTIST DASHBOARD */}
      {page === "dashboard" && (
        <main className="page-section">
          {!isArtist ? (
            <div className="empty-state">
              <h3>Artist access required.</h3>
              <button
                className="dark-btn"
                onClick={() => go("login")}
              >
                Login as Artist
              </button>
            </div>
          ) : (
            <>
              <div className="page-heading">
                <span className="eyebrow">ARTIST CONTROL CENTRE</span>
                <h1>Artist <span>Dashboard.</span></h1>
                <p>Manage your ArtVerse community and orders.</p>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card">
                  <span>ARTWORKS</span>
                  <strong>{artworks.length}</strong>
                </div>

                <div className="stat-card">
                  <span>ORDERS</span>
                  <strong>{orders.length}</strong>
                </div>

                <div className="stat-card">
                  <span>PENDING</span>
                  <strong>
                    {orders.filter((o) => o.status === "Pending").length}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>REGISTERED USERS</span>
                  <strong>{accounts.length}</strong>
                </div>
              </div>

              <div className="dashboard-heading">
                <h2>Manage Artworks</h2>
                <button
                  className="dark-btn"
                  onClick={() => go("upload")}
                >
                  + Upload Artwork
                </button>
              </div>

              {artworks.length === 0 ? (
                <div className="empty-state">
                  <h3>No artworks available.</h3>
                  <p>Upload your first artwork.</p>
                </div>
              ) : (
                <div className="art-grid">
                  {artworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                    />
                  ))}
                </div>
              )}

              <div className="dashboard-heading">
                <h2>All Orders</h2>
              </div>

              {orders.length === 0 ? (
                <div className="empty-state">
                  <p>No orders have been placed yet.</p>
                </div>
              ) : (
                <div className="order-list">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      artistMode={true}
                    />
                  ))}
                </div>
              )}

              <div className="dashboard-heading">
                <h2>Registered Users</h2>
              </div>

              {accounts.length === 0 ? (
                <div className="empty-state">
                  <p>No registered accounts yet.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Account Type</th>
                      </tr>
                    </thead>

                    <tbody>
                      {accounts.map((account, index) => (
                        <tr key={account.email || index}>
                          <td>{account.name}</td>
                          <td>{account.email}</td>
                          <td>
                            {(account.role || "user") === "artist"
                              ? "Artist / Admin"
                              : "User"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* ABOUT */}
      {page === "about" && (
        <main className="page-section about-section">
          <span className="eyebrow">OUR STORY</span>
          <h1>
            Every artwork has a story.
            <br />
            <span>Every artist has a voice.</span>
          </h1>

          <p>
            ArtVerse is a creative space where artists can share their
            original artwork and people can discover pieces that inspire
            them. Our goal is to connect creativity, artists and art lovers
            in one place.
          </p>

          <button
            className="dark-btn"
            onClick={() => go("gallery")}
          >
            Explore Artworks
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-brand">
          <h2>
            art<span>verse.</span>
          </h2>
          <span className="eyebrow">THE CREATIVE SPACE</span>
          <p>A place where creativity finds its voice.</p>
        </div>

        <div className="footer-links">
          <button onClick={() => go("home")}>Home</button>
          <button onClick={() => go("gallery")}>Gallery</button>
          <button onClick={() => go("about")}>About</button>
          {!user && (
            <button onClick={() => go("signup")}>Join Us</button>
          )}
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} ArtVerse. Made with creativity.
        </p>
      </footer>
    </div>
  );
}

export default App;
