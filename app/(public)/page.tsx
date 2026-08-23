'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBanners } from '@/hooks/useBanners';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useCartStore } from '@/lib/store/cartStore';
import { ProductCard } from '@/components/site/ProductCard';
import type { Banner, Product } from '@/lib/types';

const fallbackHeroSlides = [
  {
    id: 'hero-1',
    slot: 'hero' as const,
    title: 'Fresh Smoothie & Summer Juice',
    subtitle: '100% natural',
    description: 'Freshly pressed juices and smoothies delivered to your door every morning.',
    imageUrl: '/images/product-thumb-1.png',
    ctaLabel: 'Shop Now',
    ctaHref: '/products',
    sortOrder: 0,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

function ArrowRightSvg() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.7 5.3a1 1 0 0 0-1.4 1.4l4.3 4.3H4a1 1 0 0 0 0 2h13.6l-4.3 4.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4Z" />
    </svg>
  );
}

function ArrowLeftSvg() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: 'rotate(180deg)' }}>
      <path fill="currentColor" d="M14.7 5.3a1 1 0 0 0-1.4 1.4l4.3 4.3H4a1 1 0 0 0 0 2h13.6l-4.3 4.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4Z" />
    </svg>
  );
}

const categoryIcons: Record<string, string> = {
  default: '/images/icon-vegetables-broccoli.png',
};

