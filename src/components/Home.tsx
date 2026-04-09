import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hệ Thống Thi Trắc Nghiệm</h1>
        <p className="text-gray-500 mb-8">Kỳ thi THPT 2025 - Môn Hoá Học Lớp 12</p>
        
        <div className="grid grid-cols-1 gap-4">
          <Link
            to="/student/login"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <GraduationCap className="w-6 h-6" />
            Học Sinh Đăng Nhập
          </Link>
          
          <Link
            to="/teacher"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            <BookOpen className="w-6 h-6" />
            Giáo Viên Nhập Đáp Án
          </Link>
        </div>
      </div>
    </div>
  );
}
