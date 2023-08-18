const port = 4000;

import express from 'express';

const app = express();
app.get('/', (req, res) => {
    res.send('Welkom! Gebruik de specifieke link voor de speler om te starten.')
});

app.listen(port, () => {
    console.log('Web player listening on port 4000')
});

app.get('/player/:id', (req, res) => {
    const id = req.params.id;
    res.send(id);
});