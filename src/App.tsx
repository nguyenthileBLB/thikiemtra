/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import TeacherView from './components/TeacherView';
import StudentLogin from './components/StudentLogin';
import StudentExam from './components/StudentExam';
import StudentResult from './components/StudentResult';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher" element={<TeacherView />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/exam" element={<StudentExam />} />
        <Route path="/student/result" element={<StudentResult />} />
      </Routes>
    </Router>
  );
}
