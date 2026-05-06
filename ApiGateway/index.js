const express = require('express')
const axios = require('axios')
const cors = require('cors')
const { register, trackRequest } = require('./instrumentation');

const app = express()
const QUOTES_API = process.env.QUOTES_API

app.use(cors())
app.use(trackRequest);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'ok' })
})

app.get('/api/randomquote', async (req, res) => {
    try {
        const quote = await axios.get(`${QUOTES_API}/api/quote`)
        res.json({ time: Date.now(), quote: quote.data })
    } catch (err) {
        console.error(err.message)
        res.status(500).json({ message: 'Internal server error' })
    }
})

app.get('/slow', async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    res.json({ message: 'slow response' })
})

app.get('/error', (req, res) => {
    res.status(500).json({ message: 'boom' })
})

app.get('*', (req, res) => {
    res.status(404).json({ message: 'Resource not found' })
})

app.listen(3000, () => {
    console.log('API Gateway listening on 3000')
})
