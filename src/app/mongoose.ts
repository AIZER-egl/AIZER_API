import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export default async function () {
    process.stdout.write('Connecting to MongoDB... ');
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI!);
        process.stdout.write(`\rConnected to the MongoDB database at ${connection.connection.db.databaseName}\n`);
    } catch (e) {
        process.stdout.write('Failed!\n');
        console.log(e);
        process.exit(1);
    }
}