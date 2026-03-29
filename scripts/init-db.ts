import { initDatabase } from '../lib/db/schema';
import { seedDatabase } from '../lib/db/seed';
import fs from 'fs';
import path from 'path';

async function init() {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const adminEmail = getArg('--email');
  const adminPassword = getArg('--password');

  if (!adminEmail || !adminPassword) {
    console.error('❌ Missing required arguments.');
    console.error('   Usage: npm run init-db -- --email <email> --password <password>');
    process.exit(1);
  }

  console.log('🚀 Initializing Kiosk Complaint System...\n');
  
  // Create data directory
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Data directory created');
  }
  
  // Create uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
  }
  
  // Initialize database
  initDatabase();
  
  // Seed database
  await seedDatabase(adminEmail, adminPassword);
  
  console.log('\n✅ System initialization complete!');
  console.log('\nYou can now start the development server with: npm run dev');
}

init().catch(console.error);
