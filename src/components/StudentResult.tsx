import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, Home, Award } from 'lucide-react';

export default function StudentResult() {
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const submissionId = localStorage.getItem('lastSubmissionId');
    if (!submissionId) {
      navigate('/');
      return;
    }

    const fetchResult = async () => {
      try {
        const docRef = doc(db, 'submissions', submissionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResult(docSnap.data());
        } else {
          alert('Không tìm thấy kết quả.');
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [navigate]);

  if (loading) return <div className="p-8 text-center">Đang tải kết quả...</div>;
  if (!result) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Kết Quả Bài Thi</h1>
          <p className="text-gray-600 mb-6">Thí sinh: <span className="font-semibold text-gray-900">{result.studentName}</span></p>
          
          <div className="inline-block bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-1">Điểm Số</div>
            <div className="text-5xl font-black text-blue-700">{result.score.toFixed(2)}<span className="text-2xl text-blue-500">/10</span></div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-800 p-4 text-white">
            <h2 className="font-bold">Chi Tiết Từng Phần</h2>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Part 1 */}
            <section>
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Phần I (Mỗi câu 0.25đ)</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {result.details.part1.map((isCorrect: boolean, i: number) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="text-sm font-medium text-gray-700">Câu {i + 1}</span>
                    {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  </div>
                ))}
              </div>
            </section>

            {/* Part 2 */}
            <section>
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Phần II (Tối đa 1.0đ/câu)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.details.part2.map((score: number, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <span className="font-medium text-gray-800">Câu {i + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Điểm đạt:</span>
                      <span className={`font-bold ${score === 1 ? 'text-emerald-600' : score > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Part 3 */}
            <section>
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Phần III (Mỗi câu 0.25đ)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {result.details.part3.map((isCorrect: boolean, i: number) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="text-sm font-medium text-gray-700">Câu {i + 1}</span>
                    {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors">
            <Home className="w-5 h-5" />
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
