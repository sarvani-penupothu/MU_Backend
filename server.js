const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('./models/User');
const Task = require('./models/Task');
const Schedule = require('./models/Schedule');
const app = express();
const PORT = 5000;
const SECRET_KEY = 'mu_secret_key_123'; // ✅ Move to .env in production
const CourseRegistration = require('./models/CourseRegistration');
const FeeInfo = require('./models/FeeInfo');
const FacultySchedule = require('./models/FacultySchedule');
const Attendance = require('./models/Attendance');
const http = require('http');
const socketIO = require('socket.io');
const Message = require('./models/Message');

// 🧠 Connect MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mu_portal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ⚙️ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("C:/Users/varsh/college/Software eng/MU_IntranetPortal"));

// 🔐 JWT Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// 🌐 Home Route
app.get('/', (req, res) => {
  res.send('🌍 Backend is running!');
});

// 📨 Protected form route
app.post('/api/form', authenticate, (req, res) => {
  const formData = req.body;
  console.log(`📝 Form from ${req.user.email}:`, formData);
  res.status(200).json({ message: 'Form submitted!', data: formData });
});

// 🧑‍🎓 Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
      // ❌ No studentInfo or facultyInfo added here
    });

    await newUser.save();
    res.status(201).json({ message: 'Signup successful!' });
  } catch (err) {
    console.error('🔥 Signup error:', err);
    res.status(500).json({ message: 'Something went wrong during signup.' });
  }
});


// 🔑 Signin
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).lean();
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '2h' });
    const redirectTo = user.role === 'faculty' ? 'faculty.html' : 'index.html';
    res.status(200).json({
      message: 'Signin successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentInfo: user.studentInfo || {} // ✅ this line very important
      },
      redirectTo
    });
        
  } catch (err) {
    console.error('🔥 Signin error:', err);
    res.status(500).json({ message: 'Signin failed.' });
  }
});
app.use('/api', authenticate)

// 👤 Profile
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('❌ Profile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});


// ✅ To-Do API

// 🧾 Fetch tasks
app.get('/api/tasks', authenticate, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });
  res.json(tasks);
});

// ➕ Add task
app.post('/api/tasks', authenticate, async (req, res) => {
  const { text } = req.body;
  const task = new Task({ userId: req.user.id, text });
  await task.save();
  res.status(201).json(task);
});

// ✅ Toggle task
app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  task.completed = !task.completed;
  await task.save();
  res.json(task);
});

// ❌ Delete task
app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  await Task.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.status(204).end();
});

// 🚀 Launch server
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


