import { app } from './app.js';
import 'dotenv/config';
import { connectDatabase } from './config/db.js';
import mongoose from 'mongoose';


async function startServer() {
  await connectDatabase();

  const port = Number(process.env.PORT) || 3001;

  app.listen(port, () => {
    console.log(`Backend: http://localhost:${port}`);
  });
}

startServer().catch(async error => {
  console.error(
    'A backend nem indult el:',
    error instanceof Error
      ? error.message
      : 'Ismeretlen hiba.'
  );

  await mongoose.disconnect();
  process.exitCode = 1;
});