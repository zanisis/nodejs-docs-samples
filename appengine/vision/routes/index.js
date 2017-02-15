/**
 * Copyright 2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express');
const Multer  = require('multer')
const router = express.Router();
const upload = Multer({
  storage: Multer.memoryStorage(),
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

// Settings
const CLOUD_STORAGE_BUCKET='anassri-nodejs-starter-images';

// Require Google Cloud components
const Storage = require('@google-cloud/storage');
const Datastore = require('@google-cloud/datastore');
const Vision = require('@google-cloud/vision');

// Initialize Google Cloud clients
const storageClient = Storage();
const datastoreClient = Datastore();
const visionClient = Vision();

router.get('/', (req, res) => {
  // Retrieve Cloud Storage bucket object
  const bucket = storageClient.bucket(CLOUD_STORAGE_BUCKET);

  // Get files in bucket
  bucket.getFiles().then((data) => {

    const files = data[0];
    const images = files.map((file) => `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET}/${file.name}`)

    // Get URL for a file
    //const url = files[0].getSignedUrl({action: 'read'}, (err, url) => {
    res.render('index', {
      images: images
    });

  });
});

router.post('/upload_photo', upload.single('photo'),

  // Upload an image to Cloud Storage
  (req, res, next) => {
    // Retrieve reference to Cloud Storage bucket
    const bucket = storageClient.bucket(CLOUD_STORAGE_BUCKET);

    // Retrieve reference to upload target in Cloud Storage
    const file = bucket.file(req.file.originalname);

    // Configure image upload stream
    const stream = file.createWriteStream({
      resumable: false,
      predefinedAcl: "publicRead",
      metadata: {
        contentType: req.file.mimetype
      }
    });
    
    // Write image to GCS
    stream.end(req.file.buffer);

    // Handle uploading errors
    stream.on('error', (err) => {
      res.status(500).send(`Could not upload image: ${err}`);
    });

    // Handle successful upload
    stream.on('finish', () => {
      next();
    });
  },

  // Analyze the uploaded image with Cloud Vision
  (req, res, next) => {
    // Retrieve Cloud Storage bucket object
    const bucket = storageClient.bucket(CLOUD_STORAGE_BUCKET);

    // Retrieve reference to uploaded image in Cloud Storage
    const file = bucket.file(req.file.originalname);

    // Detect faces in the Cloud Storage image
    console.log('foo')
    visionClient.detectFaces(file)
      .then((data) => {
        const faces = data[0];
        res.isJoyful = faces[0].joy;
        next();
      })
      .catch((err) => {
        res.status(500).send(`Could not detect faces: ${err}`);
      })

    res.redirect('/');
  },
  
  // Store the face detection results in Cloud Datastore
  (req, res, next) => {

  }
);

module.exports = router;
