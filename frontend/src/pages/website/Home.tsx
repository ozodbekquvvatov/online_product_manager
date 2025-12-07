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
  Award,
  Shield,
  Truck,
  ArrowRight
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
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const typingWords = ['Quality Products', 'Best Services', 'Customer Satisfaction', 'Innovation', 'Excellence'];
  const animatedCirclesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  // Auto typing effect
  useEffect(() => {
    const typeEffect = () => {
      const currentWord = typingWords[typingIndex];
      const updatedTypingText = isDeleting 
        ? currentWord.substring(0, typingText.length - 1)
        : currentWord.substring(0, typingText.length + 1);

      setTypingText(updatedTypingText);

      if (!isDeleting && updatedTypingText === currentWord) {
        // Word completed, start deleting after pause
        setTimeout(() => setIsDeleting(true), 1500);
        setTypingSpeed(50);
      } else if (isDeleting && updatedTypingText === '') {
        // Word deleted, move to next word
        setIsDeleting(false);
        setTypingIndex((prevIndex) => (prevIndex + 1) % typingWords.length);
        setTypingSpeed(100);
      }
    };

    const typingTimer = setTimeout(typeEffect, typingSpeed);
    return () => clearTimeout(typingTimer);
  }, [typingText, isDeleting, typingIndex, typingSpeed]);

  // Circle animation effect
  useEffect(() => {
    const circles = animatedCirclesRef.current;
    if (!circles) return;

    const circleElements = circles.querySelectorAll('.animated-circle');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, { threshold: 0.5 });

    circleElements.forEach(circle => observer.observe(circle));

    return () => {
      circleElements.forEach(circle => observer.unobserve(circle));
    };
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
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand href="/" className="fw-bold">OurBusiness</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home" className="nav-hover">Home</Nav.Link>
              <Nav.Link href="#about" className="nav-hover">About Us</Nav.Link>
              <Nav.Link href="#features" className="nav-hover">Features</Nav.Link>
              <Nav.Link href="#products" className="nav-hover">Products</Nav.Link>
              <Nav.Link href="#contact" className="nav-hover">Contact</Nav.Link>
            </Nav>
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login" className="d-flex align-items-center login-btn">
                <LogIn size={18} className="me-1" />
                Admin Login
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section with Auto Typing */}
      <section
        id="home"
        className="hero-section d-flex align-items-center"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Animated Circles Background */}
        <div ref={animatedCirclesRef} className="animated-circles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="animated-circle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
              animationDelay: `${i * 0.5}s`
            }}></div>
          ))}
        </div>

        <div className="hero-overlay position-absolute w-100 h-100 top-0 start-0"></div>
        <Container className="position-relative text-white text-center">
          <h1 className="display-3 fw-bold mb-3 animate-fade-in">
            Welcome to Our Business
          </h1>
          <div className="typing-container mb-4">
            <h2 className="h1 fw-bold typing-text">
              We Deliver <span className="typed-text">{typingText}</span>
              <span className="cursor">|</span>
            </h2>
          </div>
          <p className="lead mb-4 animate-slide-up">
            Your trusted partner for quality products and exceptional service
          </p>
          <div className="animate-bounce-in">
            <Button variant="light" size="lg" className="me-3 px-4 py-3 hero-btn" href="#contact">
              Get Started <ChevronRight size={20} className="ms-1" />
            </Button>
            <Button variant="outline-light" size="lg" className="px-4 py-3 hero-btn" href="#products">
              View Products <ArrowRight size={20} className="ms-1" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Features Section with Rotating Cards */}
      <section id="features" className="py-5 bg-white">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold section-title">Why Choose Us</h2>
            <p className="text-muted">Experience the difference with our premium services</p>
          </div>
          
          <Row className="g-4">
            {[
              { icon: <Star size={40} />, title: 'Premium Quality', desc: 'Top-grade materials and craftsmanship', color: '#ffd700' },
              { icon: <Award size={40} />, title: 'Award Winning', desc: 'Recognized excellence in our industry', color: '#ff6b6b' },
              { icon: <Shield size={40} />, title: 'Secure & Reliable', desc: 'Your satisfaction guaranteed', color: '#4ecdc4' },
              { icon: <Truck size={40} />, title: 'Fast Delivery', desc: 'Quick and efficient shipping', color: '#95e1d3' },
            ].map((feature, index) => (
              <Col key={index} md={3} sm={6}>
                <div className="feature-card rotate-card">
                  <div className="card-front text-center p-4">
                    <div className="icon-wrapper mb-3" style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                    <h5 className="fw-bold">{feature.title}</h5>
                  </div>
                  <div className="card-back text-center p-4">
                    <p className="mb-0">{feature.desc}</p>
                    <Button variant="outline-primary" size="sm" className="mt-3">
                      Learn More
                    </Button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-5 bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h2 className="fw-bold mb-4 section-title">About Us</h2>
              <p className="lead animate-text">
                We strive to deliver exceptional value to our customers through innovative solutions and top-notch service.
              </p>
              <p className="animate-text-delay">
                Our dedicated team of professionals works tirelessly to ensure customer satisfaction and 
                maintain the highest standards of quality in everything we do.
              </p>
            </Col>
            <Col lg={6}>
              <div className="image-container">
                <img
                  src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="About Us"
                  className="img-fluid rounded shadow animate-float"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Products Section */}
      <section id="products" className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold section-title">Our Products & Services</h2>
            <p className="text-muted">Discover our high-quality offerings</p>
          </div>
          
          {loading ? (
            <div className="text-center">
              <div className="spinner-grow text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No products available at the moment.</p>
              <Button variant="outline-primary">Contact for More Information</Button>
            </div>
          ) : (
            <>
              <Row className="g-4">
                {products.map((product) => (
                  <Col key={product.id} md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm product-card animate-on-scroll">
                      <div className="position-relative product-image-container">
                        <Card.Img
                          variant="top"
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          className="product-image"
                          onError={() => handleImageError(product.id)}
                        />
                        {!hasImages(product) && (
                          <div className="no-image-overlay">
                            <div className="text-center text-muted">
                              <ImageIcon size={48} />
                              <p className="mt-2 small">No Image Available</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="h5">{product.name}</Card.Title>
                        <Card.Text className="flex-grow-1 text-muted">
                          {product.description && product.description.length > 100 
                            ? `${product.description.substring(0, 100)}...`
                            : product.description || 'No description available'
                          }
                        </Card.Text>
                        <div className="mt-auto">
                          <div className="text-center mb-3">
                            <span className="h4 text-dark fw-bold">
                              {formatPrice(product.selling_price)}
                            </span>
                          </div>
                          <Button variant="primary" size="sm" className="w-100 product-btn">
                            View Details <ArrowRight size={16} className="ms-1" />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                  <Pagination>
                    {renderPaginationItems()}
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold section-title">Contact Us</h2>
            <p className="text-muted">Get in touch with our team</p>
          </div>
          
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow h-100 animate-slide-left">
                <Card.Body className="p-4">
                  <h5 className="mb-4">Contact Information</h5>
                  <Row className="g-4">
                    <Col md={12}>
                      <div className="d-flex align-items-center contact-item">
                        <div className="contact-icon bg-primary text-white rounded-circle p-3 me-3">
                          <Phone size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Phone</h6>
                          <p className="mb-0 text-muted">+1 (555) 123-4567</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex align-items-center contact-item">
                        <div className="contact-icon bg-primary text-white rounded-circle p-3 me-3">
                          <Mail size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Email</h6>
                          <p className="mb-0 text-muted">info@ourbusiness.com</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex align-items-center contact-item">
                        <div className="contact-icon bg-primary text-white rounded-circle p-3 me-3">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Address</h6>
                          <p className="mb-0 text-muted">123 Business Street, New York, NY 10001</p>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="text-center mt-4 pt-4 border-top">
                    <h6 className="mb-3">Follow Us</h6>
                    <div className="d-flex justify-content-center gap-3">
                      {[
                        { icon: <Facebook size={20} />, color: '#1877f2' },
                        { icon: <Twitter size={20} />, color: '#1da1f2' },
                        { icon: <Instagram size={20} />, color: '#e4405f' },
                        { icon: <Linkedin size={20} />, color: '#0a66c2' },
                      ].map((social, index) => (
                        <a 
                          key={index}
                          href="#" 
                          className="social-icon rounded-circle p-2"
                          style={{ backgroundColor: social.color }}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {social.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border-0 shadow h-100 animate-slide-right">
                <Card.Body className="p-0">
                  <iframe
                    title="Business Location"
                    width="100%"
                    height="400"
                    frameBorder="0"
                    className="map-iframe"
                    src="https://maps.google.com/maps?q=New%20York%2C%20USA&t=&z=13&ie=UTF8&iwloc=&output=embed"
                    allowFullScreen
                  ></iframe>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <footer className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={6}>
              <h5>OurBusiness</h5>
              <p className="text-white-50">Premium Quality in Every Transaction</p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="mb-0 text-white-50">
                © {new Date().getFullYear()} OurBusiness. All rights reserved.
              </p>
            </Col>
          </Row>
        </Container>
      </footer>

      <style>{`
        /* Hero Section */
        .hero-section {
          min-height: 100vh;
          position: relative;
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }
        
        .hero-overlay {
          background: rgba(0, 0, 0, 0.5);
        }
        
        /* Animated Circles */
        .animated-circles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
        }
        
        .animated-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          pointer-events: none;
          opacity: 0;
          transform: scale(0);
        }
        
        .animated-circle.animate {
          animation: floatCircle 20s infinite linear;
        }
        
        @keyframes floatCircle {
          0% {
            opacity: 0;
            transform: scale(0) translateY(0) rotate(0deg);
          }
          10% {
            opacity: 0.3;
            transform: scale(1) translateY(-20px) rotate(90deg);
          }
          90% {
            opacity: 0.3;
            transform: scale(1) translateY(-200px) rotate(360deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) translateY(-300px) rotate(450deg);
          }
        }
        
        /* Typing Animation */
        .typing-container {
          min-height: 80px;
        }
        
        .typed-text {
          color: #ffd700;
          font-weight: bold;
        }
        
        .cursor {
          animation: blink 1s infinite;
          color: #fff;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        /* Button Animations */
        .hero-btn {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .hero-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .hero-btn:hover::after {
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
        
        /* Navbar */
        .nav-hover {
          position: relative;
          margin: 0 10px;
        }
        
        .nav-hover::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #fff;
          transition: width 0.3s ease;
        }
        
        .nav-hover:hover::after {
          width: 100%;
        }
        
        .login-btn {
          transition: all 0.3s ease;
          border: 2px solid transparent;
          border-radius: 5px;
          padding: 8px 15px !important;
        }
        
        .login-btn:hover {
          border-color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }
        
        /* Section Titles */
        .section-title {
          position: relative;
          display: inline-block;
          padding-bottom: 15px;
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
        }
        
        /* Feature Cards */
        .rotate-card {
          perspective: 1000px;
          height: 200px;
        }
        
        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 10px;
          transition: transform 0.8s;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .card-front {
          background: white;
        }
        
        .card-back {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          transform: rotateY(180deg);
        }
        
        .rotate-card:hover .card-front {
          transform: rotateY(180deg);
        }
        
        .rotate-card:hover .card-back {
          transform: rotateY(0);
        }
        
        .icon-wrapper {
          transition: transform 0.5s ease;
        }
        
        .rotate-card:hover .icon-wrapper {
          transform: rotate(360deg) scale(1.2);
        }
        
        /* Floating Animation */
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        /* Text Animations */
        .animate-text {
          animation: fadeInUp 1s ease-out;
        }
        
        .animate-text-delay {
          animation: fadeInUp 1s ease-out 0.5s both;
        }
        
        /* Product Cards */
        .product-card {
          transition: all 0.4s ease;
          opacity: 0;
          transform: translateY(30px);
        }
        
        .product-card.animate-on-scroll {
          animation: slideUp 0.6s ease forwards;
        }
        
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .product-image-container {
          overflow: hidden;
          border-radius: 10px 10px 0 0;
        }
        
        .product-image {
          height: 200px;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .product-card:hover .product-image {
          transform: scale(1.1);
        }
        
        .product-btn {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .product-btn:hover {
          padding-right: 35px;
        }
        
        .product-btn:hover .ms-1 {
          transform: translateX(5px);
          transition: transform 0.3s ease;
        }
        
        /* Contact Items */
        .contact-item {
          transition: transform 0.3s ease;
        }
        
        .contact-item:hover {
          transform: translateX(10px);
        }
        
        .contact-icon {
          transition: all 0.3s ease;
        }
        
        .contact-item:hover .contact-icon {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        /* Social Icons */
        .social-icon {
          transition: all 0.3s ease;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .social-icon:hover {
          transform: translateY(-5px) rotate(15deg);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        
        /* Map */
        .map-iframe {
          border-radius: 10px;
          min-height: 400px;
          transition: all 0.3s ease;
        }
        
        .map-iframe:hover {
          transform: scale(1.02);
        }
        
        /* Scroll Animations */
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 1s ease-out 0.3s both;
        }
        
        .animate-bounce-in {
          animation: bounceIn 1s ease-out 0.6s both;
        }
        
        .animate-slide-left {
          animation: slideLeft 1s ease-out both;
        }
        
        .animate-slide-right {
          animation: slideRight 1s ease-out both;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        
        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .rotate-card {
            height: 150px;
          }
          
          .display-3 {
            font-size: 2.5rem;
          }
          
          .typing-container {
            min-height: 60px;
          }
        }
      `}</style>
    </>
  );
};