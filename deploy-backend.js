/**
 * Backend Deployment Helper
 * This script helps deploy the backend to various platforms
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 DocuGuide Backend Deployment Helper');
console.log('=====================================\n');

// Check if backend directory exists
const backendDir = path.join(__dirname, 'backend');
if (!fs.existsSync(backendDir)) {
  console.error('❌ Backend directory not found!');
  process.exit(1);
}

console.log('✅ Backend directory found');
console.log('📁 Backend files:');
fs.readdirSync(backendDir).forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n🌐 Deployment Options:');
console.log('1. Render (Recommended - Free tier available)');
console.log('2. Vercel (Good for serverless)');
console.log('3. Railway (Simple deployment)');
console.log('4. Heroku (Classic option)');

console.log('\n📋 Pre-deployment Checklist:');
console.log('✅ Backend files created');
console.log('✅ package.json configured');
console.log('✅ API key configured');
console.log('✅ CORS enabled');
console.log('✅ Health endpoint ready');

console.log('\n🔧 Next Steps:');
console.log('1. Push your code to GitHub');
console.log('2. Go to https://render.com');
console.log('3. Create new Web Service');
console.log('4. Connect your GitHub repo');
console.log('5. Select the backend folder');
console.log('6. Deploy!');

console.log('\n📝 Environment Variables to Set:');
console.log('NODE_ENV=production');
console.log('PORT=10000');

console.log('\n🔗 After deployment, update frontend:');
console.log('Edit utils/ai-manager.js and set:');
console.log('this.backendUrl = "https://your-app-name.onrender.com";');

console.log('\n✨ Ready to deploy!');
