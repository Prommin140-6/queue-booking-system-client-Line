import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Col, Input, Row, Statistic, Table, Tag, Tooltip, Space, Modal, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, CalendarOutlined, HomeOutlined } from '@ant-design/icons';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './AdminPage.css';

const { confirm } = Modal;

const AdminPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [acceptedBookings, setAcceptedBookings] = useState([]); // เปลี่ยนจาก confirmedBookings เป็น acceptedBookings
  const [summary, setSummary] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const formatDateToLocal = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const filterBookings = (search, date, initialBookings = bookings) => {
    let filtered = [...initialBookings];
    if (search) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.phone.includes(search) ||
        b.carModel.toLowerCase().includes(search.toLowerCase()) ||
        b.licensePlate.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (date) {
      const filterDateStr = formatDateToLocal(date);
      filtered = filtered.filter(b => {
        let bookingDate = new Date(b.date);
        if (isNaN(bookingDate.getTime())) {
          bookingDate = new Date(b.date.split('T')[0]);
        }
        return formatDateToLocal(bookingDate) === filterDateStr;
      });
    }
    setPendingBookings(filtered.filter(b => b.status === 'pending'));
    setAcceptedBookings(filtered.filter(b => b.status === 'accepted')); // เปลี่ยนจาก confirmed เป็น accepted
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('กรุณาเข้าสู่ระบบ');
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const bookingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const summaryRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/summary`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const allBookings = bookingsRes.data;
        setBookings(allBookings);
        filterBookings(searchText, filterDate, allBookings);
        setSummary(summaryRes.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
          navigate('/admin/login');
        } else {
          message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
          console.error('API error:', error.response?.data || error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, searchText, filterDate]);

  const handleStatusUpdate = async (id, status) => {
    setLoading(true);
    console.log('Sending PATCH request:', {
      url: `${process.env.REACT_APP_API_URL}/api/bookings/${id}`,
      body: { status },
      token: localStorage.getItem('token')
    });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/bookings/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('PATCH response:', response.data);
      const updatedBookings = bookings.map(booking =>
        booking._id === id ? { ...booking, status } : booking
      );
      setBookings(updatedBookings);
      filterBookings(searchText, filterDate, updatedBookings);
      message.success(`เปลี่ยนสถานะเป็น '${status}' เรียบร้อย`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error updating status:', {
        response: error.response?.data,
        status: error.response?.status,
        message: errorMessage
      });
      message.error(`ไม่สามารถเปลี่ยนสถานะเป็น '${status}' ได้: ${errorMessage}`);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: 'คุณแน่ใจที่จะลบการจองนี้หรือไม่?',
      icon: <ExclamationCircleOutlined />,
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${process.env.REACT_APP_API_URL}/api/bookings/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const updatedBookings = bookings.filter(b => b._id !== id);
          setBookings(updatedBookings);
          filterBookings(searchText, filterDate, updatedBookings);
          message.success('ลบการจองเรียบร้อย');
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          message.error(`ไม่สามารถลบการจองได้: ${errorMessage}`);
          console.error('Error deleting booking:', error.response?.data || error.message);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            navigate('/admin/login');
          }
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    filterBookings(value, filterDate);
  };

  const handleDateFilter = (date) => {
    setFilterDate(date);
    filterBookings(searchText, date);
  };

  const columns = [
    {
      title: 'ชื่อ',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 150,
    },
    {
      title: 'เบอร์โทร',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'รุ่นรถ',
      dataIndex: 'carModel',
      key: 'carModel',
      width: 150,
    },
    {
      title: 'ทะเบียนรถ',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 120,
      render: (text) => <Tag color="blue">{text.toUpperCase()}</Tag>
    },
    {
      title: 'วันที่จอง',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => formatDateToLocal(text),
      sorter: (a, b) => new Date(a.date) - new Date(b.date)
    },
    {
      title: 'เวลา',
      dataIndex: 'time',
      key: 'time',
      width: 100,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        let color = 'default';
        let icon = null;
        switch (status) {
          case 'pending':
            color = 'orange';
            icon = <ExclamationCircleOutlined />;
            break;
          case 'accepted':
            color = 'green';
            icon = <CheckCircleOutlined />;
            break;
          case 'rejected':
            color = 'red';
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = 'default';
        }
        return <Tag icon={icon} color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'จัดการ',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Tooltip title="ยืนยันการจอง">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleStatusUpdate(record._id, 'accepted')}
                  loading={loading}
                >
                  Confirm
                </Button>
              </Tooltip>
              <Tooltip title="ปฏิเสธการจอง">
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleStatusUpdate(record._id, 'rejected')}
                  loading={loading}
                >
                  Reject
                </Button>
              </Tooltip>
            </>
          )}
          {record.status === 'accepted' && (
            <>
              <Tooltip title="ลบการจอง">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record._id)}
                  loading={loading}
                >
                  Delete
                </Button>
              </Tooltip>
            </>
          )}
          {record.status === 'rejected' && (
            <Tag color="red">Rejected</Tag>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
            <HomeOutlined /> Admin Dashboard
          </h1>
        </Col>
        <Col>
          <Link to="/">
            <Button
              type="default"
              icon={<CalendarOutlined />}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              ไปหน้าจองคิว
            </Button>
          </Link>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="จองวันนี้"
              value={summary.todayBookings || 0}
              valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="รอดำเนินการ"
              value={summary.pendingBookings || 0}
              valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="ยืนยันแล้ว"
              value={
                summary.statusBreakdown?.find(s => s._id === 'accepted')?.count || 0
              }
              valueStyle={{ color: '#108ee9', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={12} className="mb-6" align="middle">
        <Col xs={24} sm={16}>
          <Input
            size="large"
            placeholder="ค้นหาชื่อ, เบอร์โทร, รุ่นรถ, ทะเบียน"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            allowClear
          />
        </Col>
        <Col xs={24} sm={8}>
          <DatePicker
            selected={filterDate}
            onChange={handleDateFilter}
            dateFormat="yyyy-MM-dd"
            placeholderText="กรองวันที่จอง"
            className="react-datepicker__input-container"
            wrapperClassName="react-datepicker-wrapper"
            isClearable
          />
        </Col>
      </Row>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-700">รายการรอดำเนินการ</h2>
        <Table
          columns={columns}
          dataSource={pendingBookings}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          scroll={{ x: 900 }}
          bordered
          size="middle"
        />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">รายการยืนยันแล้ว</h2>
        <Table
          columns={columns}
          dataSource={acceptedBookings}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          scroll={{ x: 900 }}
          bordered
          size="middle"
        />
      </div>
    </div>
  );
};

export default AdminPage;