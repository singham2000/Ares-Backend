const S3 = require("aws-sdk/clients/s3");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

exports.s3Uploadv2 = async (file, id) => {
    const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_BUCKET_REGION,
    });

    if (file.mimetype.split("/")[0] === "video") {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `uploads/videos/${Date.now().toString()}-${file.originalname}`,
            Body: file.buffer,
        };

        return await s3.upload(params).promise();
    }

    if (file.mimetype.split("/")[0] === "image") {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `uploads/profiles/${Date.now().toString()}-${file.originalname}`,
            Body: file.buffer,
        };

        return await s3.upload(params).promise();
    }
};

exports.s3UpdateImage = async (file, oldFile) => {
    const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_BUCKET_REGION,
    });

    const key1 = oldFile.split("/")[2];
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/profiles/${key1}`,
    };

    await s3.deleteObject(param).promise();

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/profiles/${Date.now().toString()}-${file.originalname}`,
        Body: file.buffer,
    };

    return await s3.upload(params).promise();
};