app.get('/api/schedule/today', authenticate, async (req, res) => {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  try {
    const schedule = await Schedule.findOne({ day });
    if (!schedule) return res.status(404).json({ message: 'No schedule found for today' });
    res.json(schedule.entries);
  } catch (err) {
    console.error('❌ Schedule error:', err);
    res.status(500).json({ message: 'Server error fetching schedule' });
  }
});
// POST /api/courses - Register a new course
app.post('/api/courses', authenticate, async (req, res) => {
  try {
    const { courseName, courseCode, instructor } = req.body;

    const newCourse = new CourseRegistration({
      userId: req.user.id,
      courseName,
      courseCode,
      instructor
    });

    await newCourse.save();
    res.status(201).json({ message: 'Course registered successfully' });
  } catch (err) {
    console.error('❌ Course registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses - Get registered courses for a user
app.get('/api/courses', authenticate, async (req, res) => {
  try {
    const courses = await CourseRegistration.find({ userId: req.user.id }).sort({ registeredAt: -1 });
    res.json(courses);
  } catch (err) {
    console.error('❌ Error fetching courses:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/fees - fetch fee data for the logged-in user
app.get('/api/fees', authenticate, async (req, res) => {
  try {
    let feeInfo = await FeeInfo.findOne({ userId: req.user.id });

    if (!feeInfo) {
      const user = await User.findById(req.user.id); // Fetch full user info
      feeInfo = new FeeInfo({
      userId: req.user.id,
      rollNumber: user?.studentInfo?.rollNumber || 'N/A',
      branch: user?.studentInfo?.branch || 'N/A',
      semester: user?.studentInfo?.year || 0,
      transactions: []
    });

      await feeInfo.save();
    }

    const totalFee = feeInfo.tuitionFee + feeInfo.hostelFee;
    const paid = feeInfo.transactions
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const due = totalFee - paid;

    res.json({
      rollNumber: feeInfo.rollNumber,
      branch: feeInfo.branch,
      semester: feeInfo.semester,
      tuitionFee: feeInfo.tuitionFee,
      hostelFee: feeInfo.hostelFee,
      transactions: feeInfo.transactions,
      total: totalFee,
      paid,
      due
    });
  } catch (err) {
    console.error('❌ Error fetching fee data:', err);
    res.status(500).json({ message: 'Server error fetching fee info' });
  }
});

// POST /api/fees/pay - add a transaction manually (for testing)
app.post('/api/fees/pay', authenticate, async (req, res) => {
  try {
    const { amount, mode, status, date } = req.body;
    const feeInfo = await FeeInfo.findOne({ userId: req.user.id });

    if (!feeInfo) return res.status(404).json({ message: 'Fee record not found' });

    feeInfo.transactions.push({ amount, mode, status, date });
    await feeInfo.save();

    res.json({ message: 'Transaction added successfully' });
  } catch (err) {
    console.error('❌ Error adding payment:', err);
    res.status(500).json({ message: 'Failed to add transaction' });
  }
});
app.get('/api/faculty/schedule/today', authenticate, async (req, res) => {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  try {
    const schedule = await FacultySchedule.findOne({
      day,
      facultyEmail: req.user.email
    });

    if (!schedule || schedule.entries.length === 0) {
      return res.json([]);
    }

    res.json(schedule.entries);
  } catch (err) {
    console.error("❌ Faculty schedule error:", err);
    res.status(500).json({ message: "Server error fetching faculty schedule" });
  }
});
// server.js
app.get('/api/students', authenticate, async (req, res) => {
  const { branch, year } = req.query;

  try {
    const students = await User.find({
      role: "student",
      "studentInfo.branch": branch,
      "studentInfo.year": parseInt(year)
    }, { "studentInfo.rollNumber": 1, _id: 0 });

    const formatted = students.map(s => ({
      rollNumber: s.studentInfo.rollNumber
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Server error fetching students" });
  }
});

app.post('/api/attendance/submit', authenticate, async (req, res) => {
  const { date, subject, time, classroom, branch, year, presentStudents } = req.body;

  const attendanceRecord = new Attendance({
    facultyEmail: req.user.email,
    date,
    subject,
    time,
    classroom,
    branch,
    year,
    presentStudents
  });

  await attendanceRecord.save();
  res.status(200).json({ message: "Attendance submitted successfully" });
});
app.get('/api/attendance/student', authenticate, async (req, res) => {
  const { rollNumber } = req.user;
  const records = await Attendance.find({ presentStudents: rollNumber });

  const formatted = records.map(r => ({
    date: r.date,
    subject: r.subject,
    time: r.time,
    classroom: r.classroom,
    status: "Present"
  }));

  res.json(formatted);
});
app.post('/api/attendance/submit', authenticate, async (req, res) => {
  const { date, subject, classroom, branch, year } = req.body;

  try {
    // Check if attendance already exists for the same class, faculty, and date
    const existingRecord = await Attendance.findOne({
      facultyEmail: req.user.email,
      date,
      time,
      subject,
      classroom,
      branch,
      year
    });

    if (existingRecord) {
      return res.status(409).json({ message: "Attendance already submitted for this class today." });
    }

    // Save attendance if not already submitted
    const attendanceRecord = new Attendance({
      facultyEmail: req.user.email,
      date,
      subject,
      time,
      classroom,
      branch,
      year,
      presentStudents: req.body.presentStudents
    });

    await attendanceRecord.save();
    res.status(200).json({ message: "Attendance submitted successfully." });

  } catch (err) {
    console.error("❌ Error saving attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get('/api/messages/:user1/:user2', authenticate, async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ Chat history error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('⚡ New socket connection');

  socket.on('join', (userId) => {
    socket.join(userId); // join room for that user
    console.log(`User ${userId} joined their room`);
  });

  socket.on('private_message', async ({ senderId, receiverId, content }) => {
    const newMsg = new Message({ senderId, receiverId, content });
    await newMsg.save();

    io.to(receiverId).emit('private_message', {
      senderId,
      receiverId,
      content,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
app.get('/api/chat/contacts', authenticate, async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.id } }, // exclude current user
      { name: 1, role: 1 } // only select needed fields
    );
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching contacts:', err);
    res.status(500).json({ message: 'Failed to load contacts' });
  }
});
