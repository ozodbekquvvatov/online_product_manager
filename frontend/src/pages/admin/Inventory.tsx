import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Form, 
  Modal, 
  Alert, 
  Pagination 
} from 'react-bootstrap';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ShoppingCart,
  Warehouse,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useBusinessCalculations } from '../../hooks/useBusinessCalculations';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  cost_price: number;
  selling_price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_restocked: string;
  supplier: string;
  stock_quantity: number;
  reorder_level: number;
  unit_of_measure: string;
  is_active: boolean;
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalCategories: number;
  inventoryTurnover: number;
  stockValue: number;
}

interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  type: 'in' | 'out';
  quantity: number;
  reason: 'sale' | 'restock' | 'return' | 'adjustment' | 'damage';
  date: string;
  user: string;
}

interface CategorySummary {
  category: string;
  productCount: number;
  totalValue: number;
  lowStockCount: number;
}

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalCategories: 0,
    inventoryTurnover: 0,
    stockValue: 0
  });
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [restockQuantity, setRestockQuantity] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const calculations = useBusinessCalculations();

  const API_BASE_URL = 'http://127.0.0.1:8000';

  // Format currency without dollar sign
  const formatCurrency = (amount: number) => {
    return calculations.formatCurrency(amount);
  };

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [productsResponse, statsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
          withCredentials: true
        }),
        axios.get(`${API_BASE_URL}/api/admin/inventory/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
          withCredentials: true
        })
      ]);

      if (productsResponse.data.success) {
        const productsData = productsResponse.data.data.map((product: any) => ({
          ...product,
          current_stock: product.stock_quantity,
          min_stock: product.reorder_level,
          max_stock: product.reorder_level * 2,
          status: getStockStatus(product.stock_quantity, product.reorder_level),
          category: 'General',
          supplier: 'Standard Supplier',
          last_restocked: product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'Never'
        }));
        setProducts(productsData);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      generateMockData(productsResponse.data.data);

    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (productsData: any[]) => {
    const mockMovements: StockMovement[] = [
      {
        id: 1,
        product_id: 1,
        product_name: productsData[0]?.name || 'Product 1',
        type: 'in',
        quantity: 50,
        reason: 'restock',
        date: new Date().toISOString().split('T')[0],
        user: 'Admin User'
      },
      {
        id: 2,
        product_id: 2,
        product_name: productsData[1]?.name || 'Product 2',
        type: 'out',
        quantity: 10,
        reason: 'sale',
        date: new Date().toISOString().split('T')[0],
        user: 'Admin User'
      }
    ];
    setStockMovements(mockMovements);

    const mockCategories: CategorySummary[] = [
      {
        category: 'General',
        productCount: productsData.length,
        totalValue: productsData.reduce((sum: number, product: any) => sum + (product.cost_price * product.stock_quantity), 0),
        lowStockCount: productsData.filter((product: any) => product.stock_quantity <= product.reorder_level).length
      }
    ];
    setCategories(mockCategories);
  };

  const getStockStatus = (currentStock: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock) return 'low_stock';
    return 'in_stock';
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Generate pagination items
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
        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={14} />
      </Pagination.Prev>
    );

    // First page and ellipsis
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => paginate(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={14} />
      </Pagination.Next>
    );

    return items;
  };

  // Render pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-between align-items-center mt-3 px-3 py-2 border-top">
        <small className="text-muted">
          Showing: {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length}
        </small>
        <Pagination className="mb-0">
          {renderPaginationItems()}
        </Pagination>
      </div>
    );
  };

  const handleRestock = async () => {
    if (!selectedProduct || !restockQuantity || parseInt(restockQuantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/products/${selectedProduct.id}/stock`,
        {
          stock_quantity: selectedProduct.current_stock + parseInt(restockQuantity)
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setSuccess(`${selectedProduct.name} restocked successfully with ${restockQuantity} units`);
        setRestockQuantity('');
        setShowRestockModal(false);
        fetchInventoryData();
        setCurrentPage(1); // Reset to first page after restock
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      setError('Failed to restock product');
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    variant?: string;
  }> = ({ title, value, subtitle, icon, variant = 'primary' }) => (
    <Card className="dashboard-card h-100">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-muted mb-1 small">{title}</p>
            <h6 className="mb-1 fw-bold">{value}</h6>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
          <div className={`bg-${variant} bg-opacity-10 p-2 rounded`}>
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const getStockStatusBadge = (status: string) => {
    const variants = {
      in_stock: 'success',
      low_stock: 'warning',
      out_of_stock: 'danger'
    };
    
    const icons = {
      in_stock: <CheckCircle size={12} className="me-1" />,
      low_stock: <AlertTriangle size={12} className="me-1" />,
      out_of_stock: <Package size={12} className="me-1" />
    };

    const labels = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock'
    };

    return (
      <Badge bg={variants[status as keyof typeof variants]} className="d-flex align-items-center fs-7">
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleAddStock = (product: Product) => {
    setSelectedProduct(product);
    setRestockQuantity('');
    setShowRestockModal(true);
  };

  const lowStockProducts = products.filter(product => product.status === 'low_stock');
  const outOfStockProducts = products.filter(product => product.status === 'out_of_stock');

  const totalInventoryValue = products.reduce((sum, product) => 
    sum + (product.cost_price * product.current_stock), 0
  );

  if (loading) {
    return (
      <Container fluid className="px-3 px-sm-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="fade-in px-3 px-sm-4 py-3">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">Inventory</h4>
              <p className="text-muted mb-0">Track your product stock levels</p>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              {/* View Mode Toggle */}
              <div className="btn-group btn-group-sm" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="viewMode"
                  id="cardsView"
                  checked={viewMode === 'cards'}
                  onChange={() => setViewMode('cards')}
                />
                <label className="btn btn-outline-primary" htmlFor="cardsView">
                  <Package size={14} />
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="viewMode"
                  id="tableView"
                  checked={viewMode === 'table'}
                  onChange={() => setViewMode('table')}
                />
                <label className="btn btn-outline-primary" htmlFor="tableView">
                  <Table size={14} />
                </label>
              </div>
              
              <Button variant="outline-primary" size="sm" onClick={fetchInventoryData}>
                <RefreshCw size={16} />
              </Button>
              <Button variant="outline-primary" size="sm">
                <Download size={16} />
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-4">
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Products"
            value={products.length}
            subtitle={`${categories.length} categories`}
            icon={<Package className="text-primary" />}
            variant="primary"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <MetricCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            subtitle="Total stock value"
            icon={<TrendingUp className="text-success" />}
            variant="success"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="dashboard-card h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Low Stock</p>
                  <h6 className="mb-1 fw-bold">{lowStockProducts.length}</h6>
                  <small className="text-muted">Need reorder</small>
                </div>
                <div className={`bg-${lowStockProducts.length > 0 ? 'warning' : 'success'} bg-opacity-10 p-2 rounded`}>
                  {lowStockProducts.length > 0 ? (
                    <AlertTriangle size={20} className="text-warning" />
                  ) : (
                    <CheckCircle size={20} className="text-success" />
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="dashboard-card h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Out of Stock</p>
                  <h6 className="mb-1 fw-bold">{outOfStockProducts.length}</h6>
                  <small className="text-muted">Not available</small>
                </div>
                <div className={`bg-${outOfStockProducts.length > 0 ? 'danger' : 'success'} bg-opacity-10 p-2 rounded`}>
                  {outOfStockProducts.length > 0 ? (
                    <Package size={20} className="text-danger" />
                  ) : (
                    <CheckCircle size={20} className="text-success" />
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters - Full Width */}
      <Card className="mb-3">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Label className="small fw-semibold">Search</Form.Label>
              <div className="position-relative">
                <Search size={16} className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                <Form.Control
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="ps-5"
                  size="sm"
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Category</Form.Label>
              <Form.Select 
                size="sm"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
              >
                <option value="all">All Categories</option>
                {Array.from(new Set(products.map(p => p.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Status</Form.Label>
              <Form.Select 
                size="sm"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}
              >
                <option value="all">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" className="w-100">
                  <Filter size={14} className="me-1" />
                  Filter
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="mb-3 border-warning">
          <Card.Header className="bg-warning bg-opacity-10 py-2">
            <div className="d-flex align-items-center">
              <AlertTriangle size={16} className="text-warning me-2" />
              <h6 className="mb-0 fw-semibold text-warning">Low Stock Alerts</h6>
              <Badge bg="warning" className="ms-2">{lowStockProducts.length}</Badge>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="list-group list-group-flush">
              {lowStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">{product.name}</div>
                    <small className="text-muted">
                      {product.current_stock} / {product.min_stock} {product.unit_of_measure}
                    </small>
                  </div>
                  <Button size="sm" variant="outline-warning" className="ms-2" onClick={() => handleAddStock(product)}>
                    <Plus size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Products Table - Full Width */}
      <Card>
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-semibold">Products List ({filteredProducts.length})</h6>
            <div className="d-flex gap-2 align-items-center">
              <small className="text-muted">
                {viewMode === 'cards' ? 'Cards' : 'Table'} view
              </small>
              <Badge bg="light" text="dark" className="fs-7">
                Page: {currentPage}/{totalPages}
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <Package size={48} className="text-muted mb-3" />
              <p className="text-muted">No products found</p>
              <Button variant="outline-primary" size="sm">
                Add New Product
              </Button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Mobile Cards View */
            <div className="list-group list-group-flush">
              {currentProducts.map((product) => (
                <div key={product.id} className="list-group-item p-2 border-bottom">
                  <div className="d-flex align-items-start gap-2">
                    <div className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center flex-shrink-0" 
                         style={{ width: '40px', height: '40px' }}>
                      <Package size={16} className="text-primary" />
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="fw-semibold mb-0 small text-truncate" style={{ maxWidth: '120px' }}>
                          {product.name}
                        </h6>
                        {getStockStatusBadge(product.status)}
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted d-block">
                          SKU: {product.sku || 'Not available'}
                        </small>
                      </div>

                      <div className="row g-1 mb-2">
                        <div className="col-6">
                          <small className="text-muted d-block">Stock</small>
                          <strong className="small">{product.current_stock} {product.unit_of_measure}</strong>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Price</small>
                          <strong className="small text-success">{formatCurrency(product.selling_price)}</strong>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Value: {formatCurrency(product.cost_price * product.current_stock)}
                        </small>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            className="p-1"
                            onClick={() => handleViewProduct(product)}
                            title="View"
                          >
                            <Eye size={12} />
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            className="p-1"
                            onClick={() => handleAddStock(product)}
                            title="Restock"
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table View - Full Width */
            <>
              <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                <Table hover className="mb-0" style={{ minWidth: '1000px' }}>
                  <thead className="bg-light position-sticky top-0">
                    <tr>
                      <th style={{ width: '25%' }}>Product Name</th>
                      <th style={{ width: '10%' }}>SKU</th>
                      <th style={{ width: '10%' }}>Category</th>
                      <th style={{ width: '8%' }}>Stock</th>
                      <th style={{ width: '8%' }}>Min. Stock</th>
                      <th style={{ width: '10%' }}>Status</th>
                      <th style={{ width: '10%' }}>Selling Price</th>
                      <th style={{ width: '12%' }}>Stock Value</th>
                      <th style={{ width: '7%' }} className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr key={product.id} className="align-middle">
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center me-2" 
                                 style={{ width: '32px', height: '32px' }}>
                              <Package size={14} className="text-primary" />
                            </div>
                            <div>
                              <div className="fw-semibold small">{product.name}</div>
                              <small className="text-muted">{product.supplier}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="small bg-light px-1 rounded">{product.sku || '-'}</code>
                        </td>
                        <td>
                          <Badge bg="outline-secondary" className="text-dark border small">
                            {product.category}
                          </Badge>
                        </td>
                        <td>
                          <div>
                            <strong className="small">{product.current_stock}</strong>
                            <small className="text-muted d-block">{product.unit_of_measure}</small>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">{product.min_stock}</small>
                        </td>
                        <td>{getStockStatusBadge(product.status)}</td>
                        <td className="text-success fw-semibold">{formatCurrency(product.selling_price)}</td>
                        <td className="fw-semibold">{formatCurrency(product.cost_price * product.current_stock)}</td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="p-1"
                              onClick={() => handleViewProduct(product)}
                              title="View"
                            >
                              <Eye size={12} />
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              className="p-1"
                              onClick={() => handleAddStock(product)}
                              title="Restock"
                              disabled={product.status === 'out_of_stock'}
                            >
                              <Plus size={12} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {renderPagination()}
            </>
          )}
        </Card.Body>
        {/* Add pagination for cards view too */}
        {viewMode === 'cards' && filteredProducts.length > itemsPerPage && renderPagination()}
      </Card>

      {/* Product Details Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)} centered scrollable size="lg">
        <Modal.Header closeButton className="py-3">
          <Modal.Title className="h6">{selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {selectedProduct && (
            <Row className="g-3">
              <Col md={6}>
                <h6 className="text-muted border-bottom pb-2 small">Product Information</h6>
                <div className="mb-2">
                  <small className="text-muted d-block">Name</small>
                  <strong>{selectedProduct.name}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">SKU</small>
                  <code className="small">{selectedProduct.sku || 'Not available'}</code>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Category</small>
                  <strong className="small">{selectedProduct.category}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Supplier</small>
                  <strong className="small">{selectedProduct.supplier}</strong>
                </div>
              </Col>
              <Col md={6}>
                <h6 className="text-muted border-bottom pb-2 small">Stock Information</h6>
                <div className="mb-2">
                  <small className="text-muted d-block">Current Stock</small>
                  <strong className="small">{selectedProduct.current_stock} {selectedProduct.unit_of_measure}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Minimum Stock</small>
                  <strong className="small">{selectedProduct.min_stock} {selectedProduct.unit_of_measure}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Cost Price</small>
                  <strong className="small">{formatCurrency(selectedProduct.cost_price)}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Selling Price</small>
                  <strong className="small text-success">{formatCurrency(selectedProduct.selling_price)}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Profit Margin</small>
                  <strong className="small text-primary">
                    {calculations.formatPercentage(
                      ((selectedProduct.selling_price - selectedProduct.cost_price) / selectedProduct.selling_price) * 100
                    )}
                  </strong>
                </div>
                <div>
                  <small className="text-muted d-block">Stock Status</small>
                  {getStockStatusBadge(selectedProduct.status)}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="py-3">
          <Button variant="secondary" size="sm" onClick={() => setShowProductModal(false)}>
            Close
          </Button>
          <Button variant="success" size="sm" onClick={() => handleAddStock(selectedProduct!)}>
            <Plus size={14} className="me-1" />
            Add Stock
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Restock Modal */}
      <Modal show={showRestockModal} onHide={() => setShowRestockModal(false)} centered>
        <Modal.Header closeButton className="py-3">
          <Modal.Title className="h6">Restock Product</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {selectedProduct && (
            <>
              <div className="mb-3">
                <small className="text-muted d-block">Product</small>
                <strong className="small">{selectedProduct.name}</strong>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Current Stock</small>
                <strong className="small">{selectedProduct.current_stock} {selectedProduct.unit_of_measure}</strong>
              </div>
              <Form.Group>
                <Form.Label className="small fw-semibold">Quantity to Add *</Form.Label>
                <Form.Control
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  size="sm"
                />
              </Form.Group>
              {restockQuantity && (
                <div className="mt-3 p-2 bg-light rounded">
                  <small className="text-muted d-block">New Stock Level:</small>
                  <strong className="text-success small">
                    {selectedProduct.current_stock + parseInt(restockQuantity)} {selectedProduct.unit_of_measure}
                  </strong>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="py-3">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowRestockModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleRestock} disabled={!restockQuantity}>
            <Plus size={14} className="me-1" />
            Restock
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};