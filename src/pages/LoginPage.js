import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const onSubmit = async (data) => {
    console.log('API URL:', process.env.REACT_APP_API_URL);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/login`, data);
      localStorage.setItem('token', response.data.token);
      navigate('/admin');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">เข้าสู่ระบบแอดมิน</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block">ชื่อผู้ใช้ *</label>
          <input
            {...register('username', { required: 'กรุณากรอกชื่อผู้ใช้' })}
            className="w-full p-2 border rounded"
          />
          {errors.username && <p className="text-red-500">{errors.username.message}</p>}
        </div>
        <div>
          <label className="block">รหัสผ่าน *</label>
          <input
            type="password"
            {...register('password', { required: 'กรุณากรอกรหัสผ่าน' })}
            className="w-full p-2 border rounded"
          />
          {errors.password && <p className="text-red-500">{errors.password.message}</p>}
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          เข้าสู่ระบบ
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default LoginPage;