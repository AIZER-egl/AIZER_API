let letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz0123456789!"#$%&/()=?¡¿@[]{}*+-_.,;: ';
let target = 'Hello, World!';

let index = 0;
let charIndex = 0;
let current = '';

let start = Date.now();

let interval = setInterval(() => {
    process.stdout.write('\r' + current + letras[index]);
    if (letras[index] == target[charIndex]) {
        current += letras[index];
        charIndex++;
        index = 0;
    }
    if (current == target) {
        clearInterval(interval);
        process.stdout.write(`\nProcess finished in ${Date.now() - start}ms\n`);
    }
    index++;
}, 1);