export default function HomePage() {
  const [trendingTab, setTrendingTab] = useState<string>('all');
  const addItem = useCartStore((s) => s.addItem);

  const { data: allProductsData } = useProducts({}, 1, 20);
  const { data: newestData } = useProducts({ sort: 'newest' }, 1, 12);
  const { data: categoriesData } = useCategories();
  const { data: bannersData } = useBanners();
  const { data: blogPostsData } = useBlogPosts();

  const allProducts: Product[] = allProductsData?.products ?? [];
  const newestProducts: Product[] = newestData?.products ?? [];
  const categories = categoriesData ?? [];
  const banners: Banner[] = (bannersData ?? []).length > 0 ? bannersData! : fallbackHeroSlides;
  const heroSlides = banners.filter((b) => b.slot === 'hero');
  const promoSmall = banners.find((b) => b.slot === 'promo-small');
  const promoWide = banners.find((b) => b.slot === 'promo-wide');
  const blogPosts = (blogPostsData ?? []).slice(0, 3);

  const trendingTabs = [
    { id: 'all', label: 'All', filter: () => true },
    ...categories.slice(0, 2).map((c) => ({
      id: c.slug,
      label: c.name,
      filter: (p: Product) => p.categoryId === c.id,
    })),
  ];
  const activeTab = trendingTabs.find((tab) => tab.id === trendingTab) ?? trendingTabs[0];
  const trendingProducts = allProducts.filter(activeTab.filter);

  const bestSelling = [...allProducts].sort((a, b) => Number(b.rating) - Number(a.rating));
  const mostPopular = allProducts;

  return (
    <>
      {/* ================= Hero banner blocks ================= */}
      <section className="py-3" style={{ backgroundImage: "url('/images/background-pattern.jpg')", backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="banner-blocks">
                <div className="banner-ad large bg-info block-1">
                  <Swiper
                    className="main-swiper"
                    modules={[Pagination]}
                    speed={500}
                    pagination={{ clickable: true }}
                  >
                    {(heroSlides.length > 0 ? heroSlides : fallbackHeroSlides).map((slide) => (
                      <SwiperSlide key={slide.id}>
                        <div className="row banner-content p-5">
                          <div className="content-wrapper col-md-7">
                            <div className="categories my-3">{slide.subtitle ?? '100% natural'}</div>
                            <h3 className="banner-title">{slide.title}</h3>
                            <p>{slide.description}</p>
                            <Link href={slide.ctaHref ?? '/products'} className="btn btn-outline-dark btn-lg text-uppercase fs-6 rounded-1 px-4 py-3 mt-3">
                              {slide.ctaLabel ?? 'Shop Collection'}
                            </Link>
                          </div>
                          <div className="img-wrapper col-md-5">
                            {slide.imageUrl && <img src={slide.imageUrl} className="img-fluid" alt={slide.title} />}
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                    <div className="swiper-pagination" />
                  </Swiper>
                </div>

                <div
                  className="banner-ad bg-success-subtle block-2"
                  style={{ background: "url('/images/ad-image-1.png') no-repeat", backgroundPosition: 'right bottom' }}
                >
                  <div className="row banner-content p-5">
                    <div className="content-wrapper col-md-7">
                      <div className="categories sale mb-3 pb-3">{promoSmall?.badgeText ?? '20% off'}</div>
                      <h3 className="banner-title">{promoSmall?.title ?? 'Fruits & Vegetables'}</h3>
                      <Link href={promoSmall?.ctaHref ?? '/categories'} className="d-flex align-items-center nav-link">
                        {promoSmall?.ctaLabel ?? 'Shop Collection'} <ArrowRightSvg />
                      </Link>
                    </div>
                  </div>
                </div>

                <div
                  className="banner-ad bg-danger block-3"
                  style={{ background: "url('/images/ad-image-2.png') no-repeat", backgroundPosition: 'right bottom' }}
                >
                  <div className="row banner-content p-5">
                    <div className="content-wrapper col-md-7">
                      <div className="categories sale mb-3 pb-3">{promoWide?.badgeText ?? '15% off'}</div>
                      <h3 className="item-title">{promoWide?.title ?? 'Baked Products'}</h3>
                      <Link href={promoWide?.ctaHref ?? '/products?search=bakery'} className="d-flex align-items-center nav-link">
                        {promoWide?.ctaLabel ?? 'Shop Collection'} <ArrowRightSvg />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Categories ================= */}
      <section className="py-5 overflow-hidden">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="section-header d-flex flex-wrap justify-content-between mb-5">
                <h2 className="section-title">Category</h2>
                <div className="d-flex align-items-center">
                  <Link href="/categories" className="btn-link text-decoration-none">View All Categories →</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 d-flex flex-wrap gap-4 justify-content-start justify-content-lg-between">
              {categories.map((category) => (
                <Link key={category.id} href={`/categories/${category.slug}`} className="nav-link category-item">
                  <img src={categoryIcons[category.slug] ?? categoryIcons.default} alt={category.name} />
                  <h3 className="category-title">{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Newly arrived brands ================= */}
      <section className="py-5 overflow-hidden">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="section-header d-flex flex-wrap flex-wrap justify-content-between mb-5">
                <h2 className="section-title">Newly Arrived</h2>
                <div className="d-flex align-items-center">
                  <Link href="/products?sort=newest" className="btn-link text-decoration-none">View All Products →</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
            {newestProducts.slice(0, 4).map((product) => (
              <div className="col" key={product.id}>
                <div className="card mb-3 p-3 rounded-4 shadow border-0 h-100">
                  <div className="row g-0 align-items-center">
                    <div className="col-md-4">
                      <img src={product.images[0] || '/images/product-thumb-11.jpg'} className="img-fluid rounded" alt={product.name} />
                    </div>
                    <div className="col-md-8">
                      <div className="card-body py-0">
                        <p className="text-muted mb-0">Rs {product.price.toLocaleString()}</p>
                        <h5 className="card-title">
                          <Link href={`/products/${product.slug}`} className="text-decoration-none text-dark">{product.name}</Link>
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Trending products tabs ================= */}
      <section className="py-5">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="bootstrap-tabs product-tabs">
                <div className="tabs-header d-flex justify-content-between border-bottom my-5">
                  <h3>Trending Products</h3>
                  <nav>
                    <div className="nav nav-tabs" id="nav-tab" role="tablist">
                      {trendingTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={trendingTab === tab.id}
                          className={`nav-link text-uppercase fs-6 border-0 bg-transparent${trendingTab === tab.id ? ' active' : ''}`}
                          onClick={() => setTrendingTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </nav>
                </div>
                <div className="tab-content" id="nav-tabContent">
                  <div className="tab-pane fade show active" role="tabpanel">
                    <div className="product-grid row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5">
                      {trendingProducts.slice(0, 10).map((product) => (
                        <div className="col" key={product.id}>
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Ad banners pair ================= */}
      <section className="py-5">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <div
                className="banner-ad bg-danger mb-3"
                style={{ background: "url('/images/ad-image-3.png')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom' }}
              >
                <div className="banner-content p-5">
                  <div className="categories text-primary fs-3 fw-bold">Upto 25% Off</div>
                  <h3 className="banner-title">Luxa Dark Chocolate</h3>
                  <p>Very tasty & creamy vanilla flavour creamy muffins.</p>
                  <Link href="/products?search=chocolate" className="btn btn-dark text-uppercase">Shop Now</Link>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div
                className="banner-ad bg-info"
                style={{ background: "url('/images/ad-image-4.png')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom' }}
              >
                <div className="banner-content p-5">
                  <div className="categories text-primary fs-3 fw-bold">Upto 25% Off</div>
                  <h3 className="banner-title">Creamy Muffins</h3>
                  <p>Very tasty & creamy vanilla flavour creamy muffins.</p>
                  <Link href="/products?search=muffins" className="btn btn-dark text-uppercase">Shop Now</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Best selling products ================= */}
      <section className="py-5 overflow-hidden">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="section-header d-flex flex-wrap justify-content-between my-5">
                <h2 className="section-title">Best selling products</h2>
                <div className="d-flex align-items-center">
                  <Link href="/products" className="btn-link text-decoration-none">View All Products →</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5">
            {bestSelling.slice(0, 10).map((product) => (
              <div className="col mb-4" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Newsletter ================= */}
      <section className="py-5">
        <div className="container-fluid">
          <div className="bg-secondary py-5 my-5 rounded-5" style={{ background: "url('/images/bg-leaves-img-pattern.png') no-repeat" }}>
            <div className="container my-5">
              <div className="row">
                <div className="col-md-6 p-5">
                  <div className="section-header">
                    <h2 className="section-title display-4">Get <span className="text-primary">25% Discount</span> on your first purchase</h2>
                  </div>
                  <p>Subscribe to the E-Mart newsletter for exclusive deals, fresh arrivals and seasonal offers delivered straight to your inbox.</p>
                </div>
                <div className="col-md-6 p-5">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="mb-3">
                      <label htmlFor="nl-name" className="form-label">Name</label>
                      <input type="text" className="form-control form-control-lg" name="name" id="nl-name" placeholder="Name" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="nl-email" className="form-label">Email</label>
                      <input type="email" className="form-control form-control-lg" name="email" id="nl-email" placeholder="abc@mail.com" />
                    </div>
                    <div className="form-check form-check-inline mb-3">
                      <label className="form-check-label" htmlFor="subscribe">
                        <input className="form-check-input" type="checkbox" id="subscribe" value="subscribe" />
                        Subscribe to the newsletter
                      </label>
                    </div>
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-dark btn-lg">Submit</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Most popular ================= */}
      <section className="py-5 overflow-hidden">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="section-header d-flex flex-wrap justify-content-between my-5">
                <h2 className="section-title">Most popular products</h2>
                <div className="d-flex align-items-center">
                  <Link href="/products" className="btn-link text-decoration-none">View All Products →</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5">
            {mostPopular.slice(0, 10).map((product) => (
              <div className="col mb-4" key={`pop-${product.id}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Just arrived ================= */}
      <section className="py-5 overflow-hidden">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="section-header d-flex flex-wrap justify-content-between my-5">
                <h2 className="section-title">Just arrived</h2>
                <div className="d-flex align-items-center">
                  <Link href="/products?sort=newest" className="btn-link text-decoration-none">View All Products →</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5">
            {newestProducts.slice(0, 10).map((product) => (
              <div className="col mb-4" key={`new-${product.id}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Latest blog ================= */}
      {blogPosts.length > 0 && (
        <section id="latest-blog" className="py-5">
          <div className="container-fluid">
            <div className="row">
              <div className="section-header d-flex align-items-center justify-content-between my-5">
                <h2 className="section-title">Our Recent Blog</h2>
                <div className="btn-wrap align-right">
                  <Link href="/blog" className="d-flex align-items-center nav-link">Read All Articles <ArrowRightSvg /></Link>
                </div>
              </div>
            </div>
            <div className="row">
              {blogPosts.map((post) => (
                <div className="col-md-4 mb-4" key={post.id}>
                  <article className="post-item card border-0 shadow-sm p-3 h-100">
                    <div className="image-holder zoom-effect">
                      <Link href={`/blog/${post.slug}`}>
                        <img src={post.coverImage} alt="post" className="card-img-top" />
                      </Link>
                    </div>
                    <div className="card-body">
                      <div className="post-meta d-flex text-uppercase gap-3 my-2 align-items-center">
                        <div className="meta-date">
                          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a3 3 0 0 0-3 3v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a3 3 0 0 0-3-3Zm2 16H4V9h17Z" /></svg>{' '}
                          {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="meta-categories">
                          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2Zm0 4h4V4h-4Z" /></svg> {post.category}
                        </div>
                      </div>
                      <div className="post-header">
                        <h3 className="post-title">
                          <Link href={`/blog/${post.slug}`} className="text-decoration-none">{post.title}</Link>
                        </h3>
                        <p>{post.excerpt}</p>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= App download ================= */}
      <section className="py-5 my-5">
        <div className="container-fluid">
          <div className="bg-warning py-5 rounded-5" style={{ backgroundImage: "url('/images/bg-pattern-2.png')", backgroundRepeat: 'no-repeat' }}>
            <div className="container">
              <div className="row">
                <div className="col-md-4">
                  <img src="/images/phone.png" alt="phone" className="image-float img-fluid" />
                </div>
                <div className="col-md-8">
                  <h2 className="my-5">Shop faster with E-Mart App</h2>
                  <p>Get your groceries delivered in minutes. Track your orders in real time, get exclusive app-only discounts and never run out of essentials again.</p>
                  <div className="d-flex gap-2 flex-wrap">
                    <img src="/images/app-store.jpg" alt="app-store" />
                    <img src="/images/google-play.jpg" alt="google-play" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Popular searches ================= */}
      <section className="py-5">
        <div className="container-fluid">
          <h2 className="my-5">People are also looking for</h2>
          {['Rice', 'Milk', 'Bread', 'Eggs', 'Chicken', 'Apples', 'Tea', 'Oil', 'Sugar', 'Flour'].map((term) => (
            <Link key={term} href={`/products?search=${encodeURIComponent(term)}`} className="btn btn-warning me-2 mb-2">
              {term}
            </Link>
          ))}
        </div>
      </section>

      {/* ================= Features ================= */}
      <section className="py-5">
        <div className="container-fluid">
          <div className="row row-cols-1 row-cols-sm-3 row-cols-lg-5">
            {[
              { title: 'Free delivery', desc: 'On orders over Rs 2,000 across Pakistan.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M21.5 15a3 3 0 0 0-1.9-2.78l1.87-7a1 1 0 0 0-.18-.87A1 1 0 0 0 20.5 4H6.8l-.33-1.26A1 1 0 0 0 5.5 2h-2v2h1.23l2.48 9.26a1 1 0 0 0 1 .74H18.5a1 1 0 0 1 0 2h-13a1 1 0 0 0 0 2h1.18a3 3 0 1 0 5.64 0h2.36a3 3 0 1 0 5.82 1a2.94 2.94 0 0 0-.4-1.47A3 3 0 0 0 21.5 15Zm-3.91-3H9L7.34 6H19.2ZM9.5 20a1 1 0 1 1 1-1a1 1 0 0 1-1 1Zm8 0a1 1 0 1 1 1-1a1 1 0 0 1-1 1Z" /></svg>
              ) },
              { title: '100% secure payment', desc: 'Cash on delivery & encrypted card payments.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M19.63 3.65a1 1 0 0 0-.84-.2a8 8 0 0 1-6.22-1.27a1 1 0 0 0-1.14 0a8 8 0 0 1-6.22 1.27a1 1 0 0 0-.84.2a1 1 0 0 0-.37.78v7.45a9 9 0 0 0 3.77 7.33l3.65 2.6a1 1 0 0 0 1.16 0l3.65-2.6A9 9 0 0 0 20 11.88V4.43a1 1 0 0 0-.37-.78ZM18 11.88a7 7 0 0 1-2.93 5.7L12 19.77l-3.07-2.19A7 7 0 0 1 6 11.88v-6.3a10 10 0 0 0 6-1.39a10 10 0 0 0 6 1.39Zm-4.46-2.29l-2.69 2.7l-.89-.9a1 1 0 0 0-1.42 1.42l1.6 1.6a1 1 0 0 0 1.42 0L15 11a1 1 0 0 0-1.42-1.42Z" /></svg>
              ) },
              { title: 'Quality guarantee', desc: 'Fresh produce checked before dispatch.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M22 5H2a1 1 0 0 0-1 1v4a3 3 0 0 0 2 2.82V22a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-9.18A3 3 0 0 0 23 10V6a1 1 0 0 0-1-1Zm-7 2h2v3a1 1 0 0 1-2 0Zm-4 0h2v3a1 1 0 0 1-2 0ZM7 7h2v3a1 1 0 0 1-2 0Zm-3 4a1 1 0 0 1-1-1V7h2v3a1 1 0 0 1-1 1Zm10 10h-4v-2a2 2 0 0 1 4 0Zm5 0h-3v-2a4 4 0 0 0-8 0v2H5v-8.18a3.17 3.17 0 0 0 1-.6a3 3 0 0 0 4 0a3 3 0 0 0 4 0a3 3 0 0 0 4 0a3.17 3.17 0 0 0 1 .6Zm2-11a1 1 0 0 1-2 0V7h2ZM4.3 3H20a1 1 0 0 0 0-2H4.3a1 1 0 0 0 0 2Z" /></svg>
              ) },
              { title: 'Guaranteed savings', desc: 'Daily deals and bundle discounts.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8.35a3.07 3.07 0 0 0-3.54.53a3 3 0 0 0 0 4.24L11.29 16a1 1 0 0 0 1.42 0l2.83-2.83a3 3 0 0 0 0-4.24A3.07 3.07 0 0 0 12 8.35Zm2.12 3.36L12 13.83l-2.12-2.12a1 1 0 0 1 0-1.42a1 1 0 0 1 1.41 0a1 1 0 0 0 1.42 0a1 1 0 0 1 1.41 0a1 1 0 0 1 0 1.42ZM12 2A10 10 0 0 0 2 12a9.89 9.89 0 0 0 2.26 6.33l-2 2a1 1 0 0 0-.21 1.09A1 1 0 0 0 3 22h9a10 10 0 0 0 0-20Zm0 18H5.41l.93-.93a1 1 0 0 0 0-1.41A8 8 0 1 1 12 20Z" /></svg>
              ) },
              { title: 'Daily offers', desc: 'New promotions added every single day.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M18 7h-.35A3.45 3.45 0 0 0 18 5.5a3.49 3.49 0 0 0-6-2.44A3.49 3.49 0 0 0 6 5.5A3.45 3.45 0 0 0 6.35 7H6a3 3 0 0 0-3 3v2a1 1 0 0 0 1 1h1v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6h1a1 1 0 0 0 1-1v-2a3 3 0 0 0-3-3Zm-7 13H8a1 1 0 0 1-1-1v-6h4Zm0-9H5v-1a1 1 0 0 1 1-1h5Zm0-4H9.5A1.5 1.5 0 1 1 11 5.5Zm2-1.5A1.5 1.5 0 1 1 14.5 7H13ZM17 19a1 1 0 0 1-1 1h-3v-7h4Zm2-8h-6V9h5a1 1 0 0 1 1 1Z" /></svg>
              ) },
            ].map((feature) => (
              <div className="col" key={feature.title}>
                <div className="card mb-3 border-0">
                  <div className="row">
                    <div className="col-md-2 text-dark">{feature.icon}</div>
                    <div className="col-md-10">
                      <div className="card-body p-0">
                        <h5>{feature.title}</h5>
                        <p className="card-text">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
