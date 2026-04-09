import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, ArrowLeft, Lock, KeyRound, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherView() {
  const [part1, setPart1] = useState<string[]>(Array(18).fill(''));
  const [part2, setPart2] = useState<{a: boolean, b: boolean, c: boolean, d: boolean}[]>(
    Array(4).fill({ a: false, b: false, c: false, d: false })
  );
  const [part3, setPart3] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const docRef = doc(db, 'exams', 'chemistry_2025');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIsUpdate(true);
          const data = docSnap.data();
          if (data.teacherPassword) {
            setTeacherPassword(data.teacherPassword);
            setIsLocked(true);
          }
          if (data.part1) setPart1(data.part1);
          if (data.part2) setPart2(data.part2);
          if (data.part3) setPart3(data.part3);
        }
      } catch (error) {
        console.error("Error fetching answer key:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchKey();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'exams', 'chemistry_2025'), {
        part1,
        part2,
        part3,
        teacherPassword
      });
      setIsUpdate(true);
      setMessage(isUpdate ? 'Đã cập nhật đáp án thành công!' : 'Đã lưu đáp án thành công!');
    } catch (error) {
      console.error("Error saving:", error);
      setMessage('Lỗi khi lưu đáp án.');
    } finally {
      setSaving(false);
    }
  };

  const updatePart1 = (index: number, val: string) => {
    const newArr = [...part1];
    newArr[index] = val;
    setPart1(newArr);
  };

  const updatePart2 = (qIndex: number, statement: 'a'|'b'|'c'|'d', val: boolean) => {
    const newArr = [...part2];
    newArr[qIndex] = { ...newArr[qIndex], [statement]: val };
    setPart2(newArr);
  };

  const updatePart3 = (index: number, val: string) => {
    const newArr = [...part3];
    newArr[index] = val;
    setPart3(newArr);
  };

  const handleDownloadScores = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const querySnapshot = await getDocs(collection(db, 'submissions'));
      const submissions: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.submittedAt && data.submittedAt.startsWith(today)) {
          submissions.push(data);
        }
      });

      if (submissions.length === 0) {
        alert('Chưa có học sinh nào nộp bài trong hôm nay.');
        return;
      }

      // Sort by submittedAt descending
      submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      // Create CSV content
      let csvContent = "Họ và tên,Điểm số,Thời gian nộp,Số lần vi phạm\n";
      submissions.forEach(sub => {
        const time = new Date(sub.submittedAt).toLocaleTimeString('vi-VN');
        const cheats = sub.cheatCount || 0;
        csvContent += `"${sub.studentName}",${sub.score.toFixed(2)},"${time}",${cheats}\n`;
      });

      // Download CSV
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang_Diem_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading scores:", error);
      alert('Lỗi khi tải bảng điểm.');
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">Xác Thực Giáo Viên</h1>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu bảo vệ đáp án
              </label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (inputPassword === teacherPassword) setIsLocked(false);
                    else alert('Sai mật khẩu!');
                  }
                }}
                placeholder="Nhập mật khẩu..."
                className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button
              onClick={() => {
                if (inputPassword === teacherPassword) setIsLocked(false);
                else alert('Sai mật khẩu!');
              }}
              className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              <Lock className="w-5 h-5" />
              Mở Khoá
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Nhập Đáp Án - Giáo Viên</h1>
            <p className="text-emerald-100 mt-1">Môn Hoá Học 12 - Form 2025</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadScores}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Tải Điểm Hôm Nay
            </button>
            <Link to="/" className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Trang chủ
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* CÀI ĐẶT MẬT KHẨU */}
          <section className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <h2 className="text-emerald-800 font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Mật khẩu bảo vệ
              </h2>
              <p className="text-sm text-emerald-600 mt-1">Học sinh không cần mật khẩu này. Chỉ dùng để bảo vệ trang chỉnh sửa đáp án.</p>
            </div>
            <input
              type="text"
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
              placeholder="Để trống nếu không cần..."
              className="border border-emerald-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
            />
          </section>

          {/* PHẦN I */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Phần I: Câu trắc nghiệm nhiều phương án lựa chọn (18 câu)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {part1.map((ans, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">Câu {i + 1}</label>
                  <select 
                    value={ans} 
                    onChange={(e) => updatePart1(i, e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">--</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* PHẦN II */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Phần II: Câu trắc nghiệm đúng sai (4 câu)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {part2.map((q, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-700 mb-3">Câu {i + 1}</h3>
                  <div className="space-y-3">
                    {(['a', 'b', 'c', 'd'] as const).map((stmt) => (
                      <div key={stmt} className="flex items-center justify-between">
                        <span className="text-sm font-medium w-8 uppercase">{stmt}.</span>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name={`p2_q${i}_${stmt}`} 
                              checked={q[stmt] === true}
                              onChange={() => updatePart2(i, stmt, true)}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <span className="text-sm">Đúng</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name={`p2_q${i}_${stmt}`} 
                              checked={q[stmt] === false}
                              onChange={() => updatePart2(i, stmt, false)}
                              className="w-4 h-4 text-red-600"
                            />
                            <span className="text-sm">Sai</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PHẦN III */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Phần III: Câu trắc nghiệm trả lời ngắn (6 câu)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {part3.map((ans, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">Câu {i + 1}</label>
                  <input 
                    type="text"
                    value={ans}
                    onChange={(e) => updatePart3(i, e.target.value)}
                    placeholder="Nhập đáp án..."
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex items-center justify-between pt-6 border-t">
            <span className={`text-sm font-medium ${message.includes('thành công') ? 'text-emerald-600' : 'text-red-600'}`}>
              {message}
            </span>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-70"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Đang lưu...' : (isUpdate ? 'Cập Nhật Đáp Án' : 'Lưu Đáp Án')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
