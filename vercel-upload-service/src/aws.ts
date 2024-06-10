import { S3 } from "aws-sdk";
import fs from "fs";

const s3 = new S3({
    accessKeyId: "8bfce4e233e69e02ebfb9d660ea123c1",
    secretAccessKey: "668b9cbe3867152bebec79bbdc3fd59a0b89a007e11a471aeb05c4e6b706ca68",
    endpoint: "https://f5db24438ba194a3ef442863bdbbdd9c.r2.cloudflarestorage.com"
})

// fileName => output/12312/src/App.jsx
// filePath => /Users/harkiratsingh/vercel/dist/output/12312/src/App.jsx
export const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: fileName,
    }).promise();
    console.log(response);
}
