// app.js
const express = require('express');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const socketIo = require('socket.io');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

// Socket.io for real-time score updates
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('scoreUpdate', (data) => {
    io.emit('scoreUpdate', data);
  });
  
  socket.on('switchSides', (data) => {
    io.emit('switchSides', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// // Error handler
// app.use((err, req, res, next) => {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: process.env.NODE_ENV === 'development' ? err : {}
//   });
// });

// Error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      title: 'Error',
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err : {},
      cssFile: 'dashboard'
    });
  });
// Launch Chrome in incognito mode
const launchChrome = () => {
  // For Linux
  const command = 'google-chrome --incognito http://localhost:3000/admin';
  const chromeProcess = exec(command);
  
  // Handle process exit
  chromeProcess.on('close', () => {
    console.log('Browser closed, shutting down server');
    process.exit(0);
  });
};

module.exports = { app, server, launchChrome };
