import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'A MONGODB_URI nincs beállítva a .env fájlban.'
    );
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    'MongoDB-kapcsolat létrejött:',
    mongoose.connection.name
  );
}