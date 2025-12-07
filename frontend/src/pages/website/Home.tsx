import React, { useEffect, useState } from 'react';
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
  Image as ImageIcon
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

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

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
        // Use total count from API if provided, otherwise estimate from data length
        setTotalProducts(result.total || result.data.length * 3); // Estimate if total count not provided
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

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  // Create pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
      />
    );

    // First page
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

    // Page numbers
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

    // Last page
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

    // Next button
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
          <Navbar.Brand href="/">OurBusiness</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#about">About Us</Nav.Link>
              <Nav.Link href="#products">Products</Nav.Link>
              <Nav.Link href="#contact">Contact</Nav.Link>
            </Nav>
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login" className="d-flex align-items-center">
                <LogIn size={18} className="me-1" />
                Admin Login
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section
        id="home"
        className="hero-section d-flex align-items-center"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="hero-overlay position-absolute w-100 h-100 top-0 start-0"></div>
        <Container className="position-relative text-white text-center">
          <h1 className="display-3 fw-bold mb-4">
            Welcome to Our Business
          </h1>
          <p className="lead mb-4">
            Your trusted partner for quality products
          </p>
          <div>
            <Button variant="light" size="lg" className="me-3" href="#contact">
              Get Started
            </Button>
            <Button variant="outline-light" size="lg" href="#products">
              View Products
            </Button>
          </div>
        </Container>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-5 bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h2 className="fw-bold mb-4">About Us</h2>
              <p className="lead">
                We strive to deliver exceptional value to our customers through innovative solutions and top-notch service.
              </p>
              <p>
                Our dedicated team of professionals works tirelessly to ensure customer satisfaction and 
                maintain the highest standards of quality in everything we do.
              </p>
            </Col>
            <Col lg={6}>
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="About Us"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Products Section */}
      <section id="products" className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Our Products & Services</h2>
            <p className="text-muted">Discover our high-quality offerings</p>
          </div>
          
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading products...</p>
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
                    <Card className="h-100 border-0 shadow-sm product-card">
                      <div className="position-relative">
                        <Card.Img
                          variant="top"
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          style={{ height: '200px', objectFit: 'cover' }}
                          onError={() => handleImageError(product.id)}
                        />
                        {!hasImages(product) && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
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
                          <Button variant="primary" size="sm" className="w-100">
                            View Details
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
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
            <h2 className="fw-bold">Contact Us</h2>
            <p className="text-muted">Get in touch with our team</p>
          </div>
          
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow h-100">
                <Card.Body className="p-4">
                  <h5 className="mb-4">Contact Information</h5>
                  <Row className="g-4">
                    <Col md={12}>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle p-3 me-3">
                          <Phone size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Phone</h6>
                          <p className="mb-0 text-muted">+1 (555) 123-4567</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle p-3 me-3">
                          <Mail size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Email</h6>
                          <p className="mb-0 text-muted">info@ourbusiness.com</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle p-3 me-3">
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
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary rounded-circle p-2">
                        <Facebook size={20} />
                      </a>
                      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary rounded-circle p-2">
                        <Twitter size={20} />
                      </a>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary rounded-circle p-2">
                        <Instagram size={20} />
                      </a>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary rounded-circle p-2">
                        <Linkedin size={20} />
                      </a>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="border-0 shadow h-100">
                <Card.Body className="p-0">
                  <iframe
                    title="Business Location"
                    width="100%"
                    height="400"
                    frameBorder="0"
                    style={{ border: 0, borderRadius: '0.375rem' }}
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
        .hero-section {
          min-height: 80vh;
          position: relative;
          background-size: cover;
          background-position: center;
        }
        
        .hero-overlay {
          background: rgba(0, 0, 0, 0.5);
        }
        
        .nav-link {
          transition: color 0.3s ease;
        }
        
        .nav-link:hover {
          color: #fff !important;
        }
        
        .product-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        
        iframe {
          min-height: 400px;
        }

        .pagination .page-item.active .page-link {
          background-color: #007bff;
          border-color: #007bff;
        }

        .pagination .page-link {
          color: #007bff;
        }

        .pagination .page-link:hover {
          color: #0056b3;
        }
      `}</style>
    </>
  );
};