import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Clock, Send } from 'lucide-react';

const EXAM_DURATION = 50 * 60; // 50 minutes in seconds

export default function StudentExam() {
  const navigate = useNavigate();
  const studentName = localStorage.getItem('studentName');
  
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [answerKey, setAnswerKey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [part1, setPart1] = useState<string[]>(() => {
    const saved = localStorage.getItem('ans_part1');
    return saved ? JSON.parse(saved) : Array(18).fill('');
  });
  const [part2, setPart2] = useState<{a: boolean|null, b: boolean|null, c: boolean|null, d: boolean|null}[]>(() => {
    const saved = localStorage.getItem('ans_part2');
    return saved ? JSON.parse(saved) : Array(4).fill({ a: null, b: null, c: null, d: null });
  });
  const [part3, setPart3] = useState<string[]>(() => {
    const saved = localStorage.getItem('ans_part3');
    return saved ? JSON.parse(saved) : Array(6).fill('');
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!studentName) {
      navigate('/student/login');
      return;
    }

    const fetchKey = async () => {
      try {
        const docRef = doc(db, 'exams', 'chemistry_2025');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAnswerKey(docSnap.data());
        } else {
          alert('Chưa có đề thi. Vui lòng liên hệ giáo viên.');
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching answer key:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchKey();

    // Timer Persistence Logic
    let startTime = localStorage.getItem('examStartTime');
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem('examStartTime', startTime);
    }

    let warnings = parseInt(localStorage.getItem('cheatCount') || '0');

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime!)) / 1000);
      const remaining = EXAM_DURATION - elapsed;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        if (timerRef.current) clearInterval(timerRef.current);
        handleSubmit(true);
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    // Anti-cheat Logic
    const handleCheat = () => {
      if (submitting) return;
      warnings++;
      localStorage.setItem('cheatCount', warnings.toString());
      
      if (warnings >= 3) {
        alert('Bạn đã vi phạm quy chế thi quá 3 lần (thoát màn hình/chuyển tab). Bài thi của bạn sẽ bị nộp tự động.');
        handleSubmit(true);
      } else {
        alert(`CẢNH BÁO GIAN LẬN (${warnings}/3): Bạn không được phép chuyển tab hoặc thoát màn hình khi đang thi!`);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheat();
      }
    };

    const preventDefault = (e: Event) => e.preventDefault();
    
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const calculateScore = (studentAnswers: any, key: any) => {
    let score = 0;
    const details = {
      part1: [] as boolean[],
      part2: [] as number[], // score per question
      part3: [] as boolean[]
    };

    // Part 1
    for (let i = 0; i < 18; i++) {
      const isCorrect = studentAnswers.part1[i] === key.part1[i] && key.part1[i] !== '';
      details.part1.push(isCorrect);
      if (isCorrect) score += 0.25;
    }

    // Part 2
    for (let i = 0; i < 4; i++) {
      let correctCount = 0;
      const stAns = studentAnswers.part2[i];
      const keyAns = key.part2[i];
      
      if (stAns.a === keyAns.a) correctCount++;
      if (stAns.b === keyAns.b) correctCount++;
      if (stAns.c === keyAns.c) correctCount++;
      if (stAns.d === keyAns.d) correctCount++;

      let qScore = 0;
      if (correctCount === 1) qScore = 0.1;
      else if (correctCount === 2) qScore = 0.25;
      else if (correctCount === 3) qScore = 0.5;
      else if (correctCount === 4) qScore = 1.0;

      score += qScore;
      details.part2.push(qScore);
    }

    // Part 3
    for (let i = 0; i < 6; i++) {
      // Simple string comparison, ignoring case and spaces
      const stAns = (studentAnswers.part3[i] || '').trim().toLowerCase();
      const keyAns = (key.part3[i] || '').trim().toLowerCase();
      const isCorrect = stAns === keyAns && keyAns !== '';
      details.part3.push(isCorrect);
      if (isCorrect) score += 0.25;
    }

    return { score, details };
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm('Bạn có chắc chắn muốn nộp bài?')) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    const studentAnswers = { part1, part2, part3 };
    const { score, details } = calculateScore(studentAnswers, answerKey);
    const cheatCount = parseInt(localStorage.getItem('cheatCount') || '0');

    try {
      const docRef = await addDoc(collection(db, 'submissions'), {
        studentName,
        score,
        answers: studentAnswers,
        details,
        cheatCount,
        submittedAt: new Date().toISOString()
      });
      
      // Clear local storage after successful submit
      localStorage.removeItem('examStartTime');
      localStorage.removeItem('cheatCount');
      localStorage.removeItem('ans_part1');
      localStorage.removeItem('ans_part2');
      localStorage.removeItem('ans_part3');
      
      // Save submission ID to local storage to show in result page
      localStorage.setItem('lastSubmissionId', docRef.id);
      navigate('/student/result');
    } catch (error) {
      console.error("Error submitting:", error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  const updatePart1 = (index: number, val: string) => {
    const newArr = [...part1];
    newArr[index] = val;
    setPart1(newArr);
    localStorage.setItem('ans_part1', JSON.stringify(newArr));
  };

  const updatePart2 = (qIndex: number, statement: 'a'|'b'|'c'|'d', val: boolean) => {
    const newArr = [...part2];
    newArr[qIndex] = { ...newArr[qIndex], [statement]: val };
    setPart2(newArr);
    localStorage.setItem('ans_part2', JSON.stringify(newArr));
  };

  const updatePart3 = (index: number, val: string) => {
    const newArr = [...part3];
    newArr[index] = val;
    setPart3(newArr);
    localStorage.setItem('ans_part3', JSON.stringify(newArr));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-8 text-center">Đang tải đề thi...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header / Sticky Timer */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-gray-800">Thí sinh: {studentName}</h1>
          <p className="text-xs text-gray-500">Môn: Hoá Học 12</p>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {/* PHẦN I */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Phần I: Câu trắc nghiệm nhiều phương án lựa chọn</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {part1.map((ans, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <label className="text-sm font-semibold text-gray-700 text-center">Câu {i + 1}</label>
                <div className="flex justify-center gap-2">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => updatePart1(i, opt)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${ans === opt ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PHẦN II */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Phần II: Câu trắc nghiệm đúng sai</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {part2.map((q, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-3">Câu {i + 1}</h3>
                <div className="space-y-3">
                  {(['a', 'b', 'c', 'd'] as const).map((stmt) => (
                    <div key={stmt} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-sm font-medium w-8 uppercase">{stmt}.</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updatePart2(i, stmt, true)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${q[stmt] === true ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Đúng
                        </button>
                        <button
                          onClick={() => updatePart2(i, stmt, false)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${q[stmt] === false ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PHẦN III */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Phần III: Câu trắc nghiệm trả lời ngắn</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {part3.map((ans, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <label className="text-sm font-semibold text-gray-700">Câu {i + 1}</label>
                <input 
                  type="text"
                  value={ans}
                  onChange={(e) => updatePart3(i, e.target.value)}
                  placeholder="Nhập đáp án..."
                  className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer / Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-center z-50">
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-colors disabled:opacity-70"
        >
          <Send className="w-5 h-5" />
          {submitting ? 'Đang nộp bài...' : 'Nộp Bài'}
        </button>
      </div>
    </div>
  );
}
