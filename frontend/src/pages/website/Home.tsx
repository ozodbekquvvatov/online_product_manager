  import React, { useEffect, useState, useRef } from 'react';
  import { Container, Row, Col, Card, Button, Navbar, Nav, Pagination } from 'react-bootstrap';
  import { Link } from 'react-router-dom';
  import {
    Mail,
    Phone,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    LogIn,
    Image as ImageIcon,
    ChevronRight,
    Star,
    ArrowRight,
    Sparkles,
    Zap,
    Target,
    Users,
    Globe,
    Headphones,
    ShoppingCart,
    Send,
    Play,
    Package,
    ArrowUp,
    Circle
  } from 'lucide-react';

  interface Product {
    id: number;
    name: string;
    description: string;
    cost_price: string;
    selling_price: string;
    stock_quantity: number;
    reorder_level: number;
    unit_of_measure: string;
    is_active: boolean;
    profit_margin: string;
    images?: ProductImage[];
  }

  interface ProductImage {
    id: number;
    image_path: string;
    image_name: string;
    is_primary: boolean;
  }

  export const Home: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(6);
    const [totalProducts, setTotalProducts] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Animated background particles
    const particles = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 50);
      };

      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      };

      window.addEventListener('scroll', handleScroll);
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, []);

    useEffect(() => {
      fetchProducts();
    }, [currentPage]);

    // Create animated particles
    useEffect(() => {
      if (!particles.current) return;

      const createParticle = () => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 4 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.opacity = `${Math.random() * 0.3 + 0.1}`;
        particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particles.current?.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 30000);
      };

      // Create initial particles
      for (let i = 0; i < 20; i++) {
        createParticle();
      }

      const interval = setInterval(createParticle, 1000);
      return () => clearInterval(interval);
    }, []);

    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/products/public?page=${currentPage}&limit=${productsPerPage}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setProducts(result.data);
          setTotalProducts(result.total || result.data.length * 3);
        } else {
          throw new Error(result.message || 'Failed to load products');
        }
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const getProductImageUrl = (product: Product) => {
      if (imageErrors[product.id]) {
        return 'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=400';
      }

      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.is_primary);
        const firstImage = product.images[0];
        const image = primaryImage || firstImage;
        
        if (image && image.image_path) {
          if (image.image_path.startsWith('http')) {
            return image.image_path;
          } else {
            return `/storage/${image.image_path}`;
          }
        }
      }
      
      return 'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=400';
    };

    const handleImageError = (productId: number) => {
      setImageErrors(prev => ({ ...prev, [productId]: true }));
    };

    const formatPrice = (price: string) => {
      const priceNumber = parseFloat(price);
      
      if (isNaN(priceNumber)) {
        return 'Price not available';
      }
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(priceNumber);
    };

    const hasImages = (product: Product) => {
      return product.images && product.images.length > 0;
    };

    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const renderPaginationItems = () => {
      const items = [];
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      items.push(
        <Pagination.Prev 
          key="prev" 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        />
      );

      if (startPage > 1) {
        items.push(
          <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
            1
          </Pagination.Item>
        );
        if (startPage > 2) {
          items.push(<Pagination.Ellipsis key="ellipsis-start" />);
        }
      }

      for (let page = startPage; page <= endPage; page++) {
        items.push(
          <Pagination.Item 
            key={page} 
            active={page === currentPage}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Pagination.Item>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          items.push(<Pagination.Ellipsis key="ellipsis-end" />);
        }
        items.push(
          <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </Pagination.Item>
        );
      }

      items.push(
        <Pagination.Next 
          key="next" 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        />
      );

      return items;
    };

    return (
      <>
        {/* Animated Background */}
        <div 
          ref={particles}
          className="fixed inset-0 pointer-events-none overflow-hidden z-0"
          style={{
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          }}
        />

        {/* Mouse Tracker Effect */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(102, 126, 234, 0.1) 0%, transparent 50%)`,
            transition: 'background 0.3s ease-out'
          }}
        />

        <Navbar 
          bg={scrolled ? "dark" : "transparent"} 
          variant="dark" 
          expand="lg" 
          fixed="top"
          className={`transition-all duration-500 ${scrolled ? 'py-2 shadow-lg bg-dark/95 backdrop-blur-sm' : 'py-3'}`}
        >
          <Container>
            <Navbar.Brand 
              href="/" 
              className="fw-bold d-flex align-items-center hover-scale"
              style={{
                transform: `translateY(${Math.sin(Date.now() / 1000) * 2}px)`,
                transition: 'transform 0.3s ease'
              }}
            >
              <Sparkles className="me-2 text-warning" size={24} />
              <span className="gradient-text">OurBusiness</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mx-auto">
                {['Home', 'Products', 'Contact'].map((item, index) => (
                  <Nav.Link 
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="mx-3 position-relative nav-link-animated"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {item}
                    <span className="nav-line"></span>
                  </Nav.Link>
                ))}
              </Nav>
              <Nav>
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className="d-flex align-items-center px-4 py-2 rounded-pill bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg hover-lift"
                >
                  <LogIn size={18} className="me-2" />
                  Admin Portal
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Hero Section */}
        <section
          id="home"
          className="min-vh-100 d-flex align-items-center justify-content-center position-relative text-white overflow-hidden"
        >
          {/* Floating Orbs */}
          <div className="floating-orb orb-1"></div>
          <div className="floating-orb orb-2"></div>
          <div className="floating-orb orb-3"></div>

          <Container className="text-center py-5 position-relative z-10">
            <div 
              className="mb-4 animate-float"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="text-primary d-flex align-items-center justify-content-center badge-animated">
                <Zap className="me-2" size={20} />
                Trusted by 1000+ Companies
              </span>
            </div>

            <h1 
              className="display-3 fw-bold mb-4 text-reveal"
              style={{ animationDelay: '0.4s' }}
            >
              Elevate Your <span className="gradient-text">Business</span>
            </h1>

            <p 
              className="lead mb-5 mx-auto fade-in-up"
              style={{maxWidth: '800px', animationDelay: '0.6s'}}
            >
              We transform your vision into reality with cutting-edge solutions, 
              unparalleled quality, and exceptional service.
            </p>

            <div 
              className="d-flex flex-wrap justify-content-center gap-3 mb-5 button-group"
              style={{ animationDelay: '0.8s' }}
            >
              <Button 
                size="lg" 
                variant="primary"
                className="px-5 py-3 rounded-pill hover-lift btn-glow"
                href="#contact"
              >
                Get Started
                <ChevronRight className="ms-2 arrow-animate" size={20} />
              </Button>
              <Button 
                variant="outline-light" 
                size="lg" 
                className="px-5 py-3 rounded-pill hover-lift"
                href="#products"
              >
                <Play className="me-2" size={20} />
                View Products
              </Button>
            </div>

            {/* Stats Counter */}
            <div className="row g-4 mx-auto justify-content-center fade-in-up" style={{maxWidth: '1000px', animationDelay: '1s'}}>
              {[
                { value: '500+', label: 'Happy Clients', icon: <Users />, color: 'text-purple' },
                { value: '95%', label: 'Success Rate', icon: <Target />, color: 'text-green' },
                { value: '24/7', label: 'Support', icon: <Headphones />, color: 'text-blue' },
                { value: '50+', label: 'Countries', icon: <Globe />, color: 'text-orange' },
              ].map((stat, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div 
                    className="bg-white/5 rounded-3 p-4 border border-white/10 hover-lift stat-card"
                    style={{ animationDelay: `${1.2 + i * 0.1}s` }}
                  >
                    <div className={`${stat.color} mb-2 icon-float`}>
                      {stat.icon}
                    </div>
                    <div className="fs-3 fw-bold mb-1 count-up">{stat.value}</div>
                    <div className="text-white/70 small">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div 
              className="scroll-indicator mt-5"
              style={{ animationDelay: '1.6s' }}
            >
              <div className="mouse">
                <div className="wheel"></div>
              </div>
            </div>
          </Container>
        </section>

        {/* Products Section */}
        <section id="products" className="py-5 bg-light position-relative">
          {/* Background Pattern */}
          <div className="pattern-dots"></div>
          
          <Container>
            <div className="text-center mb-5">
              <div 
                className="d-inline-block px-4 py-2 rounded-pill bg-gradient-to-r from-purple-500/20 to-blue-500/20 mb-4 fade-in-up"
                style={{ animationDelay: '0.2s' }}
              >
                <span className="text-purple small">Featured Collection</span>
              </div>
              <h2 
                className="display-4 fw-bold mb-3 fade-in-up"
                style={{ animationDelay: '0.3s' }}
              >
                Our <span className="gradient-text">Products</span>
              </h2>
              <p 
                className="text-muted fade-in-up"
                style={{ animationDelay: '0.4s' }}
              >
                Discover our collection of innovative products
              </p>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="loader">
                  <div className="loader-circle"></div>
                  <div className="loader-circle"></div>
                  <div className="loader-circle"></div>
                </div>
                <p className="mt-3 text-muted">Loading premium products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-5">
                <div 
                  className="w-24 h-24 mx-auto mb-4 rounded-circle bg-gradient-to-r from-purple-100 to-blue-100 d-flex align-items-center justify-content-center animate-pulse"
                  style={{ animationDuration: '2s' }}
                >
                  <Package className="text-purple" size={48} />
                </div>
                <h3 className="h4 fw-bold mb-3">Coming Soon</h3>
                <p className="text-muted mb-4">We're preparing something amazing for you!</p>
                <Button 
                  variant="outline-primary" 
                  className="rounded-pill px-4 hover-lift"
                  href="#contact"
                >
                  Get Notified
                </Button>
              </div>
            ) : (
              <>
                <Row className="g-4">
                  {products.map((product, index) => (
                    <Col key={product.id} lg={4} md={6}>
                      <Card 
                        className="h-100 shadow-sm border-0 product-card"
                        onMouseEnter={() => setHoveredCard(product.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{ 
                          animationDelay: `${index * 0.1}s`,
                          transform: hoveredCard === product.id ? 'translateY(-10px)' : 'translateY(0)'
                        }}
                      >
                        <div 
                          className="position-relative overflow-hidden card-image-container"
                          style={{ height: '220px' }}
                        >
                          <div className="card-image-wrapper">
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.name}
                              className="w-100 h-100 object-cover"
                              onError={() => handleImageError(product.id)}
                              style={{ 
                                transform: hoveredCard === product.id ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                            />
                            <div className="card-image-overlay"></div>
                          </div>
                          {!hasImages(product) && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                              <div className="text-center text-muted">
                                <ImageIcon size={32} className="mb-2" />
                                <p className="small">No Image</p>
                              </div>
                            </div>
                          )}
                          {/* Badge */}
                          <div 
                            className="position-absolute top-3 end-3"
                            style={{
                              transform: hoveredCard === product.id ? 'rotate(360deg)' : 'rotate(0deg)',
                              transition: 'transform 0.5s ease'
                            }}
                          >
                            <span className="px-3 py-1 rounded-pill bg-gradient-to-r from-purple-600 to-blue-500 text-white small fw-semibold shadow-sm">
                              Featured
                            </span>
                          </div>
                        </div>

                        <Card.Body className="d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <Card.Title className="h5 mb-0 fw-bold text-dark">
                              {product.name}
                            </Card.Title>
                            <span className="h5 text-primary fw-bold price-animate">
                              {formatPrice(product.selling_price)}
                            </span>
                          </div>

                          <Card.Text className="text-muted mb-4 flex-grow-1">
                            {product.description && product.description.length > 100 
                              ? `${product.description.substring(0, 100)}...`
                              : product.description || 'Premium quality product'
                            }
                          </Card.Text>

                          <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex align-items-center gap-2">
                              <div className="d-flex text-warning">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={14} 
                                    fill="currentColor"
                                    className="star-twinkle"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                  />
                                ))}
                              </div>
                              <span className="text-muted small">(4.8)</span>
                            </div>
                            <div className="text-muted small">
                              <Circle size={8} className="d-inline me-1 text-success" fill="currentColor" />
                              In Stock
                            </div>
                          </div>

                          <Button 
                            variant="primary" 
                            className="w-100 rounded-pill py-2 hover-lift btn-expand"
                          >
                            <ShoppingCart className="me-2" size={16} />
                            View Details
                            <ArrowRight 
                              className="ms-2" 
                              size={16}
                              style={{
                                transform: hoveredCard === product.id ? 'translateX(5px)' : 'translateX(0)',
                                transition: 'transform 0.3s ease'
                              }}
                            />
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-5">
                    <div className="bg-white rounded-3 p-2 shadow-sm">
                      <Pagination className="mb-0">
                        {renderPaginationItems()}
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}
          </Container>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-5 bg-white position-relative">
          {/* Background Pattern */}
          <div className="pattern-lines"></div>
          
          <Container>
            <Row className="align-items-center">
              <Col lg={6}>
                <div 
                  className="mb-5 fade-in-left"
                  style={{ animationDelay: '0.2s' }}
                >
                  <div className="d-inline-block px-4 py-2 rounded-pill bg-gradient-to-r from-purple-500/10 to-blue-500/10 mb-4">
                    <span className="text-purple small">Get in Touch</span>
                  </div>
                  <h2 className="display-5 fw-bold mb-4">
                    Let's Create <span className="gradient-text">Together</span>
                  </h2>
                  <p className="text-muted">
                    Have a project in mind? We'd love to hear about it.
                  </p>
                </div>

                <div className="mb-4">
                  {[
                    { icon: <Phone />, title: 'Phone', value: '+1 (555) 123-4567', delay: '0.3s' },
                    { icon: <Mail />, title: 'Email', value: 'hello@ourbusiness.com', delay: '0.4s' },
                    { icon: <MapPin />, title: 'Location', value: 'Silicon Valley, CA', delay: '0.5s' },
                  ].map((item, i) => (
                    <div 
                      key={i}
                      className="d-flex align-items-center p-3 rounded border-0 bg-light mb-3 hover-lift contact-item"
                      style={{ 
                        animationDelay: item.delay,
                        transform: hoveredCard === i ? 'translateX(10px)' : 'translateX(0)'
                      }}
                      onMouseEnter={() => setHoveredCard(i)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="p-3 rounded-circle bg-gradient-to-r from-purple-500 to-blue-500 text-white me-3 icon-rotate">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-muted small mb-1">{item.title}</p>
                        <p className="fw-semibold mb-0">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <h4 className="fw-bold mb-3">Follow Our Journey</h4>
                  <div className="d-flex gap-3">
                    {[
                      { icon: <Facebook />, color: '#1877f2', delay: '0.6s' },
                      { icon: <Twitter />, color: '#1da1f2', delay: '0.7s' },
                      { icon: <Instagram />, color: '#e4405f', delay: '0.8s' },
                      { icon: <Linkedin />, color: '#0a66c2', delay: '0.9s' },
                    ].map((social, i) => (
                      <a
                        key={i}
                        href="#"
                        className="w-12 h-12 rounded-circle d-flex align-items-center justify-content-center text-white social-icon hover-lift"
                        style={{
                          backgroundColor: social.color,
                          animationDelay: social.delay,
                          transform: hoveredCard === i + 10 ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                        }}
                        onMouseEnter={() => setHoveredCard(i + 10)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </Col>

              <Col lg={6}>
                <div 
                  className="rounded-3 border-0 shadow-lg p-4 bg-white form-animate"
                  style={{ animationDelay: '0.3s' }}
                >
                  <form>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Full Name</label>
                      <input
                        type="text"
                        className="form-control border-0 bg-light py-3 px-4 rounded-pill focus-animate"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control border-0 bg-light py-3 px-4 rounded-pill focus-animate"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Message</label>
                      <textarea
                        rows={4}
                        className="form-control border-0 bg-light py-3 px-4 rounded-3 focus-animate"
                        placeholder="Tell us about your project..."
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100 py-3 rounded-pill hover-lift btn-glow"
                    >
                      Send Message
                      <Send className="ms-2" size={18} />
                    </Button>
                  </form>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Footer */}
        <footer className="bg-dark text-white py-5 position-relative">
          <Container>
            <Row className="mb-4">
              <Col lg={4} className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <Sparkles 
                    className="me-2 text-warning" 
                    size={20}
                    style={{ animation: 'pulse 2s infinite' }}
                  />
                  <span className="fs-4 fw-bold gradient-text">OurBusiness</span>
                </div>
                <p className="text-white-50 mb-0">
                  Building the future of business with innovation and excellence.
                </p>
              </Col>
              {['Product', 'Company', 'Legal'].map((category, i) => (
                <Col key={category} lg={2} md={4} sm={6} className="mb-4">
                  <h5 className="fw-bold mb-3">{category}</h5>
                  <ul className="list-unstyled">
                    {['Features', 'Pricing', 'Contact'].map((item, j) => (
                      <li key={item} className="mb-2">
                        <a 
                          href="#" 
                          className="text-white-50 hover-link"
                          style={{ animationDelay: `${(i * 3 + j) * 0.1}s` }}
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Col>
              ))}
            </Row>
            <div className="pt-4 border-top border-white-20">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                <p className="text-white-50 small mb-3 mb-md-0">
                  © {new Date().getFullYear()} OurBusiness. All rights reserved.
                </p>
                <div className="d-flex align-items-center gap-4">
                  {['Privacy', 'Terms', 'Cookies'].map((item, i) => (
                    <a 
                      key={item}
                      href="#" 
                      className="text-white-50 small hover-link"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </footer>

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="position-fixed bottom-4 end-4 w-12 h-12 rounded-circle bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg border-0 d-flex align-items-center justify-content-center back-to-top hover-lift"
          style={{ 
            animation: 'float 3s infinite ease-in-out',
            opacity: scrolled ? 1 : 0,
            transform: scrolled ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.3s, transform 0.3s'
          }}
        >
          <ArrowUp size={20} />
        </button>

        {/* Enhanced CSS Animations */}
        <style>{`
          /* Base animations */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
          
          @keyframes particleFloat {
            0% {
              transform: translateY(100vh) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.3;
            }
            90% {
              opacity: 0.3;
            }
            100% {
              transform: translateY(-100px) rotate(360deg);
              opacity: 0;
            }
          }
          
          @keyframes textReveal {
            from {
              clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
            }
            to {
              clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            }
          }
          
          @keyframes starTwinkle {
            0%, 100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
          }
          
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          @keyframes countUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          
          /* Utility classes */
          .fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
          }
          
          .fade-in-left {
            animation: fadeInLeft 0.8s ease-out forwards;
            opacity: 0;
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
          .animate-pulse {
            animation: pulse 2s ease-in-out infinite;
          }
          
          .text-reveal {
            animation: textReveal 1.5s ease-out forwards;
            clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
          }
          
          .gradient-text {
            background: linear-gradient(90deg, #667eea, #764ba2, #d53a9d);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradient 3s ease infinite;
          }
          
          /* Particle system */
          .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            pointer-events: none;
            animation: particleFloat linear infinite;
          }
          
          /* Floating orbs */
          .floating-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(40px);
            opacity: 0.1;
            z-index: 0;
          }
          
          .orb-1 {
            top: 20%;
            left: 10%;
            width: 300px;
            height: 300px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            animation: float 20s ease-in-out infinite;
          }
          
          .orb-2 {
            top: 60%;
            right: 10%;
            width: 200px;
            height: 200px;
            background: linear-gradient(135deg, #d53a9d, #ff6b6b);
            animation: float 25s ease-in-out infinite reverse;
            animation-delay: 5s;
          }
          
          .orb-3 {
            bottom: 10%;
            left: 50%;
            width: 150px;
            height: 150px;
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            animation: float 30s ease-in-out infinite;
            animation-delay: 10s;
          }
          
          /* Card hover effects */
          .product-card {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            background: white;
          }
          
          .product-card:hover {
            box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15) !important;
          }
          
          .card-image-container {
            border-radius: 10px 10px 0 0;
            overflow: hidden;
          }
          
          .card-image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.1), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .product-card:hover .card-image-overlay {
            opacity: 1;
          }
          
          /* Button effects */
          .hover-lift {
            transition: all 0.3s ease;
          }
          
          .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          
          .btn-glow {
            position: relative;
            overflow: hidden;
          }
          
          .btn-glow::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 5px;
            height: 5px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 0;
            border-radius: 100%;
            transform: scale(1, 1) translate(-50%);
            transform-origin: 50% 50%;
          }
          
          .btn-glow:hover::after {
            animation: ripple 1s ease-out;
          }
          
          @keyframes ripple {
            0% {
              transform: scale(0, 0);
              opacity: 0.5;
            }
            100% {
              transform: scale(20, 20);
              opacity: 0;
            }
          }
          
          .btn-expand:hover {
            padding-right: 2.5rem !important;
          }
          
          /* Star twinkle */
          .star-twinkle {
            animation: starTwinkle 1s ease-in-out infinite;
          }
          
          /* Icon animations */
          .icon-float {
            animation: float 2s ease-in-out infinite;
          }
          
          .icon-rotate:hover {
            animation: rotate 0.5s ease;
          }
          
          .arrow-animate {
            transition: transform 0.3s ease;
          }
          
          .btn:hover .arrow-animate {
            transform: translateX(5px);
          }
          
          /* Navigation */
          .nav-link-animated {
            position: relative;
            padding-bottom: 5px;
          }
          
          .nav-line {
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: all 0.3s ease;
            transform: translateX(-50%);
          }
          
          .nav-link-animated:hover .nav-line {
            width: 100%;
          }
          
          /* Stats cards */
          .stat-card {
            transition: all 0.4s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-10px) scale(1.02);
            background: rgba(255, 255, 255, 0.1) !important;
          }
          
          .count-up {
            animation: countUp 1s ease-out forwards;
            opacity: 0;
          }
          
          /* Price animation */
          .price-animate {
            transition: all 0.3s ease;
          }
          
          .product-card:hover .price-animate {
            transform: scale(1.1);
            color: #667eea !important;
          }
          
          /* Form animations */
          .focus-animate:focus {
            transform: scale(1.02);
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
          }
          
          /* Social icons */
          .social-icon {
            transition: all 0.3s ease;
          }
          
          .social-icon:hover {
            transform: scale(1.1) rotate(5deg);
          }
          
          /* Contact items */
          .contact-item {
            transition: all 0.3s ease;
          }
          
          /* Pattern backgrounds */
          .pattern-dots {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(rgba(102, 126, 234, 0.1) 1px, transparent 1px);
            background-size: 30px 30px;
            opacity: 0.3;
            pointer-events: none;
          }
          
          .pattern-lines {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: linear-gradient(90deg, transparent 24%, rgba(102, 126, 234, 0.05) 25%, rgba(102, 126, 234, 0.05) 26%, transparent 27%, transparent 74%, rgba(102, 126, 234, 0.05) 75%, rgba(102, 126, 234, 0.05) 76%, transparent 77%, transparent),
                          linear-gradient(0deg, transparent 24%, rgba(102, 126, 234, 0.05) 25%, rgba(102, 126, 234, 0.05) 26%, transparent 27%, transparent 74%, rgba(102, 126, 234, 0.05) 75%, rgba(102, 126, 234, 0.05) 76%, transparent 77%, transparent);
            background-size: 50px 50px;
            opacity: 0.2;
            pointer-events: none;
          }
          
          /* Scroll indicator */
          .scroll-indicator {
            opacity: 0;
            animation: fadeInUp 0.8s ease-out 1.6s forwards;
          }
          
          .mouse {
            width: 26px;
            height: 40px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            position: relative;
            margin: 0 auto;
          }
          
          .wheel {
            width: 4px;
            height: 8px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 2px;
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            animation: scroll 2s infinite;
          }
          
          @keyframes scroll {
            0% {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
          }
          
          /* Loader */
          .loader {
            display: flex;
            gap: 10px;
            justify-content: center;
          }
          
          .loader-circle {
            width: 12px;
            height: 12px;
            background: #667eea;
            border-radius: 50%;
            animation: pulse 1.4s ease-in-out infinite;
          }
          
          .loader-circle:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          .loader-circle:nth-child(3) {
            animation-delay: 0.4s;
          }
          
          /* Hover links */
          .hover-link {
            position: relative;
            transition: color 0.3s ease;
          }
          
          .hover-link::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 1px;
            background: currentColor;
            transition: width 0.3s ease;
          }
          
          .hover-link:hover {
            color: white !important;
          }
          
          .hover-link:hover::after {
            width: 100%;
          }
          
          /* Badge animation */
          .badge-animated {
            animation: float 3s ease-in-out infinite;
            background: rgba(102, 126, 234, 0.1);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .display-3 {
              font-size: 2.5rem;
            }
            
            .display-4 {
              font-size: 2rem;
            }
            
            .display-5 {
              font-size: 1.75rem;
            }
          }
        `}</style>
      </>
    );
  };