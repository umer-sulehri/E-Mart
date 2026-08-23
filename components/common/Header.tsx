'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useUiStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useCategories } from '@/hooks/useCategories';
import { useHydrated } from '@/hooks/useHydrated';
import { SearchBar } from '@/components/search/SearchBar';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/blog', label: 'Blog' },
  { href: '/wishlist', label: 'Wishlist' },
];

function SearchIconSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="currentColor" d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 7-7a7 7 0 0 1-7 7Z" />
    </svg>
  );
}

export function Header() {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useHydrated();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartTotal = useCartStore((s) => s.total());
  const itemCount = useCartStore((s) => s.itemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const cartOpen = useUiStore((s) => s.cartOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const { user } = useAuthStore();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData ?? [];

  const accountHref =
    hydrated && user
      ? user.role === 'admin'
        ? '/admin/dashboard'
        : '/user/dashboard'
      : '/login';

  return (
    <>
      {/* offcanvas: cart */}
      <div className={`offcanvas offcanvas-end${cartOpen ? ' show' : ''}`} style={{ visibility: cartOpen ? 'visible' : 'hidden' }} tabIndex={-1} id="offcanvasCart" aria-labelledby="My Cart">
        <div className="offcanvas-header justify-content-center">
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setCartOpen(false)} />
        </div>
        <div className="offcanvas-body">
          <div className="order-md-last">
            <h4 className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-primary">Your cart</span>
              <span className="badge bg-primary rounded-pill">{hydrated ? itemCount : 0}</span>
            </h4>
            {items.length === 0 ? (
              <p className="text-body-secondary">Your cart is empty.</p>
            ) : (
              <ul className="list-group mb-3">
                {items.map((item) => (
                  <li key={item.productId} className="list-group-item d-flex justify-content-between lh-sm">
                    <div>
                      <h6 className="my-0">{item.product.name}</h6>
                      <small className="text-body-secondary">Qty {item.quantity}</small>
                    </div>
                    <span className="text-body-secondary">
                      Rs {(item.product.price * item.quantity).toLocaleString()}
                      <button
                        type="button"
                        className="btn-close btn-sm ms-2"
                        style={{ fontSize: '0.6em' }}
                        aria-label={`Remove ${item.product.name}`}
                        onClick={() => removeItem(item.productId)}
                      />
                    </span>
                  </li>
                ))}
                <li className="list-group-item d-flex justify-content-between">
                  <span>Total (PKR)</span>
                  <strong>Rs {cartTotal.toLocaleString()}</strong>
                </li>
              </ul>
            )}
            <Link href="/checkout" className="w-100 btn btn-primary btn-lg" onClick={() => setCartOpen(false)}>
              Continue to checkout
            </Link>
          </div>
        </div>
      </div>

      {/* offcanvas: search */}
      <div className={`offcanvas offcanvas-end${searchOpen ? ' show' : ''}`} style={{ visibility: searchOpen ? 'visible' : 'hidden' }} tabIndex={-1} id="offcanvasSearch" aria-labelledby="Search">
        <div className="offcanvas-header justify-content-center">
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setSearchOpen(false)} />
        </div>
        <div className="offcanvas-body">
          <div className="order-md-last">
            <h4 className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-primary">Search</span>
            </h4>
            <form
              role="search"
              className="d-flex mt-3 gap-0"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get('q');
                if (q) {
                  router.push(`/products?search=${encodeURIComponent(String(q))}`);
                  setSearchOpen(false);
                }
              }}
            >
              <input name="q" className="form-control rounded-start rounded-0 bg-light" type="search" placeholder="What are you looking for?" aria-label="What are you looking for?" />
              <button className="btn btn-dark rounded-end rounded-0" type="submit">Search</button>
            </form>
          </div>
        </div>
      </div>

      {/* offcanvas backdrop */}
      {(cartOpen || searchOpen || navOpen) && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => {
            setCartOpen(false);
            setSearchOpen(false);
            setNavOpen(false);
          }}
        />
      )}

      <header>
        <div className="container-fluid">
          <div className="row py-3 border-bottom">
            <div className="col-sm-4 col-lg-3 text-center text-sm-start d-flex align-items-center justify-content-center justify-content-sm-start">
              <div className="main-logo">
                <Link href="/" aria-label="E-Mart Home" className="text-decoration-none">
                  <span style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.9rem', color: '#222' }}>
                    E<span style={{ color: '#FFC43F' }}>-</span>Mart
                  </span>
                </Link>
              </div>
            </div>

            <div className="col-sm-6 offset-sm-2 offset-md-0 col-lg-5 d-none d-lg-block">
              <div className="search-bar row bg-light p-2 my-2 rounded-4">
                <div className="col-md-4 d-none d-md-block">
                  <select
                    className="form-select border-0 bg-transparent"
                    aria-label="Search category"
                    defaultValue=""
                    onChange={(e) => e.target.value && router.push(`/products?category=${e.target.value}`)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-11 col-md-7">
                  <SearchBar variant="bare" />
                </div>
                <div className="col-1 d-flex align-items-center justify-content-end text-secondary">
                  <SearchIconSvg />
                </div>
              </div>
            </div>

            <div className="col-sm-8 col-lg-4 d-flex justify-content-end gap-5 align-items-center mt-4 mt-sm-0 justify-content-center justify-content-sm-end">
              <div className="support-box text-end d-none d-xl-block">
                <span className="fs-6 text-muted">For Support?</span>
                <h5 className="mb-0">+980-34984089</h5>
              </div>

              <ul className="d-flex justify-content-end list-unstyled m-0">
                <li>
                  <Link href={accountHref} className="rounded-circle bg-light p-2 mx-1 d-inline-flex" aria-label="Account">
                    <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.71 12.71a6 6 0 1 0-7.42 0a10 10 0 0 0-6.22 8.18a1 1 0 0 0 2 .22a8 8 0 0 1 15.9 0a1 1 0 0 0 1 .89h.11a1 1 0 0 0 .88-1.1a10 10 0 0 0-6.25-8.19ZM12 12a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg>
                  </Link>
                </li>
                <li className="position-relative">
                  <Link href="/wishlist" className="rounded-circle bg-light p-2 mx-1 d-inline-flex position-relative" aria-label="Wishlist">
                    <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20.16 4.61A6.27 6.27 0 0 0 12 4a6.27 6.27 0 0 0-8.16 9.48l7.45 7.45a1 1 0 0 0 1.42 0l7.45-7.45a6.27 6.27 0 0 0 0-8.87Zm-1.41 7.46L12 18.81l-6.75-6.74a4.28 4.28 0 0 1 3-7.3a4.25 4.25 0 0 1 3 1.25a1 1 0 0 0 1.42 0a4.27 4.27 0 0 1 6 6.05Z" /></svg>
                    {hydrated && wishlistCount > 0 && (
                      <span className="position-absolute translate-middle badge rounded-pill bg-danger" style={{ top: 2, left: '85%', fontSize: '0.62rem' }}>
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li className="d-lg-none">
                  <button type="button" className="rounded-circle bg-light p-2 mx-1 border-0 d-inline-flex" aria-label="Cart" onClick={() => setCartOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8.5 19a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8.5 19ZM19 16H7a1 1 0 0 1 0-2h8.491a3.013 3.013 0 0 0 2.885-2.176l1.585-5.55A1 1 0 0 0 19 5H6.74a3.007 3.007 0 0 0-2.82-2H3a1 1 0 0 0 0 2h.921a1.005 1.005 0 0 1 .962.725l.155.545v.005l1.641 5.742A3 3 0 0 0 7 18h12a1 1 0 0 0 0-2Zm-1.326-9l-1.22 4.274a1.005 1.005 0 0 1-.963.726H8.754l-.255-.892L7.326 7ZM16.5 19a1.5 1.5 0 1 0 1.5 1.5a1.5 1.5 0 0 0-1.5-1.5Z" /></svg>
                  </button>
                </li>
                <li className="d-lg-none">
                  <button type="button" className="rounded-circle bg-light p-2 mx-1 border-0 d-inline-flex" aria-label="Search" onClick={() => setSearchOpen(true)}>
                    <SearchIconSvg />
                  </button>
                </li>
              </ul>

              <div className="cart text-end d-none d-lg-block dropdown">
                <button
                  className="border-0 bg-transparent d-flex flex-column gap-2 lh-1"
                  type="button"
                  onClick={() => setCartOpen(true)}
                >
                  <span className="fs-6 text-muted dropdown-toggle">Your Cart</span>
                  <span className="cart-total fs-5 fw-bold">
                    Rs {(hydrated ? cartTotal : 0).toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / tablet nav offcanvas */}
        {navOpen && (
          <div className="offcanvas offcanvas-end show" style={{ visibility: 'visible' }} tabIndex={-1} id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
            <div className="offcanvas-header justify-content-center">
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setNavOpen(false)} />
            </div>
            <div className="offcanvas-body">
              <select
                className="filter-categories border-0 mb-0 me-5"
                aria-label="Shop by departments"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(`/categories/${e.target.value}`);
                    setNavOpen(false);
                  }
                }}
              >
                <option value="">Shop by Departments</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>

              <ul className="navbar-nav justify-content-end menu-list list-unstyled d-flex gap-md-3 mb-0">
                {navLinks.map((link) => (
                  <li key={link.href} className="nav-item active">
                    <Link href={link.href} className="nav-link" onClick={() => setNavOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="nav-item">
                  <Link href={accountHref} className="nav-link" onClick={() => setNavOpen(false)}>
                    {hydrated && user ? 'My Account' : 'Login'}
                  </Link>
                </li>
                <li className="nav-item d-flex align-items-center px-3">
                  <LanguageSwitcher />
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="container-fluid">
          <div className="row py-3">
            <div className="d-flex justify-content-center justify-content-sm-between align-items-center">
              <nav className="main-menu d-flex navbar navbar-expand-lg">
                <button
                  className="navbar-toggler d-lg-none"
                  type="button"
                  data-bs-toggle="offcanvas"
                  aria-controls="offcanvasNavbar"
                  onClick={() => setNavOpen(true)}
                >
                  <span className="navbar-toggler-icon" />
                </button>

                <select
                  className="filter-categories border-0 mb-0 me-5 d-none d-xl-block"
                  aria-label="Shop by departments"
                  defaultValue=""
                  onChange={(e) => e.target.value && router.push(`/categories/${e.target.value}`)}
                >
                  <option value="">Shop by Departments</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>

                <ul className="navbar-nav justify-content-end menu-list list-unstyled d-none d-lg-flex gap-md-3 mb-0">
                  {navLinks.map((link, i) => (
                    <li key={link.href} className={`nav-item${i === 0 ? ' active' : ''}`}>
                      <Link href={link.href} className="nav-link">{link.label}</Link>
                    </li>
                  ))}
                  {hydrated && user ? (
                    <li className="nav-item">
                      <Link href="/user/orders" className="nav-link">Orders</Link>
                    </li>
                  ) : (
                    <li className="nav-item">
                      <Link href="/login" className="nav-link">Login</Link>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
