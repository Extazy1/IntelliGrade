module.exports = {
  apps: [{
    name: 'edu-api',
    script: 'main.py',
    interpreter: 'python3',
    cwd: '/Users/xcw/Desktop/IntelliGrade/GenerateMaterialContent_and_PersonalizedFeedbackContent',
    env: {
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || 'sk-0417c99a0fa4443a9351febeb1e1b9e6',
      DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      PORT: '8000'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};

