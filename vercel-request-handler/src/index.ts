import express, { Request, Response, NextFunction } from 'express';
import { S3 } from "aws-sdk";
import path from 'path';

const s3 = new S3({
    accessKeyId: "8bfce4e233e69e02ebfb9d660ea123c1",
    secretAccessKey: "668b9cbe3867152bebec79bbdc3fd59a0b89a007e11a471aeb05c4e6b706ca68",
    endpoint: "https://f5db24438ba194a3ef442863bdbbdd9c.r2.cloudflarestorage.com"
})

const app = express();

app.get('/*', async (req: Request, res: Response, next: NextFunction) => {
    const host = req.hostname;
    const id = host.split('.')[0];
    const filePath = req.path === '/' ? '/index.html' : req.path;

    try {
        const contents = await s3.getObject({
            Bucket: 'vercel',
            Key: `dist/${id}${filePath}`
        }).promise();

        const type = filePath.endsWith('.html') ? 'text/html' : filePath.endsWith('.css') ? 'text/css' : 'application/javascript';
        res.set('Content-Type', type);

        res.send(contents.Body);
    } catch (error: any) {
        console.error('Error fetching from S3:', error);
        // If file not found, serve custom 404 page
        if (error.code === 'NoSuchKey') {
            const errorPagePath = path.join(__dirname, '404.html');
            res.status(404).sendFile(errorPagePath);
        } else {
            res.status(500).send('Internal server error');
        }
    }
});

// Keep the server running even if there's an unhandled error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Internal server error');
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
