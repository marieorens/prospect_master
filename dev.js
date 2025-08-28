const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Start backend
console.log('Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

// Start frontend
console.log('Starting frontend server...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true
});

// Log output
const logStream = fs.createWriteStream(path.join(logsDir, 'dev.log'), { flags: 'a' });

backend.stdout.on('data', (data) => {
  const output = `[BACKEND] ${data}`;
  console.log(output);
  logStream.write(output);
});

backend.stderr.on('data', (data) => {
  const output = `[BACKEND ERROR] ${data}`;
  console.error(output);
  logStream.write(output);
});

frontend.stdout.on('data', (data) => {
  const output = `[FRONTEND] ${data}`;
  console.log(output);
  logStream.write(output);
});

frontend.stderr.on('data', (data) => {
  const output = `[FRONTEND ERROR] ${data}`;
  console.error(output);
  logStream.write(output);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping servers...');
  backend.kill();
  frontend.kill();
  logStream.end();
  process.exit();
});

console.log('Development servers started');
console.log('Backend: http://localhost:4000');
console.log('Frontend: http://localhost:3000');