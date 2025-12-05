import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Image, Pagination, InputGroup } from 'react-bootstrap';
import { Package, Plus, AlertCircle, X, Edit, Trash2, Upload, Camera, Eye, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Product } from '../../types/database.types';
import { useBusinessCalculations } from '../../hooks/useBusinessCalculations';
import { useAuth } from '../../contexts/AuthContext';

interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  image_path: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductWithImages extends Product {
  images: ProductImage[];
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    reorder_level: '',
    unit_of_measure: 'dona',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 0,
    to: 0
  });
  const calculations = useBusinessCalculations();
  const { profile } = useAuth();

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/products?page=${page}&per_page=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Mahsulotlarni olishda xatolik');
      }

      const result = await response.json();
      
      if (result.success) {
        let productsData = [];
        let paginationData = null;

        if (Array.isArray(result.data)) {
          const startIndex = (page - 1) * 20;
          const endIndex = startIndex + 20;
          productsData = result.data.slice(startIndex, endIndex);
          paginationData = {
            current_page: page,
            last_page: Math.ceil(result.data.length / 20),
            per_page: 20,
            total: result.data.length,
            from: startIndex + 1,
            to: Math.min(endIndex, result.data.length)
          };
        } else if (result.data && Array.isArray(result.data.data)) {
          productsData = result.data.data;
          paginationData = result.data;
        } else if (result.data && result.data.products && Array.isArray(result.data.products)) {
          productsData = result.data.products;
          paginationData = result.data.pagination || result.data;
        } else if (Array.isArray(result.data)) {
          const startIndex = (page - 1) * 20;
          const endIndex = startIndex + 20;
          productsData = result.data.slice(startIndex, endIndex);
          paginationData = {
            current_page: page,
            last_page: Math.ceil(result.data.length / 20),
            per_page: 20,
            total: result.data.length,
            from: startIndex + 1,
            to: Math.min(endIndex, result.data.length)
          };
        } else {
          productsData = result.data || [];
          paginationData = result.pagination || result;
        }

        if (!productsData || !Array.isArray(productsData)) {
          setProducts([]);
          setFilteredProducts([]);
          setPagination({
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 0,
            from: 0,
            to: 0
          });
          return;
        }

        const productsWithImages = await Promise.all(
          productsData.map(async (product: Product) => {
            try {
              const imagesResponse = await fetch(`${API_BASE_URL}/api/admin/products/${product.id}/images`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                credentials: 'include'
              });

              if (imagesResponse.ok) {
                const imagesResult = await imagesResponse.json();
                return {
                  ...product,
                  images: imagesResult.success ? imagesResult.data : []
                };
              }
              return {
                ...product,
                images: []
              };
            } catch (error) {
              return {
                ...product,
                images: []
              };
            }
          })
        );
        
        setProducts(productsWithImages);
        setFilteredProducts(productsWithImages);
        
        if (paginationData) {
          const newPagination = {
            current_page: paginationData.current_page || paginationData.page || page,
            last_page: paginationData.last_page || paginationData.total_pages || paginationData.totalPages || 1,
            per_page: paginationData.per_page || paginationData.limit || paginationData.pageSize || 20,
            total: paginationData.total || paginationData.total_count || paginationData.totalCount || 0,
            from: paginationData.from || ((page - 1) * 20) + 1,
            to: paginationData.to || Math.min(page * 20, paginationData.total || 0)
          };
          setPagination(newPagination);
        }
        
      } else {
        throw new Error(result.message || 'Mahsulotlarni olishda xatolik');
      }
    } catch (error) {
      setError('Mahsulotlarni yuklashda xatolik');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(term.toLowerCase()) ||
      product.description?.toLowerCase().includes(term.toLowerCase()) ||
      product.unit_of_measure.toLowerCase().includes(term.toLowerCase()) ||
      product.cost_price.toString().includes(term) ||
      product.selling_price.toString().includes(term) ||
      product.stock_quantity.toString().includes(term)
    );
    
    setFilteredProducts(filtered);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredProducts(products);
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    setSelectedImages(prev => [...prev, ...newImages]);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  const uploadProductImages = async (productId: number | string) => {
    if (selectedImages.length === 0) return;

    setUploadLoading(true);
    try {
      const pid = Number(productId);
      const formData = new FormData();
      selectedImages.forEach((image, index) => {
        formData.append('images[]', image);
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/products/${pid}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        credentials: 'include',
        body: formData
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Rasmlarni yuklashda xatolik');
      }

      return result.data;
    } catch (error: any) {
      throw error;
    } finally {
      setUploadLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Mahsulot nomi majburiy';
    if (!formData.cost_price || Number(formData.cost_price) <= 0) newErrors.cost_price = 'Narx noto\'g\'ri';
    if (!formData.selling_price || Number(formData.selling_price) <= 0) newErrors.selling_price = 'Sotish narxi noto\'g\'ri';
    if (Number(formData.selling_price) <= Number(formData.cost_price)) newErrors.selling_price = 'Sotish narxi tannarxdan katta bo\'lishi kerak';
    if (!formData.stock_quantity || Number(formData.stock_quantity) < 0) newErrors.stock_quantity = 'Qoldiq soni noto\'g\'ri';
    if (!formData.reorder_level || Number(formData.reorder_level) < 0) newErrors.reorder_level = 'Qayta buyurtma darajasi noto\'g\'ri';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          cost_price: Number(formData.cost_price),
          selling_price: Number(formData.selling_price),
          stock_quantity: Number(formData.stock_quantity),
          reorder_level: Number(formData.reorder_level),
          unit_of_measure: formData.unit_of_measure,
          description: formData.description
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const backendErrors: Record<string, string> = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = result.errors[key][0];
          });
          setErrors(backendErrors);
        }
        throw new Error(result.message || 'Mahsulot yaratishda xatolik');
      }

      if (result.success) {
        if (selectedImages.length > 0) {
          await uploadProductImages(result.data.id);
        }

        fetchProducts(pagination.current_page);
        
        handleCloseModal();
        setSuccess('Mahsulot muvaffaqiyatli yaratildi');
      } else {
        throw new Error(result.message || 'Mahsulot yaratishda xatolik');
      }
    } catch (error: any) {
      setError(error.message || 'Mahsulot yaratishda xatolik');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (product: ProductWithImages) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      reorder_level: product.reorder_level.toString(),
      unit_of_measure: product.unit_of_measure,
      description: product.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedProduct) return;

    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          cost_price: Number(formData.cost_price),
          selling_price: Number(formData.selling_price),
          stock_quantity: Number(formData.stock_quantity),
          reorder_level: Number(formData.reorder_level),
          unit_of_measure: formData.unit_of_measure,
          description: formData.description
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const backendErrors: Record<string, string> = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = result.errors[key][0];
          });
          setErrors(backendErrors);
        }
        throw new Error(result.message || 'Mahsulotni yangilashda xatolik');
      }

      if (result.success) {
        if (selectedImages.length > 0) {
          await uploadProductImages(selectedProduct.id);
        }

        fetchProducts(pagination.current_page);
        handleCloseEditModal();
        setSuccess('Mahsulot muvaffaqiyatli yangilandi');
      } else {
        throw new Error(result.message || 'Mahsulotni yangilashda xatolik');
      }
    } catch (error: any) {
      setError(error.message || 'Mahsulotni yangilashda xatolik');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${selectedProduct.id}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Rasmni o\'chirishda xatolik');
      }

      if (result.success) {
        setSelectedProduct(prev => prev ? {
          ...prev,
          images: prev.images.filter(img => img.id !== imageId)
        } : null);
        
        setProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, images: p.images.filter(img => img.id !== imageId) }
            : p
        ));
        setFilteredProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, images: p.images.filter(img => img.id !== imageId) }
            : p
        ));
        
        setSuccess('Rasm muvaffaqiyatli o\'chirildi');
      } else {
        throw new Error(result.message || 'Rasmni o\'chirishda xatolik');
      }
    } catch (error: any) {
      setError(error.message || 'Rasmni o\'chirishda xatolik');
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${selectedProduct.id}/images/${imageId}/set-primary`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Asosiy rasmni o\'rnatishda xatolik');
      }

      if (result.success) {
        const updatedImages = selectedProduct.images.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }));

        setSelectedProduct(prev => prev ? { ...prev, images: updatedImages } : null);
        setProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, images: updatedImages }
            : p
        ));
        setFilteredProducts(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, images: updatedImages }
            : p
        ));
        
        setSuccess('Asosiy rasm muvaffaqiyatli o\'rnatildi');
      } else {
        throw new Error(result.message || 'Asosiy rasmni o\'rnatishda xatolik');
      }
    } catch (error: any) {
      setError(error.message || 'Asosiy rasmni o\'rnatishda xatolik');
    }
  };

  const handleViewImages = (product: ProductWithImages) => {
    setSelectedProduct(product);
    setShowImageModal(true);
  };

  const handleDelete = (product: ProductWithImages) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Mahsulotni o\'chirishda xatolik');
      }

      if (result.success) {
        fetchProducts(pagination.current_page);
        setShowDeleteModal(false);
        setSelectedProduct(null);
        setSuccess('Mahsulot muvaffaqiyatli o\'chirildi');
      } else {
        throw new Error(result.message || 'Mahsulotni o\'chirishda xatolik');
      }
    } catch (error: any) {
      setError(error.message || 'Mahsulotni o\'chirishda xatolik');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setErrors({});
    setError('');
    setSelectedImages([]);
    setImagePreviews([]);
    setFormData({
      name: '',
      cost_price: '',
      selling_price: '',
      stock_quantity: '',
      reorder_level: '',
      unit_of_measure: 'dona',
      description: ''
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setErrors({});
    setError('');
    setSelectedProduct(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setFormData({
      name: '',
      cost_price: '',
      selling_price: '',
      stock_quantity: '',
      reorder_level: '',
      unit_of_measure: 'dona',
      description: ''
    });
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProduct(null);
    setError('');
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedProduct(null);
  };

  const getPrimaryImage = (product: ProductWithImages) => {
    const primaryImage = product.images.find(img => img.is_primary);
    return primaryImage || product.images[0];
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.last_page && page !== pagination.current_page) {
      fetchProducts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (pagination.last_page <= 1) {
      return null;
    }

    const items = [];
    const totalPages = pagination.last_page;

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(pagination.current_page - 1)}
        disabled={pagination.current_page === 1}
      >
        <ChevronLeft size={14} />
      </Pagination.Prev>
    );

    items.push(
      <Pagination.Item
        key={1}
        active={1 === pagination.current_page}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );

    let startPage = Math.max(2, pagination.current_page - 1);
    let endPage = Math.min(totalPages - 1, pagination.current_page + 1);

    if (startPage > 2) {
      items.push(<Pagination.Ellipsis key="start-ellipsis" />);
    }

    for (let page = startPage; page <= endPage; page++) {
      if (page > 1 && page < totalPages) {
        items.push(
          <Pagination.Item
            key={page}
            active={page === pagination.current_page}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Pagination.Item>
        );
      }
    }

    if (endPage < totalPages - 1) {
      items.push(<Pagination.Ellipsis key="end-ellipsis" />);
    }

    if (totalPages > 1) {
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === pagination.current_page}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(pagination.current_page + 1)}
        disabled={pagination.current_page === totalPages}
      >
        <ChevronRight size={14} />
      </Pagination.Next>
    );

    return (
      <Card.Footer className="bg-white py-2">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Sahifa {pagination.current_page} / {pagination.last_page} 
            {pagination.total > 0 && ` (Jami: ${pagination.total} mahsulot)`}
            {pagination.from > 0 && pagination.to > 0 && (
              <span className="ms-2">
                ({pagination.from}-{pagination.to} ko'rsatilmoqda)
              </span>
            )}
          </small>
          <Pagination className="mb-0" size="sm">
            {items}
          </Pagination>
        </div>
      </Card.Footer>
    );
  };

  const totalInventoryValue = filteredProducts.reduce(
    (sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price),
    0
  );
  const lowStockCount = filteredProducts.filter(p => Number(p.stock_quantity) <= Number(p.reorder_level)).length;
  const activeProductsCount = filteredProducts.filter(p => p.is_active).length;

  const formatInventoryValue = (value: number) => {
    return calculations.formatCurrency(value).replace('$', '') + ' so\'m';
  };

  if (loading) {
    return (
      <Container fluid className="px-2">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yuklanmoqda...</span>
          </div>
          <p className="mt-2 text-muted small">Mahsulotlar yuklanmoqda...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="fade-in px-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-1">Mahsulotlar</h4>
          <p className="text-muted small mb-0">Mahsulotlaringiz katalogi</p>
        </div>
        <div className="d-flex gap-1">
          <div className="d-none d-md-block btn-group btn-group-sm" role="group">
            <input
              type="radio"
              className="btn-check"
              name="viewMode"
              id="cardsView"
              checked={viewMode === 'cards'}
              onChange={() => setViewMode('cards')}
            />
            <label className="btn btn-outline-primary" htmlFor="cardsView">
              <Package size={12} />
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
              <Table size={12} />
            </label>
          </div>
          
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus size={14} className="me-1" />
            <span className="d-none d-sm-inline">Qo'shish</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3 small">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-3 small">
          {success}
        </Alert>
      )}

      <Card className="mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={6}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Mahsulotlarni qidirish..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleClearSearch}
                    title="Tozalash"
                  >
                    <X size={14} />
                  </Button>
                )}
              </InputGroup>
              <Form.Text className="text-muted small">
                Nomi, tavsifi, narxi yoki miqdoriga qarab qidirish
              </Form.Text>
            </Col>
            <Col md={6} className="text-md-end">
              <small className="text-muted">
                {searchTerm ? (
                  <>
                    <strong>{filteredProducts.length}</strong> ta mahsulot topildi
                    {filteredProducts.length !== products.length && (
                      <span className="ms-2">
                        (Jami: {products.length})
                      </span>
                    )}
                  </>
                ) : (
                  <>{products.length} ta mahsulot</>
                )}
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-2 mb-3">
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-1 rounded me-2">
                  <Package size={14} className="text-primary" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{searchTerm ? filteredProducts.length : pagination.total}</h6>
                  <small className="text-muted">{searchTerm ? 'Topildi' : 'Jami'}</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-1 rounded me-2">
                  <Package size={14} className="text-success" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{formatInventoryValue(totalInventoryValue)}</h6>
                  <small className="text-muted">Inventar</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 p-1 rounded me-2">
                  <AlertCircle size={14} className="text-danger" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{lowStockCount}</h6>
                  <small className="text-muted">Kam Qolgan</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-1 rounded me-2">
                  <Package size={14} className="text-info" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{activeProductsCount}</h6>
                  <small className="text-muted">Faol</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header className="bg-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-semibold small">
              {searchTerm ? 'Qidiruv Natijalari' : 'Mahsulotlar'} ({searchTerm ? filteredProducts.length : pagination.total})
              {!searchTerm && pagination.total > 0 && pagination.last_page > 1 && (
                <span className="text-muted ms-2" style={{ fontSize: '0.7rem' }}>
                  ({pagination.from}-{pagination.to} ko'rsatilmoqda)
                </span>
              )}
            </h6>
            <div className="d-none d-md-flex align-items-center gap-2">
              <small className="text-muted">
                {viewMode === 'cards' ? 'Kartalar' : 'Jadval'} ko'rinishi
              </small>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-3">
              <Package size={24} className="text-muted mb-1" />
              <p className="text-muted small mb-2">
                {searchTerm ? 'Qidiruv bo\'yicha hech narsa topilmadi' : 'Mahsulotlar topilmadi'}
              </p>
              {searchTerm ? (
                <Button variant="outline-primary" size="sm" onClick={handleClearSearch}>
                  Qidiruvni tozalash
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                  <Plus size={12} className="me-1" />
                  Mahsulot Qo'shish
                </Button>
              )}
            </div>
          ) : viewMode === 'cards' || window.innerWidth < 768 ? (
            <div className="list-group list-group-flush">
              {filteredProducts.map((product) => {
                const isLowStock = Number(product.stock_quantity) <= Number(product.reorder_level);
                const primaryImage = getPrimaryImage(product);
                
                return (
                  <div key={product.id} className="list-group-item p-2 border-bottom">
                    <div className="d-flex align-items-start gap-2">
                      <div 
                        className="bg-light rounded d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                        onClick={() => handleViewImages(product)}
                      >
                        {primaryImage ? (
                          <Image 
                            src={`${API_BASE_URL}/storage/${primaryImage.image_path}`}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            rounded
                            className="border"
                          />
                        ) : (
                          <Camera size={14} className="text-muted" />
                        )}
                      </div>

                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h6 className="fw-semibold mb-0 small text-truncate me-2" style={{ maxWidth: '120px' }}>
                            {product.name}
                          </h6>
                          <Badge bg={product.is_active ? 'success' : 'danger'} className="fs-8">
                            {product.is_active ? 'Faol' : 'Nofaol'}
                          </Badge>
                        </div>
                        
                        <div className="d-flex gap-2 mb-1">
                          <small className="text-muted">
                            T: {calculations.formatCurrency(Number(product.cost_price)).replace('$', '')} so'm
                          </small>
                          <small className="text-muted">
                            S: {calculations.formatCurrency(Number(product.selling_price)).replace('$', '')} so'm
                          </small>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <Badge bg={isLowStock ? 'danger' : 'success'} className="fs-8">
                            {Number(product.stock_quantity)} {product.unit_of_measure}
                          </Badge>
                          
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              className="p-0"
                              style={{ width: '24px', height: '24px' }}
                              onClick={() => handleViewImages(product)}
                              title="Rasmlar"
                            >
                              <Camera size={10} />
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="p-0"
                              style={{ width: '24px', height: '24px' }}
                              onClick={() => handleEdit(product)}
                              title="Tahrirlash"
                            >
                              <Edit size={10} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="p-0"
                              style={{ width: '24px', height: '24px' }}
                              onClick={() => handleDelete(product)}
                              title="O'chirish"
                            >
                              <Trash2 size={10} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 small" style={{ fontSize: '0.75rem' }}>
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th style={{ width: '25%' }}>Nomi</th>
                    <th style={{ width: '12%' }}>Tannarx</th>
                    <th style={{ width: '12%' }}>Narx</th>
                    <th style={{ width: '10%' }}>Qoldiq</th>
                    <th style={{ width: '8%' }}>Holati</th>
                    <th style={{ width: '13%' }} className="text-center">Harakatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const isLowStock = Number(product.stock_quantity) <= Number(product.reorder_level);
                    const primaryImage = getPrimaryImage(product);
                    
                    return (
                      <tr key={product.id} className="align-middle">
                        <td>
                          <div 
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                            onClick={() => handleViewImages(product)}
                          >
                            {primaryImage ? (
                              <Image 
                                src={`${API_BASE_URL}/storage/${primaryImage.image_path}`}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                rounded
                                className="border"
                              />
                            ) : (
                              <Camera size={12} className="text-muted" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '0.7rem' }}>{product.name}</div>
                            <small className="text-muted" style={{ fontSize: '0.65rem' }}>{product.unit_of_measure}</small>
                          </div>
                        </td>
                        <td>
                          <small>{calculations.formatCurrency(Number(product.cost_price)).replace('$', '')} so'm</small>
                        </td>
                        <td>
                          <strong className="text-success">{calculations.formatCurrency(Number(product.selling_price)).replace('$', '')} so'm</strong>
                        </td>
                        <td>
                          <Badge bg={isLowStock ? 'danger' : 'success'} className="fs-8">
                            {Number(product.stock_quantity)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={product.is_active ? 'success' : 'danger'} className="fs-8">
                            {product.is_active ? 'Faol' : 'Nofaol'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              className="p-0"
                              style={{ width: '22px', height: '22px' }}
                              onClick={() => handleViewImages(product)}
                              title="Rasmlar"
                            >
                              <Camera size={10} />
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="p-0"
                              style={{ width: '22px', height: '22px' }}
                              onClick={() => handleEdit(product)}
                              title="Tahrirlash"
                            >
                              <Edit size={10} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="p-0"
                              style={{ width: '22px', height: '22px' }}
                              onClick={() => handleDelete(product)}
                              title="O'chirish"
                            >
                              <Trash2 size={10} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {!searchTerm && renderPagination()}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered scrollable>
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="h6">Yangi Mahsulot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="py-2">
            {error && (
              <Alert variant="danger" className="small py-2">
                {error}
              </Alert>
            )}
            
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Mahsulot Nomi *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                isInvalid={!!errors.name}
                placeholder="Mahsulot nomi"
                size="sm"
              />
              <Form.Control.Feedback type="invalid" className="small">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Tannarx *</Form.Label>
                  <Form.Control
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    isInvalid={!!errors.cost_price}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.cost_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Sotish Narxi *</Form.Label>
                  <Form.Control
                    type="number"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    isInvalid={!!errors.selling_price}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.selling_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Qoldiq *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    isInvalid={!!errors.stock_quantity}
                    placeholder="0"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.stock_quantity}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Buyurtma Darajasi *</Form.Label>
                  <Form.Control
                    type="number"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleInputChange}
                    isInvalid={!!errors.reorder_level}
                    placeholder="0"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.reorder_level}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Oʻlchov Birligi</Form.Label>
              <Form.Select
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleInputChange}
                size="sm"
              >
                <option value="dona">Dona</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Litr</option>
                <option value="ml">Millilitr</option>
                <option value="m">Metr</option>
                <option value="cm">Santimetr</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Rasmlar</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                size="sm"
              />
              <Form.Text className="text-muted small">
                Bir nechta rasm yuklashingiz mumkin
              </Form.Text>
            </Form.Group>

            {imagePreviews.length > 0 && (
              <div className="mb-2">
                <p className="text-muted small mb-2">Tanlangan rasmlar:</p>
                <div className="d-flex flex-wrap gap-1">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="position-relative" style={{ width: '50px', height: '50px' }}>
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        rounded
                        className="border"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 p-0"
                        style={{ width: '16px', height: '16px', transform: 'translate(30%, -30%)' }}
                        onClick={() => removeSelectedImage(index)}
                      >
                        <X size={8} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Tavsif</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mahsulot tavsifi"
                size="sm"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={handleCloseModal} disabled={submitLoading || uploadLoading}>
              Bekor Qilish
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitLoading || uploadLoading}>
              {submitLoading || uploadLoading ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg" centered scrollable>
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="h6">Tahrirlash - {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body className="py-2">
            {error && (
              <Alert variant="danger" className="small py-2">
                {error}
              </Alert>
            )}
            
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Mahsulot Nomi *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                isInvalid={!!errors.name}
                placeholder="Mahsulot nomi"
                size="sm"
              />
              <Form.Control.Feedback type="invalid" className="small">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Tannarx *</Form.Label>
                  <Form.Control
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    isInvalid={!!errors.cost_price}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.cost_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Sotish Narxi *</Form.Label>
                  <Form.Control
                    type="number"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    isInvalid={!!errors.selling_price}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.selling_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Qoldiq *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    isInvalid={!!errors.stock_quantity}
                    placeholder="0"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.stock_quantity}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Buyurtma Darajasi *</Form.Label>
                  <Form.Control
                    type="number"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleInputChange}
                    isInvalid={!!errors.reorder_level}
                    placeholder="0"
                    min="0"
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid" className="small">
                    {errors.reorder_level}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Oʻlchov Birligi</Form.Label>
              <Form.Select
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleInputChange}
                size="sm"
              >
                <option value="dona">Dona</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Litr</option>
                <option value="ml">Millilitr</option>
                <option value="m">Metr</option>
                <option value="cm">Santimetr</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Yangi Rasmlar</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                size="sm"
              />
              <Form.Text className="text-muted small">
                Yangi rasmlar qo'shishingiz mumkin
              </Form.Text>
            </Form.Group>

            {imagePreviews.length > 0 && (
              <div className="mb-2">
                <p className="text-muted small mb-2">Yangi rasmlar:</p>
                <div className="d-flex flex-wrap gap-1">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="position-relative" style={{ width: '50px', height: '50px' }}>
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        rounded
                        className="border"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 p-0"
                        style={{ width: '16px', height: '16px', transform: 'translate(30%, -30%)' }}
                        onClick={() => removeSelectedImage(index)}
                      >
                        <X size={8} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Tavsif</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mahsulot tavsifi"
                size="sm"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={handleCloseEditModal} disabled={submitLoading || uploadLoading}>
              Bekor Qilish
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitLoading || uploadLoading}>
              {submitLoading || uploadLoading ? 'Yangilanmoqda...' : 'Yangilash'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showImageModal} onHide={handleCloseImageModal} size="lg" centered scrollable>
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="h6">Rasmlar - {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
          {selectedProduct && (
            <div>
              {selectedProduct.images.length === 0 ? (
                <div className="text-center py-3">
                  <Camera size={24} className="text-muted mb-1" />
                  <p className="text-muted small">Hech qanday rasm mavjud emas</p>
                </div>
              ) : (
                <Row>
                  {selectedProduct.images.map((image) => (
                    <Col xs={6} sm={4} key={image.id} className="mb-2">
                      <Card className="h-100">
                        <Card.Body className="p-2">
                          <Image
                            src={`${API_BASE_URL}/storage/${image.image_path}`}
                            alt={selectedProduct.name}
                            fluid
                            rounded
                            style={{ height: '100px', width: '100%', objectFit: 'cover' }}
                            className="border"
                          />
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <Badge bg={image.is_primary ? 'primary' : 'secondary'} className="fs-8">
                              {image.is_primary ? 'Asosiy' : 'Qo`shimcha'}
                            </Badge>
                            <div className="d-flex gap-1">
                              {!image.is_primary && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="p-0"
                                  style={{ width: '20px', height: '20px' }}
                                  onClick={() => handleSetPrimaryImage(image.id)}
                                  title="Asosiy qilish"
                                >
                                  <small style={{ fontSize: '8px' }}>A</small>
                                </Button>
                              )}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="p-0"
                                style={{ width: '20px', height: '20px' }}
                                onClick={() => handleDeleteImage(image.id)}
                                title="O'chirish"
                              >
                                <Trash2 size={10} />
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button variant="secondary" size="sm" onClick={handleCloseImageModal}>
            Yopish
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="h6">O'chirish</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
          {selectedProduct && (
            <p className="small mb-0">
              <strong>"{selectedProduct.name}"</strong> mahsulotini o'chirishni xohlaysizmi? 
              Bu amalni ortga qaytarib bo'lmaydi.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button variant="outline-secondary" size="sm" onClick={handleCloseDeleteModal} disabled={submitLoading}>
            Bekor Qilish
          </Button>
          <Button variant="danger" size="sm" onClick={confirmDelete} disabled={submitLoading}>
            {submitLoading ? 'O\'chirilmoqda...' : 'O\'chirish'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>  
  );      
};