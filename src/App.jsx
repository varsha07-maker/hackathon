
import { useEffect, useState } from "react";
import "./App.css";

// Artwork card component (kept outside App to prevent input focus issues)
function ArtworkCard({
  art,
  currentUser,
  favorites,
  toggleFavorite,
  editArtwork,
  deleteArtwork
}) {
  const isOwner =
    currentUser?.role === "artist" &&
    currentUser?.email === art.artistEmail;

  return (
    <div className="art-card">
      <img src={art.image} alt={art.title} />

      <div className="art-info">
        <span className="category-tag">{art.category}</span>
        <h3>{art.title}</h3>
        <p>{art.description}</p>
        <h4>₹{art.price}</h4>
        <p>Artist: {art.artist}</p>

        <div className="card-actions">
          <button onClick={() => toggleFavorite(art.id)}>
            {favorites.includes(art.id) ? "♥ Saved" : "♡ Favourite"}
          </button>

          {isOwner && (
            <>
              <button onClick={() => editArtwork(art)}>Edit</button>
              <button onClick={() => deleteArtwork(art.id)}>Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");

  const [users, setUsers] = useState(
    () => JSON.parse(localStorage.getItem("users")) || []
  );

  const [currentUser, setCurrentUser] = useState(
    () => JSON.parse(localStorage.getItem("loggedInUser")) || null
  );

  const [artworks, setArtworks] = useState(
    () => JSON.parse(localStorage.getItem("artworks")) || []
  );

  const [favorites, setFavorites] = useState(
    () => JSON.parse(localStorage.getItem("favorites")) || []
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user"
  });

  const [artForm, setArtForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Painting",
    image: ""
  });

  // Save data in Local Storage
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("artworks", JSON.stringify(artworks));
  }, [artworks]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Form input handling
  function updateForm(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function updateArtForm(e) {
    setArtForm({
      ...artForm,
      [e.target.name]: e.target.value
    });
  }

  // SIGNUP WITH VALIDATION
  function signup(e) {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!name) {
      alert("Please enter your name!");
      return;
    }

    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address!");
      return;
    }

    if (!passwordPattern.test(form.password)) {
      alert(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (users.some(user => user.email.toLowerCase() === email)) {
      alert("This email is already registered!");
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password: form.password,
      role: form.role
    };

    setUsers(prev => [...prev, newUser]);

    alert("Account created successfully! Please login.");

    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user"
    });

    setPage("login");
  }

  // LOGIN
  function login(e) {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();

    const found = users.find(
      user =>
        user.email.toLowerCase() === email &&
        user.password === form.password
    );

    if (!found) {
      alert("Invalid email or password!");
      return;
    }

    setCurrentUser(found);
    localStorage.setItem("loggedInUser", JSON.stringify(found));

    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user"
    });

    setPage(found.role === "artist" ? "artist" : "user");
  }

  // LOGOUT
  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("loggedInUser");
    setPage("home");
  }

  // IMAGE UPLOAD
  function uploadImage(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file!");
      e.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      alert("Please select an image smaller than 1 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setArtForm(prev => ({
        ...prev,
        image: reader.result
      }));
    };

    reader.readAsDataURL(file);
  }

  // ADD OR UPDATE ARTWORK
  function saveArtwork(e) {
    e.preventDefault();

    if (!artForm.image) {
      alert("Please select an artwork image!");
      return;
    }

    if (editingId) {
      setArtworks(prev =>
        prev.map(art =>
          art.id === editingId &&
          art.artistEmail === currentUser.email
            ? { ...art, ...artForm }
            : art
        )
      );

      alert("Artwork updated successfully!");
    } else {
      const newArtwork = {
        ...artForm,
        id: Date.now(),
        artist: currentUser.name,
        artistEmail: currentUser.email
      };

      setArtworks(prev => [...prev, newArtwork]);

      alert("Artwork uploaded successfully!");
    }

    resetArtForm();
  }

  function resetArtForm() {
    setArtForm({
      title: "",
      description: "",
      price: "",
      category: "Painting",
      image: ""
    });

    setEditingId(null);
  }

  // EDIT ARTWORK
  function editArtwork(art) {
    if (art.artistEmail !== currentUser?.email) return;

    setArtForm({
      title: art.title,
      description: art.description,
      price: art.price,
      category: art.category,
      image: art.image
    });

    setEditingId(art.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // DELETE ARTWORK
  function deleteArtwork(id) {
    const art = artworks.find(item => item.id === id);

    if (!art || art.artistEmail !== currentUser?.email) return;

    if (window.confirm("Are you sure you want to delete this artwork?")) {
      setArtworks(prev => prev.filter(item => item.id !== id));
      setFavorites(prev => prev.filter(item => item !== id));
    }
  }

  // FAVOURITES
  function toggleFavorite(id) {
    if (!currentUser) {
      alert("Please login to save favourites!");
      setPage("login");
      return;
    }

    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }

  // SEARCH AND CATEGORY FILTER
  const visibleArtworks = artworks.filter(art => {
    const matchesSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.artist.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || art.category === category;

    return matchesSearch && matchesCategory;
  });

  const myArtworks = artworks.filter(
    art => art.artistEmail === currentUser?.email
  );

  const savedArtworks = artworks.filter(
    art => favorites.includes(art.id)
  );

  // COMMON ARTWORK CARD
  function renderArtwork(art) {
    return (
      <ArtworkCard
        key={art.id}
        art={art}
        currentUser={currentUser}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        editArtwork={editArtwork}
        deleteArtwork={deleteArtwork}
      />
    );
  }

  return (
    <div className="app">

      {/* NAVIGATION */}
      <nav className="navbar">
        <h2 onClick={() => setPage("home")}>🎨 ArtVerse</h2>

        <div className="nav-links">
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={() => setPage("gallery")}>Gallery</button>

          {currentUser ? (
            <>
              <button onClick={() =>
                setPage(currentUser.role === "artist" ? "artist" : "user")
              }>
                Dashboard
              </button>

              <span className="welcome-user">{currentUser.name}</span>

              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")}>Login</button>
              <button
                className="nav-signup"
                onClick={() => setPage("signup")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* HOME PAGE */}
      {page === "home" && (
        <>
          <section className="hero">
            <p className="eyebrow">A WORLD OF CREATIVITY</p>

            <h1>
              Where Art Meets
              <span> Imagination</span>
            </h1>

            <p className="hero-description">
              Discover beautiful artwork, explore talented artists
              and experience creativity in one place.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-btn"
                onClick={() => setPage("gallery")}
              >
                Explore Gallery
              </button>

              <button
                className="secondary-btn"
                onClick={() => setPage("signup")}
              >
                Join ArtVerse
              </button>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <p className="eyebrow">HANDPICKED FOR YOU</p>
              <h2>Featured Artworks</h2>
              <p>Discover creativity from our artist community.</p>
            </div>

            <div className="gallery-grid">
              {artworks.slice(0, 3).map(renderArtwork)}
            </div>

            <button
              className="primary-btn centered-btn"
              onClick={() => setPage("gallery")}
            >
              View All Artworks
            </button>
          </section>

          <section className="about-section">
            <p className="eyebrow">ABOUT US</p>
            <h2>Welcome to ArtVerse</h2>
            <p>
              ArtVerse is a digital platform where artists can
              showcase their creativity and art lovers can
              discover inspiring works.
            </p>
          </section>
        </>
      )}

      {/* SIGNUP PAGE */}
      {page === "signup" && (
        <section className="auth-section">
          <form className="auth-card" onSubmit={signup}>
            <p className="eyebrow">JOIN OUR COMMUNITY</p>
            <h1>Create Account</h1>

            <label>Full Name</label>
            <input
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={updateForm}
              required
            />

            <label>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={updateForm}
              required
            />

            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Create password"
              value={form.password}
              onChange={updateForm}
              minLength="8"
              required
            />

            <p className="password-hint">
              At least 8 characters, one uppercase, one lowercase
              and one number.
            </p>

            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={updateForm}
              required
            />

            <label>Choose Account Type</label>
            <select
              name="role"
              value={form.role}
              onChange={updateForm}
            >
              <option value="user">Art Lover / User</option>
              <option value="artist">Artist / Admin</option>
            </select>

            <button className="primary-btn full-btn">
              Create Account
            </button>

            <p>
              Already registered?
              <button
                type="button"
                className="text-btn"
                onClick={() => setPage("login")}
              >
                Login
              </button>
            </p>
          </form>
        </section>
      )}

      {/* LOGIN PAGE */}
      {page === "login" && (
        <section className="auth-section">
          <form className="auth-card" onSubmit={login}>
            <p className="eyebrow">WELCOME BACK</p>
            <h1>Login to ArtVerse</h1>

            <label>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="Enter email"
              value={form.email}
              onChange={updateForm}
              required
            />

            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={updateForm}
              required
            />

            <button className="primary-btn full-btn">
              Login
            </button>

            <p>
              Don't have an account?
              <button
                type="button"
                className="text-btn"
                onClick={() => setPage("signup")}
              >
                Sign Up
              </button>
            </p>
          </form>
        </section>
      )}

      {/* GALLERY PAGE */}
      {page === "gallery" && (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">DISCOVER CREATIVITY</p>
            <h1>Explore the Gallery</h1>
            <p>Find artwork that inspires you.</p>
          </div>

          <div className="gallery-controls">
            <input
              type="text"
              placeholder="Search artwork or artist..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Painting">Painting</option>
              <option value="Sketch">Sketch</option>
              <option value="Digital Art">Digital Art</option>
              <option value="Photography">Photography</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="gallery-grid">
            {visibleArtworks.length > 0
              ? visibleArtworks.map(renderArtwork)
              : <p className="empty-message">No artworks found.</p>
            }
          </div>
        </section>
      )}

      {/* USER DASHBOARD */}
      {page === "user" && currentUser?.role === "user" && (
        <section className="section dashboard">
          <p className="eyebrow">USER DASHBOARD</p>
          <h1>Welcome, {currentUser.name} 👋</h1>
          <p>Explore amazing artwork from talented artists.</p>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h2>🎨 Explore Gallery</h2>
              <p>Browse artwork from different artists.</p>
              <button
                className="primary-btn"
                onClick={() => setPage("gallery")}
              >
                View Gallery
              </button>
            </div>

            <div className="dashboard-card">
              <h2>❤️ Favourites</h2>
              <p>{savedArtworks.length} artworks saved.</p>
              <button
                className="primary-btn"
                onClick={() => setPage("favorites")}
              >
                View Favourites
              </button>
            </div>

            <div className="dashboard-card">
              <h2>🖼️ Art Collection</h2>
              <p>{artworks.length} artworks available.</p>
              <button
                className="primary-btn"
                onClick={() => setPage("gallery")}
              >
                Discover Art
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ARTIST / ADMIN DASHBOARD */}
      {page === "artist" && currentUser?.role === "artist" && (
        <section className="section dashboard">
          <p className="eyebrow">ARTIST / ADMIN DASHBOARD</p>
          <h1>Welcome, {currentUser.name} 🎨</h1>
          <p>Showcase and manage your creativity.</p>

          <div className="stats">
            <div className="stat-card">
              <h2>{myArtworks.length}</h2>
              <p>My Artworks</p>
            </div>

            <div className="stat-card">
              <h2>{artworks.length}</h2>
              <p>Total Gallery Artworks</p>
            </div>
          </div>

          <form className="upload-form" onSubmit={saveArtwork}>
            <h2>{editingId ? "Edit Artwork" : "Upload New Artwork"}</h2>

            <label>Artwork Title</label>
            <input
              name="title"
              placeholder="Enter artwork title"
              value={artForm.title}
              onChange={updateArtForm}
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe your artwork"
              value={artForm.description}
              onChange={updateArtForm}
              required
            />

            <label>Price in ₹</label>
            <input
              name="price"
              type="number"
              min="0"
              placeholder="Enter price"
              value={artForm.price}
              onChange={updateArtForm}
              required
            />

            <label>Category</label>
            <select
              name="category"
              value={artForm.category}
              onChange={updateArtForm}
            >
              <option>Painting</option>
              <option>Sketch</option>
              <option>Digital Art</option>
              <option>Photography</option>
              <option>Other</option>
            </select>

            <label>Upload Artwork Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={uploadImage}
            />

            {artForm.image && (
              <img
                className="image-preview"
                src={artForm.image}
                alt="Artwork preview"
              />
            )}

            <button className="primary-btn full-btn">
              {editingId ? "Update Artwork" : "Add Artwork"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetArtForm}
              >
                Cancel Edit
              </button>
            )}
          </form>

          <h2 className="manage-heading">My Artworks</h2>

          <div className="gallery-grid">
            {myArtworks.length > 0
              ? myArtworks.map(renderArtwork)
              : <p>No artworks uploaded yet.</p>
            }
          </div>
        </section>
      )}

      {/* FAVOURITES PAGE */}
      {page === "favorites" && (
        <section className="section">
          <div className="section-heading">
            <h1>My Favourite Artworks ❤️</h1>
          </div>

          <div className="gallery-grid">
            {savedArtworks.length > 0
              ? savedArtworks.map(renderArtwork)
              : <p>No favourites saved yet.</p>
            }
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer>
        <h2>🎨 ArtVerse</h2>
        <p>Where Creativity Lives.</p>
        <p>© 2026 ArtVerse. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default App;


