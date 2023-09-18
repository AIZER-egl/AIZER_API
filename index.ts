import app from './src/app/server';
import mongoose from './src/app/mongoose';

process.stdout.write('Starting server... ');
app.listen(app.get('port'), () => {
    process.stdout.write(`\rServer listening on port ${app.get('port')}\n`);
    mongoose();
});

process.stdin.on('data', (data) => {
    if (data.toString() == 'rs') return;
    
    if (data.toString() == 'exit') {
        process.stdout.write('\nStopping server... ');
        process.exit(0);
    }

    try {
        const result = eval(data.toString());
        console.log(result);
    } catch (e) {
        console.log(e);
    }
});

process.on('rejectionHandled', (error) => {
    console.warn(error);
});

process.on('uncaughtException', (error) => {
    console.error(error);
});

process.on('unhandledRejection', (error) => {
    console.warn(error);
});