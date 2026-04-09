import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function StudentLogin() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('studentName', name.trim());
      // Reset timer and cheat count for a new session
      localStorage.removeItem('examStartTime');
      localStorage.removeItem('cheatCount');
      localStorage.removeItem('ans_part1');
      localStorage.removeItem('ans_part2');
      localStorage.removeItem('ans_part3');
      navigate('/student/exam');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center mb-8">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Đăng Nhập Thi</h1>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên học sinh
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ tên của bạn..."
              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>
          
          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Vào Phòng Thi
          </button>
        </form>
      </div>
    </div>
  );
}
