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
        throw new Error(`HTTP xatolik! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setProducts(result.data);
        // Agar API umumiy sonni qaytarsa, undan foydalaning. Aks holda ma'lumotlar uzunligidan taxmin qiling
        setTotalProducts(result.total || result.data.length * 3); // Agar umumiy son berilmagan bo'lsa, taxmin qiling
      } else {
        throw new Error(result.message || 'Mahsulotlarni yuklash muvaffaqiyatsiz');
      }
    } catch (error) {
      console.error('Mahsulotlarni olishda xatolik:', error);
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
      return 'Narx mavjud emas';
    }
    
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
    }).format(priceNumber);
  };

  const hasImages = (product: Product) => {
    return product.images && product.images.length > 0;
  };

  // Sahifalash uchun umumiy sahifalarni hisoblash
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  // Sahifalash elementlarini yaratish
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Oldingi tugmasi
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
      />
    );

    // Birinchi sahifa
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

    // Sahifa raqamlari
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

    // Oxirgi sahifa
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

    // Keyingi tugmasi
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
          <Navbar.Brand href="/">Biznesim</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Bosh Sahifa</Nav.Link>
              <Nav.Link href="#about">Biz Haqimizda</Nav.Link>
              <Nav.Link href="#products">Mahsulotlar</Nav.Link>
              <Nav.Link href="#contact">Bog'lanish</Nav.Link>
            </Nav>
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login" className="d-flex align-items-center">
                <LogIn size={18} className="me-1" />
                Admin Kirish
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Bo'limi */}
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
            Biznesimizga Xush Kelibsiz
          </h1>
          <p className="lead mb-4">
            Sifatli mahsulotlar uchun ishonchli hamkoringiz
          </p>
          <div>
            <Button variant="light" size="lg" className="me-3" href="#contact">
              Boshlash
            </Button>
            <Button variant="outline-light" size="lg" href="#products">
              Mahsulotlarni Ko'rish
            </Button>
          </div>
        </Container>
      </section>

      {/* Biz Haqimizda Bo'limi */}
      <section id="about" className="py-5 bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h2 className="fw-bold mb-4">Biz Haqimizda</h2>
              <p className="lead">
                Biz mijozlarimizga innovatsion yechimlar va a'lo darajadagi xizmat orqali ajoyib qadrni taqdim etishga intilamiz.
              </p>
              <p>
                Bizning sadoqatli mutaxassislar jamoasi mijozlarning qoniqishini ta'minlash va 
                biz qilgan har bir ishda sifatning eng yuqori standartlarini saqlab qolish uchun tinimsiz ishlaydi.
              </p>
            </Col>
            <Col lg={6}>
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Biz Haqimizda"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mahsulotlar Bo'limi */}
      <section id="products" className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Bizning Mahsulotlar & Xizmatlar</h2>
            <p className="text-muted">Yuqori sifatli takliflarimizni kashf eting</p>
          </div>
          
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yuklanmoqda...</span>
              </div>
              <p className="mt-2">Mahsulotlar yuklanmoqda...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Hozirda mavjud mahsulotlar yo'q.</p>
              <Button variant="outline-primary">Ko'proq Ma'lumot Uchun Bog'laning</Button>
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
                              <p className="mt-2 small">Rasm Mavjud Emas</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="h5">{product.name}</Card.Title>
                        <Card.Text className="flex-grow-1 text-muted">
                          {product.description && product.description.length > 100 
                            ? `${product.description.substring(0, 100)}...`
                            : product.description || 'Tavsif mavjud emas'
                          }
                        </Card.Text>
                        <div className="mt-auto">
                          <div className="text-center mb-3">
                            <span className="h4 text-dark fw-bold">
                              {formatPrice(product.selling_price)}
                            </span>
                          </div>
                          <Button variant="primary" size="sm" className="w-100">
                            Batafsil Ma'lumot
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Sahifalash */}
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

      {/* Bog'lanish Bo'limi */}
      <section id="contact" className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Biz Bilan Bog'laning</h2>
            <p className="text-muted">Jamoamiz bilan aloqa qiling</p>
          </div>
          
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow h-100">
                <Card.Body className="p-4">
                  <h5 className="mb-4">Aloqa Ma'lumotlari</h5>
                  <Row className="g-4">
                    <Col md={12}>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle p-3 me-3">
                          <Phone size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Telefon</h6>
                          <p className="mb-0 text-muted">+998 (90) 123-45-67</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle p-3 me-3">
                          <Mail size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Elektron Pochta</h6>
                          <p className="mb-0 text-muted">info@biznesim.uz</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle p-3 me-3">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Manzil</h6>
                          <p className="mb-0 text-muted">Toshkent shahar, Yunusobod tumani, 100084</p>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="text-center mt-4 pt-4 border-top">
                    <h6 className="mb-3">Bizni Kuzatib Boring</h6>
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
                    title="Biznes Manzili"
                    width="100%"
                    height="400"
                    frameBorder="0"
                    style={{ border: 0, borderRadius: '0.375rem' }}
                    src="https://maps.google.com/maps?q=Toshkent%2C%20Uzbekistan&t=&z=13&ie=UTF8&iwloc=&output=embed"
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
              <h5>Biznesim</h5>
              <p className="text-white-50">Har Bir Bitimda A'lo Sifat</p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="mb-0 text-white-50">
                © {new Date().getFullYear()} Biznesim. Barcha huquqlar himoyalangan.
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