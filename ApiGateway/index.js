const express = require('express')
const axios = require('axios')
const cors = require('cors')

const app = express()
const QUOTES_API = process.env.QUOTES_API

app.use(cors())

let requestsTotal = 0
const startTime = Date.now()
app.use((req, res, next) => {
    requestsTotal++
    next()
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.get('/metrics', (req, res) => {
    const uptime = (Date.now() - startTime) / 1000
    res.type('text/plain')
    res.send(
        `# HELP app_requests_total Total HTTP requests received\n` +
        `# TYPE app_requests_total counter\n` +
        `app_requests_total ${requestsTotal}\n` +
        `# HELP app_uptime_seconds Process uptime in seconds\n` +
        `# TYPE app_uptime_seconds gauge\n` +
        `app_uptime_seconds ${uptime}\n`
    )
})

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

app.get('*', (req, res) => {
    res.status(404).json({ message: 'Resource not found' })
})

app.listen(3000, () => {
    console.log('API Gateway listening on 3000')
})
