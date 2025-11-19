import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Dropdown } from 'react-bootstrap';
import { Users, Plus, Eye, Edit, Trash2, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';
import { Employee } from '../../types/database.types';
import { useBusinessCalculations } from '../../hooks/useBusinessCalculations';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    position: '',
    department: '',
    base_salary: '',
    hire_date: '',
    date_of_birth: '',
    address: '',
    employment_type: 'full_time',
    work_hours_per_day: '8',
    work_shift: 'day',
    is_active: true
  });

  const calculations = useBusinessCalculations();

  const formatCurrencyUZS = (amount: number): string => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        throw new Error('Autentifikatsiya tokeni topilmadi. Iltimos, qaytadan kiring.');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/employees`, {      
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        throw new Error('Autentifikatsiya muvaffaqiyatsiz. Iltimos, qaytadan kiring.');
      } else if (response.status === 403) {
        throw new Error('Kirish taqiqlangan. Ruxsatlaringizni tekshiring.');
      } else if (response.status === 404) {
        throw new Error('Xodimlar endpointi topilmadi (404). Backend routelarini tekshiring.');
      } else if (!response.ok) {
        throw new Error(`Server xatosi: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setEmployees(result.data);
      } else if (Array.isArray(result)) {
        setEmployees(result);
      } else {
        setEmployees([]);
      }
    } catch (error: any) {
      setError(error.message || 'Xodimlarni yuklash muvaffaqiyatsiz');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'Ism maydoni to\'ldirilishi shart';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Familiya maydoni to\'ldirilishi shart';
    }

    if (!formData.position.trim()) {
      errors.position = 'Lavozim maydoni to\'ldirilishi shart';
    }

    if (!formData.department.trim()) {
      errors.department = 'Bo\'lim maydoni to\'ldirilishi shart';
    }

    if (!formData.base_salary || Number(formData.base_salary) <= 0) {
      errors.base_salary = 'Maosh 0 dan katta bo\'lishi kerak';
    }

    if (!formData.work_hours_per_day || Number(formData.work_hours_per_day) < 1 || Number(formData.work_hours_per_day) > 24) {
      errors.work_hours_per_day = 'Ish soati 1 dan 24 gacha bo\'lishi kerak';
    }

    if (formData.hire_date && new Date(formData.hire_date) > new Date()) {
      errors.hire_date = 'Ishga qabul sanasi kelajakda bo\'lishi mumkin emas';
    }

    if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
      errors.date_of_birth = 'Tug\'ilgan sanasi kelajakda bo\'lishi mumkin emas';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      base_salary: employee.base_salary?.toString() || '',
      hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
      date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
      address: employee.address || '',
      employment_type: (employee as any).employment_type || 'full_time',
      work_hours_per_day: (employee as any).work_hours_per_day?.toString() || '8',
      work_shift: (employee as any).work_shift || 'day',
      is_active: employee.is_active ?? true
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      position: '',
      department: '',
      base_salary: '',
      hire_date: '',
      date_of_birth: '',
      address: '',
      employment_type: 'full_time',
      work_hours_per_day: '8',
      work_shift: 'day',
      is_active: true
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Autentifikatsiya tokeni topilmadi');
      }

      // Prepare the request body with proper null handling
      const requestBody: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        position: formData.position.trim(),
        department: formData.department.trim(),
        base_salary: parseFloat(formData.base_salary),
        employment_type: formData.employment_type,
        work_hours_per_day: parseInt(formData.work_hours_per_day),
        work_shift: formData.work_shift,
        is_active: true
      };

      // Handle nullable fields - only include if they have values
      if (formData.phone.trim()) {
        requestBody.phone = formData.phone.trim();
      } else {
        requestBody.phone = null;
      }

      if (formData.hire_date) {
        requestBody.hire_date = formData.hire_date;
      } else {
        requestBody.hire_date = null;
      }

      if (formData.date_of_birth) {
        requestBody.date_of_birth = formData.date_of_birth;
      } else {
        requestBody.date_of_birth = null;
      }

      if (formData.address.trim()) {
        requestBody.address = formData.address.trim();
      } else {
        requestBody.address = null;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/employees`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const backendErrors: {[key: string]: string} = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = result.errors[key][0];
          });
          setFormErrors(backendErrors);
          setError('Iltimos, formani to\'g\'ri to\'ldiring');
        } else {
          throw new Error(result.message || 'Xodim yaratish muvaffaqiyatsiz');
        }
        return;
      }

      if (result.success) {
        setSuccess('Xodim muvaffaqiyatli yaratildi');
        setShowModal(false);
        
        setFormData({
          first_name: '',
          last_name: '',
          phone: '',
          position: '',
          department: '',
          base_salary: '',
          hire_date: '',
          date_of_birth: '',
          address: '',
          employment_type: 'full_time',
          work_hours_per_day: '8',
          work_shift: 'day',
          is_active: true
        });
        setFormErrors({});
        
        await fetchEmployees();
      } else {
        throw new Error(result.message || 'Xodim yaratish muvaffaqiyatsiz');
      }

    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setError('Serverga ulanib bo\'lmadi. Internet aloqasini tekshiring.');
      } else {
        setError(error.message || 'Xodim yaratish muvaffaqiyatsiz');
      }
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEmployee) return;

    if (!validateForm()) {
      setError('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Autentifikatsiya tokeni topilmadi');
      }

      // Prepare the request body with proper null handling
      const requestBody: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        position: formData.position.trim(),
        department: formData.department.trim(),
        base_salary: parseFloat(formData.base_salary),
        employment_type: formData.employment_type,
        work_hours_per_day: parseInt(formData.work_hours_per_day),
        work_shift: formData.work_shift,
        is_active: formData.is_active
      };

      // Handle nullable fields - only include if they have values
      if (formData.phone.trim()) {
        requestBody.phone = formData.phone.trim();
      } else {
        requestBody.phone = null;
      }

      if (formData.hire_date) {
        requestBody.hire_date = formData.hire_date;
      } else {
        requestBody.hire_date = null;
      }

      if (formData.date_of_birth) {
        requestBody.date_of_birth = formData.date_of_birth;
      } else {
        requestBody.date_of_birth = null;
      }

      if (formData.address.trim()) {
        requestBody.address = formData.address.trim();
      } else {
        requestBody.address = null;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const backendErrors: {[key: string]: string} = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = result.errors[key][0];
          });
          setFormErrors(backendErrors);
          setError('Iltimos, formani to\'g\'ri to\'ldiring');
        } else {
          throw new Error(result.message || 'Xodimni yangilash muvaffaqiyatsiz');
        }
        return;
      }

      if (result.success) {
        setSuccess('Xodim muvaffaqiyatli yangilandi');
        setShowEditModal(false);
        setSelectedEmployee(null);
        setFormErrors({});
        await fetchEmployees();
      } else {
        throw new Error(result.message || 'Xodimni yangilash muvaffaqiyatsiz');
      }

    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setError('Serverga ulanib bo\'lmadi. Internet aloqasini tekshiring.');
      } else {
        setError(error.message || 'Xodimni yangilash muvaffaqiyatsiz');
      }
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (window.confirm('Haqiqatan ham bu xodimni o\'chirmoqchimisiz?')) {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          throw new Error('Autentifikatsiya tokeni topilmadi');
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/employees/${employeeId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Xodimni o\'chirish muvaffaqiyatsiz');
        }

        if (result.success) {
          setSuccess('Xodim muvaffaqiyatli o\'chirildi');
          await fetchEmployees();
        } else {
          throw new Error(result.message || 'Xodimni o\'chirish muvaffaqiyatsiz');
        }
      } catch (error: any) {
        if (error.message.includes('Failed to fetch')) {
          setError('Serverga ulanib bo\'lmadi. Internet aloqasini tekshiring.');
        } else {
          setError(error.message || 'Xodimni o\'chirish muvaffaqiyatsiz');
        }
      }
    }
  };

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.base_salary || 0), 0);
  const activeEmployees = employees.filter(e => e.is_active).length;

  const getWorkShiftBadge = (shift: string) => {
    const variants: { [key: string]: string } = {
      day: 'primary',
      night: 'dark',
      both: 'warning'
    };
    const labels: { [key: string]: string } = {
      day: 'Kunduzgi',
      night: 'Kechki',
      both: 'Aralash'
    };
    return <Badge bg={variants[shift] || 'secondary'} className="small">{labels[shift] || shift}</Badge>;
  };

  if (loading) {
    return (
      <Container fluid className="px-3 py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yuklanmoqda...</span>
          </div>
          <p className="mt-3 text-muted">Xodimlar yuklanmoqda...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="fade-in px-3 py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1">
          <h4 className="fw-bold mb-1">Xodimlarni Boshqarish</h4>
          <p className="text-muted small d-none d-sm-block">Xodimlaringiz va ularning maoshlarini boshqaring</p>
        </div>
        <Button variant="primary" onClick={handleAddEmployee} size="sm">
          <Plus size={16} className="me-1" />
          <span className="d-none d-sm-inline">Xodim Qo'shish</span>
          <span className="d-sm-none">Qo'shish</span>
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="small mb-3">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <strong>Xatolik:</strong> {error}
            </div>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => {
                setError('');
                fetchEmployees();
              }}
              className="ms-2"
            >
              Yangilash
            </Button>
          </div>
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="small mb-3">
          {success}
        </Alert>
      )}

      <Row className="g-3 mb-3">
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">Jami Xodimlar</p>
                  <h4 className="mb-0 fw-bold text-dark">{employees.length}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">Faol Xodimlar</p>
                  <h4 className="mb-0 fw-bold text-dark">{activeEmployees}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">Oylik Maosh</p>
                  <h4 className="mb-0 fw-bold text-dark">
                    {formatCurrencyUZS(totalPayroll)}
                  </h4>
                </div>
                <div className="bg-warning bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">O'rtacha Maosh</p>
                  <h4 className="mb-0 fw-bold text-dark">
                    {formatCurrencyUZS(employees.length > 0 ? totalPayroll / employees.length : 0)}
                  </h4>
                </div>
                <div className="bg-info bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-info" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0 fw-semibold">Barcha Xodimlar</h6>
              <small className="text-muted">{employees.length} ta xodim ko'rsatilmoqda</small>
            </div>
            <Button 
              variant="outline-primary" 
              onClick={handleAddEmployee} 
              size="sm"
              className="d-none d-sm-block"
            >
              <Plus size={14} className="me-1" />
              Xodim Qo'shish
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {employees.length === 0 ? (
            <div className="text-center py-5 px-3">
              <Users size={48} className="text-muted mb-3" />
              <h6 className="text-muted">Xodimlar topilmadi</h6>
              <p className="text-muted small mb-3">Birinchi xodimni qo'shish orqali boshlang</p>
              <Button variant="primary" onClick={handleAddEmployee} size="sm">
                <Plus size={14} className="me-1" />
                Xodim Qo'shish
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="small fw-semibold">Xodim</th>
                    <th className="small fw-semibold d-none d-md-table-cell">Bo'lim</th>
                    <th className="small fw-semibold d-none d-sm-table-cell">Lavozim</th>
                    <th className="small fw-semibold d-none d-lg-table-cell">Maosh</th>
                    <th className="small fw-semibold d-none d-xl-table-cell">Holati</th>
                    <th className="small fw-semibold text-end">Harakatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                                 style={{ width: '40px', height: '40px' }}>
                              <Users size={16} className="text-primary" />
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="fw-semibold small">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-muted small">
                              {employee.phone || 'Telefon kiritilmagan'}
                            </div>
                            <div className="d-block d-md-none">
                              <Badge bg="info" className="small me-1">
                                {employee.work_hours_per_day} soat
                              </Badge>
                              {getWorkShiftBadge(employee.work_shift)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="small">{employee.department}</span>
                      </td>
                      <td className="d-none d-sm-table-cell">
                        <span className="small">{employee.position}</span>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <span className="fw-semibold small text-success">
                          {formatCurrencyUZS(Number(employee.base_salary || 0))}
                        </span>
                      </td>
                      <td className="d-none d-xl-table-cell">
                        <Badge bg={employee.is_active ? 'success' : 'danger'} className="small">
                          {employee.is_active ? 'Faol' : 'Faol Emas'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-1">
                          <Dropdown className="d-block d-xl-none">
                            <Dropdown.Toggle variant="outline-secondary" size="sm" className="border-0">
                              <MoreVertical size={14} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                              <Dropdown.Item onClick={() => handleViewEmployee(employee)}>
                                <Eye size={14} className="me-2" />
                                Ko'rish
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleEditEmployee(employee)}>
                                <Edit size={14} className="me-2" />
                                Tahrirlash
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-danger"
                              >
                                <Trash2 size={14} className="me-2" />
                                O'chirish
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>

                          <div className="d-none d-xl-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleViewEmployee(employee)}
                              title="Xodim tafsilotlarini ko'rish"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                              title="Xodimni tahrirlash"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              title="Xodimni o'chirish"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Yangi Xodim Qo'shish</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-3">
            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ism *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Ismni kiriting"
                    size="sm"
                    isInvalid={!!formErrors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Familiya *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Familiyani kiriting"
                    size="sm"
                    isInvalid={!!formErrors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Telefon</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Telefon raqamini kiriting (ixtiyoriy)"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Lavozim *</Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    placeholder="Lavozimni kiriting"
                    size="sm"
                    isInvalid={!!formErrors.position}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.position}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Bo'lim *</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    placeholder="Bo'limni kiriting"
                    size="sm"
                    isInvalid={!!formErrors.department}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.department}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Asosiy Maosh (so'm) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="base_salary"
                    value={formData.base_salary}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.base_salary}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.base_salary}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Oylik maosh so'mda
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ish Soati *</Form.Label>
                  <Form.Control
                    type="number"
                    name="work_hours_per_day"
                    value={formData.work_hours_per_day}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="24"
                    placeholder="8"
                    size="sm"
                    isInvalid={!!formErrors.work_hours_per_day}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.work_hours_per_day}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Smena</Form.Label>
                  <Form.Select
                    name="work_shift"
                    value={formData.work_shift}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="day">Kunduzgi</option>
                    <option value="night">Kechki</option>
                    <option value="both">Aralash</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ish Turi</Form.Label>
                  <Form.Select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="full_time">To'liq stavka</option>
                    <option value="part_time">Yarim stavka</option>
                    <option value="contract">Shartnoma</option>
                    <option value="temporary">Vaqtincha</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ishga Qabul Sana</Form.Label>
                  <Form.Control
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.hire_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.hire_date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Tug'ilgan Sana</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.date_of_birth}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.date_of_birth}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Manzil</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Manzilni kiriting (ixtiyoriy)"
                size="sm"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="px-3 py-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} size="sm">
              Bekor Qilish
            </Button>
            <Button variant="primary" type="submit" size="sm">
              Xodim Qo'shish
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Xodimni Tahrirlash</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateEmployee}>
          <Modal.Body className="p-3">
            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ism *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Ismni kiriting"
                    size="sm"
                    isInvalid={!!formErrors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Familiya *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Familiyani kiriting"
                    size="sm"
                    isInvalid={!!formErrors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Telefon</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Telefon raqamini kiriting (ixtiyoriy)"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Lavozim *</Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    placeholder="Lavozimni kiriting"
                    size="sm"
                    isInvalid={!!formErrors.position}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.position}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Bo'lim *</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    placeholder="Bo'limni kiriting"
                    size="sm"
                    isInvalid={!!formErrors.department}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.department}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Asosiy Maosh (so'm) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="base_salary"
                    value={formData.base_salary}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.base_salary}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.base_salary}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Oylik maosh so'mda
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ish Soati *</Form.Label>
                  <Form.Control
                    type="number"
                    name="work_hours_per_day"
                    value={formData.work_hours_per_day}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="24"
                    placeholder="8"
                    size="sm"
                    isInvalid={!!formErrors.work_hours_per_day}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.work_hours_per_day}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Smena</Form.Label>
                  <Form.Select
                    name="work_shift"
                    value={formData.work_shift}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="day">Kunduzgi</option>
                    <option value="night">Kechki</option>
                    <option value="both">Aralash</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ish Turi</Form.Label>
                  <Form.Select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="full_time">To'liq stavka</option>
                    <option value="part_time">Yarim stavka</option>
                    <option value="contract">Shartnoma</option>
                    <option value="temporary">Vaqtincha</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Ishga Qabul Sana</Form.Label>
                  <Form.Control
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.hire_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.hire_date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Tug'ilgan Sana</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.date_of_birth}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.date_of_birth}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Holati</Form.Label>
                  <Form.Select
                    name="is_active"
                    value={formData.is_active.toString()}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="true">Faol</option>
                    <option value="false">Faol Emas</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Manzil</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Manzilni kiriting (ixtiyoriy)"
                size="sm"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="px-3 py-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} size="sm">
              Bekor Qilish
            </Button>
            <Button variant="primary" type="submit" size="sm">
              Yangilash
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Xodim Tafsilotlari</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {selectedEmployee && (
            <>
              <Row className="mb-3">
                <Col xs={8}>
                  <h6 className="fw-bold mb-2">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h6>
                  {selectedEmployee.phone && (
                    <p className="text-muted small mb-1">
                      <Phone size={14} className="me-2" />
                      {selectedEmployee.phone}
                    </p>
                  )}
                  {selectedEmployee.address && (
                    <p className="text-muted small mb-0">
                      <MapPin size={14} className="me-2" />
                      {selectedEmployee.address}
                    </p>
                  )}
                </Col>
                <Col xs={4} className="text-end">
                  <Badge bg={selectedEmployee.is_active ? 'success' : 'danger'} className="small mb-2">
                    {selectedEmployee.is_active ? 'Faol' : 'Faol Emas'}
                  </Badge>
                  <div>
                    <small className="text-muted">ID:</small>
                    <div className="fw-bold small">{selectedEmployee.employee_code}</div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col xs={12} sm={6}>
                  <h6 className="text-muted small mb-2">Ish Tafsilotlari</h6>
                  <div className="mb-2">
                    <strong className="small">Lavozim:</strong>
                    <div className="small">{selectedEmployee.position}</div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Bo'lim:</strong>
                    <div className="small">{selectedEmployee.department}</div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Ish Soati:</strong>
                    <div className="small"><Badge bg="info" className="small">{(selectedEmployee as any).work_hours_per_day} soat</Badge></div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Smena:</strong>
                    <div className="small">{getWorkShiftBadge((selectedEmployee as any).work_shift)}</div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Asosiy Maosh:</strong>
                    <div className="fw-semibold small text-success">
                      {formatCurrencyUZS(Number(selectedEmployee.base_salary || 0))}
                    </div>
                  </div>
                  {selectedEmployee.hire_date && (
                    <div className="mb-2">
                      <strong className="small">Ishga Qabul Sana:</strong>
                      <div className="small">{new Date(selectedEmployee.hire_date).toLocaleDateString()}</div>
                    </div>
                  )}
                </Col>
                <Col xs={12} sm={6}>
                  <h6 className="text-muted small mb-2">Shaxsiy Ma'lumotlar</h6>
                  {selectedEmployee.date_of_birth && (
                    <div className="mb-2">
                      <strong className="small">Tug'ilgan Sana:</strong>
                      <div className="small">{new Date(selectedEmployee.date_of_birth).toLocaleDateString()}</div>
                    </div>
                  )}
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="px-3 py-2">
          <Button variant="secondary" onClick={() => setShowViewModal(false)} size="sm">
            Yopish
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};